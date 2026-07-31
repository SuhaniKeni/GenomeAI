import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Trash2, FileText, Clock, RefreshCw, AlertCircle, CheckCircle2, Eye, Dna, FileCheck, Download, Filter, X
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useToast } from '../context/ToastContext';
import { fetchHistory, deleteHistoryRecord, downloadPredictionReport } from '../api/client';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory({ limit: 100, search: searchTerm });
      const records = data.records || data.items || [];
      setHistoryItems(records);
      setTotal(data.total ?? records.length);
    } catch (err) {
      showError('Unable to connect to LIS database.');
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
      showSuccess(`Deleted analysis record ANL-${id}`);
    } catch (err) {
      showError('Failed to delete history record.');
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
      showSuccess(`Downloaded PDF Report for ANL-${item.id}`);
    } catch {
      showError('Could not generate PDF report for this record.');
    }
  };

  const exportToCSV = () => {
    if (historyItems.length === 0) return;
    const headers = ['ID', 'Disease', 'Confidence', 'Confidence Level', 'Sequence Length', 'Timestamp'];
    const rows = historyItems.map((item) => [
      `ANL-${item.id}`,
      `"${item.predicted_disease}"`,
      `${item.confidence}%`,
      `"${item.confidence_level}"`,
      item.sequence_length || item.sequence?.length || 201,
      `"${item.created_at || item.timestamp || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GenomeAI_History_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Exported history records to CSV!');
  };

  return (
    <PageLayout
      title="Analysis History Archive"
      subtitle="Audited LIS database repository of AI-supported genomic disease risk classifications"
      action={
        <div className="flex items-center gap-3">
          <GradientButton variant="glass" size="sm" onClick={exportToCSV} icon={Download}>
            Export CSV
          </GradientButton>
          <GradientButton variant="cyan" size="sm" onClick={loadHistory} icon={RefreshCw}>
            Refresh
          </GradientButton>
        </div>
      }
    >
      {/* Search & Filter Toolbar */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by disease, ID, or gene..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing <strong className="text-white">{historyItems.length}</strong> of <strong className="text-cyan-400">{total}</strong> records</span>
          </div>
        </div>
      </GlassCard>

      {/* History Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Analysis ID</th>
                <th className="py-3.5 px-4">Predicted Disease</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Confidence Level</th>
                <th className="py-3.5 px-4">Sequence Length</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                    Loading LIS audit history...
                  </td>
                </tr>
              ) : historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      ANL-{item.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.predicted_disease}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {item.confidence}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {item.confidence_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {item.sequence_length || item.sequence?.length || 201} bp
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {item.created_at || item.timestamp || 'Recently'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(item)}
                          className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 transition-colors"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 hover:text-rose-300 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No history records found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Record Inspect Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative max-w-2xl w-full glass-panel rounded-3xl p-6 border border-cyan-500/30 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🧬</span> Analysis Details: ANL-{selectedRecord.id}
                  </h3>
                  <p className="text-xs text-slate-400">Recorded on {selectedRecord.created_at || selectedRecord.timestamp || 'Recent'}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Predicted Disease</span>
                  <span className="text-sm font-bold text-cyan-400">{selectedRecord.predicted_disease}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Confidence Score</span>
                  <span className="text-sm font-bold text-emerald-400">{selectedRecord.confidence}% ({selectedRecord.confidence_level})</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">DNA Sequence (201 bp)</span>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800 break-all max-h-32 overflow-y-auto">
                  {selectedRecord.sequence}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <GradientButton variant="emerald" size="sm" onClick={() => handleDownloadReport(selectedRecord)} icon={FileText}>
                  Download PDF Report
                </GradientButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}