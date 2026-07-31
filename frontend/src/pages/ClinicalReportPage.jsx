import React, { useState } from 'react';
import {
  FileText, Download, Dna, ShieldCheck, User, Sparkles, AlertCircle, CheckCircle2, FileCheck
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useToast } from '../context/ToastContext';
import { downloadPredictionReport } from '../api/client';

const SAMPLE_201_SEQUENCE =
  'A'.repeat(50) + 'T'.repeat(50) + 'G'.repeat(50) + 'C'.repeat(50) + 'A';

export default function ClinicalReportPage() {
  const { showSuccess, showError } = useToast();
  const [sampleId, setSampleId] = useState('SAM-982104');
  const [patientName, setPatientName] = useState('Jane Doe (Ref: PAT-884)');
  const [sequence, setSequence] = useState(SAMPLE_201_SEQUENCE);
  const [loading, setLoading] = useState(false);

  const cleanSeq = String(sequence || '').replace(/\s+/g, '').toUpperCase();
  const isValidLength = cleanSeq.length === 201;

  const handleGeneratePDF = async () => {
    if (!cleanSeq || !isValidLength) {
      showError('Please provide a valid 201-nucleotide sequence.');
      return;
    }

    setLoading(true);
    try {
      const blob = await downloadPredictionReport(cleanSeq, {
        model: 'cnn',
        patientName: patientName || `Sample: ${sampleId}`,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GenomeAI_Clinical_Report_${sampleId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      showSuccess('Downloaded Clinical PDF Report!');
    } catch {
      showError('Failed to generate PDF report from backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Clinical PDF Report Center"
      subtitle="Synthesize vector-styled ReportLab medical PDF reports containing disease predictions, confidence metrics, and LIS disclaimers"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Config */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Medical Report Parameters
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Specimen Code / Sample ID
                  </label>
                  <input
                    type="text"
                    value={sampleId}
                    onChange={(e) => setSampleId(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Patient / Subject Reference
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Target DNA Sequence (201 bp Required)
                </label>
                <textarea
                  rows={6}
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/60 leading-relaxed custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Sequence Window Length:</span>
                <span className={`font-mono font-bold ${isValidLength ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cleanSeq.length} / 201 bp
                </span>
              </div>

              <GradientButton
                variant="cyan"
                size="lg"
                onClick={handleGeneratePDF}
                loading={loading}
                disabled={!isValidLength}
                icon={Download}
                className="w-full justify-center mt-2"
              >
                Generate & Streaming Download PDF Report
              </GradientButton>
            </div>
          </GlassCard>
        </div>

        {/* Right Col: Report Features & Disclaimers */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Report Specification
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>ReportLab 4.1+ High-resolution vector PDF</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Multi-class probability distribution bar chart</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>ISO-15189 LIS laboratory verification metadata</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Clinical disclaimers & digital signing block</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </PageLayout>
  );
}
