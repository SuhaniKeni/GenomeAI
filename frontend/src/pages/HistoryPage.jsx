import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Trash2, FileText, Clock, RefreshCw, AlertCircle, CheckCircle2, Eye, Dna, FileCheck, Download, Filter, X, FileSpreadsheet
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
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
      item.sequence_length || 201,
      `"${item.created_at || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GenomeAI_Audit_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showSuccess('Exported Audit Log to CSV!');
  };

  return (
    <PageLayout
      title="Genomic Analysis History"
      subtitle="Complete database audit trail of processed DNA sequences, prediction scores, and clinical reports"
    >
      <Card>
        <CardHeader
          title="Analysis History Log"
          subtitle={`Total Logged Predictions: ${total}`}
          icon={Clock}
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={exportToCSV} isDisabled={historyItems.length === 0}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadHistory} isLoading={loading}>
                Refresh
              </Button>
            </div>
          }
        />

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prediction history by disease name or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Disease Variant</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">ANL-{item.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{item.predicted_disease}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success" size="sm">{item.confidence}%</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" size="sm">{item.confidence_level}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{item.created_at || 'Recently'}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" icon={Eye} onClick={() => setSelectedRecord(item)}>
                        Details
                      </Button>
                      <Button variant="ghost" size="sm" icon={Download} onClick={() => handleDownloadReport(item)}>
                        PDF
                      </Button>
                      <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(item.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      icon={Clock}
                      title="No Analysis History Found"
                      description="No records match your filter criteria. Execute a new DNA analysis to populate your log."
                      actionLabel="New Analysis"
                      onAction={() => navigate('/analysis')}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Analysis Record ANL-${selectedRecord?.id}`}
        subtitle="Detailed genomic diagnostic summary"
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Disease Variant:</span>
                <span className="font-bold text-emerald-400">{selectedRecord.predicted_disease}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-bold text-slate-100">{selectedRecord.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence Level:</span>
                <span className="font-bold text-cyan-400">{selectedRecord.confidence_level}</span>
              </div>
            </div>

            <div>
              <span className="block text-slate-400 mb-1 font-bold">DNA Sequence:</span>
              <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                {selectedRecord.sequence}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}