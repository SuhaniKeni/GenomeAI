import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Trash2, FileText, Clock, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import { fetchHistory, deleteHistoryRecord, downloadPredictionReport } from '../api/client.js';
import styles from './HistoryPage.module.css';


export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchHistory({ limit: 100, search: searchTerm });
      setHistoryItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError('Could not load prediction history from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete analysis record #${id}?`)) return;
    try {
      await deleteHistoryRecord(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setError('Failed to delete history record.');
    }
  };

  const handleDownloadReport = async (item) => {
    try {
      const blob = await downloadPredictionReport(item.sequence, {
        model: 'cnn',
        patientName: `Sample ID: SAM-${item.id}`,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GenomeAI_Report_ANL-${item.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not generate PDF report for this record.');
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>

        <div className={styles.headerRow}>
          <div>
            <span className={styles.kicker}>Laboratory Audit Log</span>
            <h1>Analysis History Archive</h1>
            <p>
              Search, filter, and inspect past AI-supported genomic analysis records stored in the LIS database.
            </p>
          </div>
          <div className={styles.totalBadge}>
            <strong>{total}</strong> Records Archived
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by disease or sequence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="button" className={styles.refreshBtn} onClick={loadHistory}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Analysis ID</th>
                  <th>Sample Sequence Snippet</th>
                  <th>Predicted Disease</th>
                  <th>Confidence Score</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      Loading analysis records...
                    </td>
                  </tr>
                ) : historyItems.length > 0 ? (
                  historyItems.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.idCell}>
                        <strong>ANL-{item.id}</strong>
                      </td>
                      <td className={styles.seqCell}>
                        <code>{item.sequence ? item.sequence.slice(0, 30) + '...' : '201 bp'}</code>
                      </td>
                      <td className={styles.diseaseCell}>
                        <strong>{item.predicted_disease}</strong>
                      </td>
                      <td>
                        <span className={styles.confBadge}>{item.confidence}%</span>
                      </td>
                      <td className={styles.dateCell}>{item.created_at || 'Recently'}</td>
                      <td>
                        <span className={styles.statusOk}>
                          <CheckCircle2 size={12} /> Archived
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.pdfBtn}
                            onClick={() => handleDownloadReport(item)}
                            title="Download PDF Report"
                          >
                            <FileText size={14} /> PDF
                          </button>
                          <button
                            type="button"
                            className={styles.delBtn}
                            onClick={() => handleDelete(item.id)}
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No analysis records found. Perform a sequence prediction to build history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}