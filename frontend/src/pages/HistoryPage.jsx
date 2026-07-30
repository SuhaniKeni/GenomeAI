import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Trash2, FileText, Clock, RefreshCw, AlertCircle, CheckCircle2, Eye, Dna, FileCheck
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import HistoryDetailsModal from '../components/History/HistoryDetailsModal.jsx';
import { fetchHistory, deleteHistoryRecord, downloadPredictionReport } from '../api/client.js';
import styles from './HistoryPage.module.css';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[HistoryPage Debug] Requesting history records for search term:', searchTerm);
      const data = await fetchHistory({ limit: 100, search: searchTerm });
      const records = data.records || data.items || [];
      console.log('[HistoryPage Debug] History loaded successfully. Records count:', records.length, '| Total count:', data.total);
      setHistoryItems(records);
      setTotal(data.total ?? records.length);
      setError(null);
    } catch (err) {
      console.error('[HistoryPage Debug] Error fetching history:', err);
      const reasonMsg =
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to connect to the GenomeAI backend server.';
      setError(reasonMsg);
      setHistoryItems([]);
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
    } catch (err) {
      alert('Failed to delete history record.');
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
      alert('Could not generate PDF report for this record.');
    }
  };

  const handleInspectRecord = (item) => {
    setSelectedRecord(item);
    setIsModalOpen(true);
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
            <strong>{loading ? '...' : total}</strong> Records Archived
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
            <button type="button" className={styles.refreshBtn} onClick={loadHistory} disabled={loading}>
              <RefreshCw size={14} className={loading ? styles.spinIcon : ''} /> Refresh
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Analysis ID</th>
                  <th>Sequence Snippet</th>
                  <th>Predicted Disease</th>
                  <th>Confidence</th>
                  <th>Supporting Evidence Match</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  /* 1. LOADING STATE ONLY */
                  <tr>
                    <td colSpan={8} className={styles.emptyCell}>
                      <div className={styles.stateBox}>
                        <RefreshCw size={24} className={styles.spinIcon} style={{ color: 'var(--genome-blue, #3A6FD8)' }} />
                        <span style={{ fontWeight: 600, marginTop: '8px' }}>Loading analysis records from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  /* 2. ERROR STATE ONLY */
                  <tr>
                    <td colSpan={8} className={styles.errorCell}>
                      <div className={styles.errorDisplayBox}>
                        <AlertCircle size={28} className={styles.errorIcon} />
                        <h4 className={styles.errorTitle}>Unable to retrieve analysis history.</h4>
                        <p className={styles.errorReason}>
                          <strong>Reason:</strong> {error}
                        </p>
                        <button type="button" className={styles.retryBtn} onClick={loadHistory}>
                          <RefreshCw size={14} /> Retry Connection
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : historyItems.length === 0 ? (
                  /* 3. EMPTY STATE ONLY (When request succeeded with 0 records) */
                  <tr>
                    <td colSpan={8} className={styles.emptyCell}>
                      <div className={styles.stateBox}>
                        <Clock size={28} style={{ color: 'var(--text-secondary, #718096)' }} />
                        <span style={{ fontWeight: 600, marginTop: '8px' }}>No analysis records found.</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #718096)', margin: '4px 0 0 0' }}>
                          Perform a sequence prediction to build history.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* 4. SUCCESS STATE (Render Data Rows) */
                  historyItems.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.idCell}>
                        <strong>ANL-{item.id}</strong>
                      </td>
                      <td className={styles.seqCell}>
                        <code>{item.sequence ? item.sequence.slice(0, 24) + '...' : '201 bp'}</code>
                      </td>
                      <td className={styles.diseaseCell}>
                        <strong>{item.predicted_disease}</strong>
                      </td>
                      <td>
                        <span className={styles.confBadge}>{item.confidence}%</span>
                      </td>
                      <td>
                        {item.blast?.top_hit ? (
                          <span style={{ color: 'var(--genome-blue, #3A6FD8)', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Dna size={12} />
                            {item.blast.top_hit.gene} ({item.blast.top_hit.identity}%)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary, #718096)', fontSize: '0.8rem' }}>No Match</span>
                        )}
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
                            onClick={() => handleInspectRecord(item)}
                            title="View Prediction Analysis"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            type="button"
                            className={styles.pdfBtn}
                            onClick={() => {
                              navigate('/evidence', {
                                state: {
                                  predictionResult: item,
                                  blastData: item.blast,
                                  sequence: item.sequence,
                                  timestamp: item.timestamp,
                                }
                              });
                            }}
                            title="View Supporting Evidence"
                          >
                            <FileCheck size={14} /> Evidence
                          </button>
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
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <HistoryDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        onDownloadPDF={handleDownloadReport}
      />
    </div>
  );
}