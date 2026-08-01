import React, { useState } from 'react';
import {
  FileText, Download, Dna, ShieldCheck, User, Sparkles, AlertCircle, CheckCircle2, FileCheck, ExternalLink
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import Card, { CardHeader, CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
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
      title="Clinical Report Generator"
      subtitle="Synthesize vector-styled ReportLab medical PDF reports containing disease predictions, confidence metrics, and LIS disclaimers"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Config */}
        <div className="lg:col-span-2 space-y-6">
          <Card gradient glow>
            <CardHeader title="Medical Report Parameters" subtitle="Configure sample identifiers and DNA input" icon={FileText} />

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                    Specimen Code / Sample ID
                  </label>
                  <input
                    type="text"
                    value={sampleId}
                    onChange={(e) => setSampleId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                    Patient / Subject Reference
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Target Sequence (201-bp Window)
                </label>
                <textarea
                  rows={4}
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
                <div className="flex justify-between items-center mt-1 text-[11px]">
                  <span className={isValidLength ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    Length: {cleanSeq.length} / 201 bp
                  </span>
                  {!isValidLength && <span className="text-rose-400">Must be exactly 201 bp for analysis</span>}
                </div>
              </div>

              <Button
                variant="gradient"
                size="lg"
                icon={Download}
                onClick={handleGeneratePDF}
                isLoading={loading}
                isDisabled={!isValidLength}
                className="w-full justify-center text-sm"
              >
                Generate Vector PDF Clinical Report
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Preview Side Panel */}
        <div>
          <Card>
            <CardHeader title="Report Document Structure" subtitle="ReportLab vector rendering specifications" icon={ShieldCheck} />

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Format Standard:</span>
                  <Badge variant="cyan" size="sm">PDF / A-3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Security Hash:</span>
                  <span className="font-mono text-[10px] text-emerald-400">SHA256-V2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Genomic Evidence:</span>
                  <Badge variant="success" size="sm">Included</Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5 text-slate-100">
                  <FileCheck className="w-4 h-4 text-emerald-400" /> Physician Clinical Disclaimer
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Reports generated by GenomeAI are intended for diagnostic support by licensed geneticists and medical personnel.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
