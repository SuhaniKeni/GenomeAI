import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Sparkles, FileText, ShieldCheck, Dna, Activity,
  Clock, CheckCircle2, AlertCircle, RefreshCw, User, Folder, FileSpreadsheet,
  Database, BookOpen, Award
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import DNAStatsWidget from '../components/DNAStatsWidget.jsx';
import ProbabilityChart from '../components/ProbabilityChart.jsx';
import AnalysisProgressModal from '../components/AnalysisProgressModal.jsx';
import SupportingEvidenceSummary from '../components/Predict/SupportingEvidenceSummary.jsx';

import { predictSequence, downloadPredictionReport, fetchHealth, runBlastSearch, fetchModelMetrics } from '../api/client.js';
import styles from './PredictPage.module.css';


const SAMPLE_201_SEQUENCE =
  'A'.repeat(50) + 'T'.repeat(50) + 'G'.repeat(50) + 'C'.repeat(50) + 'A';

function normalizeSequence(text) {
  return String(text || '')
    .replace(/^>.*$/gm, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export default function PredictPage() {
  // Sample Metadata State
  const [sampleId, setSampleId] = useState(`SAM-${Math.floor(100000 + Math.random() * 900000)}`);
  const [patientId, setPatientId] = useState('');
  const [projectName, setProjectName] = useState('Oncology Genomic Screening Study');
  const [operatorName, setOperatorName] = useState('Lab Technician');
  const [notes, setNotes] = useState('');
  const [modelMetrics, setModelMetrics] = useState(null);

  useEffect(() => {
    fetchModelMetrics()
      .then((res) => {
        if (res && res.available !== false && res.accuracy) {
          setModelMetrics(res);
        }
      })
      .catch(() => setModelMetrics(null));
  }, []);

  // DNA Input & Engine State
  const [sequence, setSequence] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('Checking...');

  // Analysis Result State
  const [result, setResult] = useState(null);
  const [isRetryingBlast, setIsRetryingBlast] = useState(false);

  const handleRetryBlast = async () => {
    if (!sequence) return;
    setIsRetryingBlast(true);
    try {
      const data = await runBlastSearch(normalizeSequence(sequence));
      setResult((prev) => (prev ? { ...prev, blast: data.blast } : prev));
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'NCBI Remote BLAST retry failed.';
      setResult((prev) =>
        prev
          ? {
              ...prev,
              blast: {
                status: 'failed',
                error: msg,
                query_length: normalizeSequence(sequence).length,
                top_hit: null,
              },
            }
          : prev
      );
    } finally {
      setIsRetryingBlast(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await fetchHealth();
        if (mounted) setApiStatus('Online');
      } catch {
        if (mounted) setApiStatus('Offline');
      }
    };
    check();
  }, []);

  const normalizedSeq = useMemo(() => normalizeSequence(sequence), [sequence]);
  const sequenceLength = normalizedSeq.length;

  const handleLoadSample = () => {
    setSequence(SAMPLE_201_SEQUENCE);
  };

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSequence(normalizeSequence(text));
  };

  const handleAnalyzeDNA = async () => {
    const cleaned = normalizeSequence(sequence);
    setError('');

    if (!cleaned) {
      setError('Please provide a DNA sequence before running analysis.');
      return;
    }

    if (cleaned.length !== 201) {
      setError(`GenomeAI CNN Engine requires exactly 201 nucleotides (current: ${cleaned.length}).`);
      return;
    }

    setIsAnalyzing(true);
    setProgressStep(1);

    try {
      // Step-by-step progress simulation for realistic LIS pipeline
      await new Promise((r) => setTimeout(r, 350));
      setProgressStep(2);
      await new Promise((r) => setTimeout(r, 350));
      setProgressStep(3);
      await new Promise((r) => setTimeout(r, 350));
      setProgressStep(4);

      // Execute CNN Engine call (using model='cnn' internally)
      const response = await predictSequence(cleaned, { model: 'cnn', explain: false });

      setProgressStep(5);
      await new Promise((r) => setTimeout(r, 350));
      setProgressStep(6);
      await new Promise((r) => setTimeout(r, 350));
      setProgressStep(7);
      await new Promise((r) => setTimeout(r, 300));
      setProgressStep(8);
      await new Promise((r) => setTimeout(r, 300));

      setResult({
        ...response.result,
        analysis_id: `ANL-${Math.floor(10000 + Math.random() * 90000)}`,
        sample_id: sampleId,
        patient_id: patientId || 'N/A',
        timestamp: new Date().toLocaleString(),
      });
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Laboratory analysis failed. Please verify API connection.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadPredictionReport(normalizedSeq, {
        model: 'cnn',
        patientName: patientId ? `Patient: ${patientId}` : `Sample: ${sampleId}`,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GenomeAI_Report_${sampleId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate PDF report.');
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setSequence('');
    setSampleId(`SAM-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>

        <div className={styles.headerRow}>
          <div>
            <div className={styles.kicker}>
              <Activity size={14} />
              <span>Molecular Biology LIS Studio</span>
            </div>
            <h1>New DNA Sequence Analysis</h1>
            <p>
              Execute AI-assisted disease association predictions using the validated GenomeAI 1D-CNN Laboratory Engine.
            </p>
          </div>
          <div className={styles.engineBadge}>
            <span className={`${styles.statusDot} ${apiStatus === 'Online' ? styles.online : styles.offline}`} />
            <span>GenomeAI Engine: {apiStatus}</span>
          </div>
        </div>

        {!result ? (
          <div className={styles.studioGrid}>
            {/* Left Panel: Sample Information */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <User size={18} className={styles.iconBlue} />
                <h3>Sample Information</h3>
              </div>

              <div className={styles.formGroup}>
                <label>Sample ID *</label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  placeholder="e.g. SAM-894210"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Subject / Patient ID (Optional)</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-2026-88"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Research Project</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Genomic Screening Study"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Operator Name</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Lab Technician"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Clinical Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add specimen details or sequencing run notes..."
                />
              </div>
            </div>

            {/* Center Panel: DNA Input & Live Statistics */}
            <div className={styles.panelMain}>
              <div className={styles.panelHeadBetween}>
                <div className={styles.panelHeadTitle}>
                  <Dna size={18} className={styles.iconBlue} />
                  <h3>DNA Sequence Window</h3>
                </div>
                <span className={sequenceLength === 201 ? styles.counterChipOk : styles.counterChipWarn}>
                  {sequenceLength} / 201 bp
                </span>
              </div>

              <textarea
                className={styles.sequenceArea}
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="Paste exactly 201 base pairs using nucleotides A, T, G, C, N..."
                rows={9}
              />

              <DNAStatsWidget sequence={sequence} />

              <div className={styles.inputControls}>
                <button type="button" className={styles.secondaryBtn} onClick={handleLoadSample}>
                  <Sparkles size={16} />
                  Load Sample (201 bp)
                </button>

                <label className={styles.uploadBtn}>
                  <Upload size={16} />
                  Upload FASTA / TXT
                  <input type="file" accept=".txt,.fasta,.fa,.fna,.seq" onChange={onFileChange} />
                </label>
              </div>

              {error && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Panel: Engine Readiness & Execution */}
            <div className={styles.panelRight}>
              <div className={styles.panelHead}>
                <ShieldCheck size={18} className={styles.iconBlue} />
                <h3>Engine Readiness</h3>
              </div>

              <div className={styles.engineCard}>
                <div className={styles.engineHeader}>
                  <strong>GenomeAI CNN Engine</strong>
                  <span className={styles.verBadge}>v2.0 Validated</span>
                </div>
                <p className={styles.engineDesc}>
                  Multi-scale 1D Convolutional Neural Network trained on genomic variant targets.
                </p>
                <div className={styles.specList}>
                  <div><span>Window:</span> <strong>201 bp</strong></div>
                  <div><span>Accuracy:</span> <strong>{modelMetrics ? `${modelMetrics.accuracy}% (Verified)` : 'Not Available'}</strong></div>
                  <div><span>Macro F1:</span> <strong>{modelMetrics ? `${modelMetrics.macro_f1}%` : 'N/A'}</strong></div>
                  <div><span>Latency:</span> <strong>{modelMetrics ? `~${modelMetrics.inference_time_ms} ms` : '~9.5 ms'}</strong></div>
                </div>
              </div>

              <button
                type="button"
                className={styles.primaryAnalyzeBtn}
                onClick={handleAnalyzeDNA}
                disabled={isAnalyzing}
              >
                <Sparkles size={18} />
                <span>Analyze DNA</span>
              </button>

              <div className={styles.disclaimerBox}>
                <ShieldCheck size={14} />
                <span>
                  <strong>Clinical Decision Support:</strong> Predictions are generated for laboratory research and must be interpreted alongside clinical findings by qualified personnel.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <motion.div
            className={styles.resultsContainer}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.resultsHeaderCard}>
              <div className={styles.resultMetaRow}>
                <div>
                  <span className={styles.resBadge}>Analysis Complete</span>
                  <h2>{result.predicted_disease}</h2>
                </div>
                <div className={styles.confHeroBubble}>
                  <span className={styles.confNum}>{result.confidence}%</span>
                  <span className={styles.confLabel}>Confidence ({result.confidence_level})</span>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div><span>Analysis ID:</span> <strong>{result.analysis_id}</strong></div>
                <div><span>Sample ID:</span> <strong>{result.sample_id}</strong></div>
                <div><span>Subject Ref:</span> <strong>{result.patient_id}</strong></div>
                <div><span>Processing Time:</span> <strong>{result.inference_time_ms} ms</strong></div>
                <div><span>Timestamp:</span> <strong>{result.timestamp}</strong></div>
                <div><span>Engine:</span> <strong>GenomeAI CNN v2.0</strong></div>
              </div>

              <div className={styles.actionRow}>
                <button type="button" className={styles.primaryAnalyzeBtnSmall} onClick={handleDownloadPDF}>
                  <FileText size={16} />
                  Download PDF Laboratory Report
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={handleNewAnalysis}>
                  <RefreshCw size={16} />
                  New DNA Analysis
                </button>
              </div>
            </div>

            <div className={styles.resultsSection}>
              <h3>Disease Probability Distribution</h3>
              <p className={styles.secSub}>
                Comparative classification across all 8 supported disease categories.
              </p>
              <ProbabilityChart
                predictions={result.all_predictions || []}
                topDisease={result.predicted_disease}
              />
            </div>

            {/* Supporting Evidence Summary Card */}
            <SupportingEvidenceSummary
              blastData={result.blast}
              predictionResult={result}
              sequence={normalizedSeq}
              isLoading={isRetryingBlast}
            />

            {/* Genomic Evidence Layer */}
            {result.evidence && (
              <div className={styles.evidenceCard}>
                <div className={styles.evidenceHeader}>
                  <div className={styles.evidenceTitleGroup}>
                    <h3>Genomic Evidence & Biological Interpretation</h3>
                    <p className={styles.secSub}>
                      Hybrid biological evidence combining local GenomeAI knowledge base, NCBI ClinVar, and NCBI Gene annotations.
                    </p>
                  </div>
                  <div className={styles.scorePillGroup}>
                    <span className={`${styles.scorePill} ${
                      result.evidence.evidence_score === 'Very Strong' ? styles.scoreVeryStrong :
                      result.evidence.evidence_score === 'Strong' ? styles.scoreStrong :
                      result.evidence.evidence_score === 'Moderate' ? styles.scoreModerate :
                      result.evidence.evidence_score === 'Limited' ? styles.scoreLimited :
                      styles.scoreNone
                    }`}>
                      <Award size={16} />
                      Evidence Score: {result.evidence.evidence_score}
                    </span>
                  </div>
                </div>

                {/* Verification Badges */}
                <div className={styles.badgeRow}>
                  {result.evidence.verified_badges?.local_genomeai && (
                    <span className={styles.badgeVerified}>
                      <CheckCircle2 size={14} />
                      ✓ Local GenomeAI Evidence
                    </span>
                  )}
                  {result.evidence.verified_badges?.clinvar && (
                    <span className={styles.badgeClinvar}>
                      <CheckCircle2 size={14} />
                      ✓ ClinVar Verified
                    </span>
                  )}
                  {result.evidence.verified_badges?.ncbi && (
                    <span className={styles.badgeNcbi}>
                      <CheckCircle2 size={14} />
                      ✓ NCBI Verified
                    </span>
                  )}
                  {result.evidence.verified_badges?.local_genomeai &&
                   !result.evidence.verified_badges?.clinvar &&
                   !result.evidence.verified_badges?.ncbi && (
                    <span className={styles.badgeOffline}>
                      Verified using GenomeAI Local Knowledge Base
                    </span>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className={styles.evidenceGrid}>
                  <div className={styles.evidenceGridItem}>
                    <span>Target Gene</span>
                    <strong>{result.evidence.gene} ({result.evidence.chromosome})</strong>
                  </div>
                  <div className={styles.evidenceGridItem}>
                    <span>Gene Coordinates</span>
                    <strong>{result.evidence.gene_coordinates}</strong>
                  </div>
                  <div className={styles.evidenceGridItem}>
                    <span>Variant Signature</span>
                    <strong>{result.evidence.variant}</strong>
                  </div>
                  <div className={styles.evidenceGridItem}>
                    <span>Clinical Significance</span>
                    <strong>{result.evidence.clinical_significance}</strong>
                  </div>
                  <div className={styles.evidenceGridItem}>
                    <span>Review Status</span>
                    <strong>{result.evidence.review_status}</strong>
                  </div>
                </div>

                {/* Evidence Details Cards */}
                <div className={styles.evidenceDetailGrid}>
                  {result.evidence.ncbi_evidence && (
                    <div className={styles.evidenceDetailCard}>
                      <h4><BookOpen size={16} /> NCBI Gene Annotation</h4>
                      <p><strong>Full Name:</strong> {result.evidence.ncbi_evidence.gene_name}</p>
                      <p><strong>Cytogenetic:</strong> {result.evidence.ncbi_evidence.cytogenetic_location}</p>
                      <p style={{ marginTop: '6px' }}>{result.evidence.ncbi_evidence.gene_summary}</p>
                    </div>
                  )}

                  {result.evidence.clinvar_evidence && (
                    <div className={styles.evidenceDetailCard}>
                      <h4><Database size={16} /> ClinVar Record</h4>
                      <p><strong>Accession:</strong> {result.evidence.clinvar_evidence.clinvar_accession}</p>
                      <p><strong>Submissions:</strong> {result.evidence.clinvar_evidence.supporting_submissions} supporting submitter(s)</p>
                      <p><strong>Consequence:</strong> {result.evidence.clinvar_evidence.molecular_consequence}</p>
                    </div>
                  )}
                </div>

                {/* Evidence Narrative Summary */}
                <div className={styles.evidenceSummaryBox}>
                  <strong>Evidence Interpretation Summary:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{result.evidence.evidence_summary}</p>
                </div>
              </div>
            )}

            <div className={styles.regulatoryBox}>
              <ShieldCheck size={18} />
              <div>
                <strong>Laboratory Regulatory Disclaimer</strong>
                <p>
                  This AI-assisted decision-support analysis is intended to support laboratory research and molecular interpretation. Predictions should always be reviewed alongside clinical findings and diagnostic procedures by qualified healthcare professionals.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <AnalysisProgressModal
        isOpen={isAnalyzing}
        currentStep={progressStep}
        error={error}
      />
    </div>
  );
}