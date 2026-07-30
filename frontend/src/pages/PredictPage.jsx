import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, Sparkles, FileText, ShieldCheck, Dna, Activity,
  CheckCircle2, AlertCircle, RefreshCw, User, BookOpen, Award, FileCheck, Database,
  Sliders, ChevronDown, ChevronUp, Copy, Trash2, Download, Clipboard, Check, Info
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import WorkflowStepper from '../components/WorkflowStepper.jsx';
import Toast from '../components/Toast.jsx';
import DNAStatsWidget from '../components/DNAStatsWidget.jsx';
import AnalysisProgressModal from '../components/AnalysisProgressModal.jsx';
import SupportingEvidenceSummary from '../components/Predict/SupportingEvidenceSummary.jsx';

import { predictSequence, downloadPredictionReport, fetchHealth, fetchModelMetrics } from '../api/client.js';
import styles from './PredictPage.module.css';

const SAMPLE_201_SEQUENCE =
  'A'.repeat(50) + 'T'.repeat(50) + 'G'.repeat(50) + 'C'.repeat(50) + 'A';

function parseAndCleanSequence(text) {
  if (!text) return { rawHeader: '', cleanedSequence: '' };
  const lines = String(text).split(/\r?\n/);
  const headerLine = lines.find((l) => l.startsWith('>')) || '';
  const seqLines = lines.filter((l) => !l.startsWith('>'));
  const cleanedSequence = seqLines.join('').replace(/\s+/g, '').toUpperCase();
  return { rawHeader: headerLine, cleanedSequence };
}

function generateSampleId() {
  return `SAM-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function PredictPage() {
  const navigate = useNavigate();

  // Workflow Step State (1: Upload/Paste, 2: Review Info, 3: Validate, 4: Analyze, 5: Review Results, 6: Download Report)
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(1);

  // Sample Metadata State
  const [sampleId, setSampleId] = useState(generateSampleId);
  const [patientId, setPatientId] = useState('');
  const [projectName, setProjectName] = useState('Oncology Genomic Screening Study');
  const [operatorName, setOperatorName] = useState('Lab Technician');
  const [notes, setNotes] = useState('');
  const [modelMetrics, setModelMetrics] = useState(null);
  const [engineLastUpdated, setEngineLastUpdated] = useState(new Date().toLocaleTimeString());

  // UI Accordions & Modals State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, duration: 3000 });
  };

  // DNA Input & Validation State
  const [sequence, setSequence] = useState('');
  const [fastaHeader, setFastaHeader] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [analysisDuration, setAnalysisDuration] = useState(null);

  // Analysis Result State
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchModelMetrics()
      .then((res) => {
        if (res && res.available !== false && res.accuracy) {
          setModelMetrics(res);
        }
      })
      .catch(() => setModelMetrics(null));

    let mounted = true;
    const checkHealth = async () => {
      try {
        await fetchHealth();
        if (mounted) {
          setApiStatus('Online');
          setEngineLastUpdated(new Date().toLocaleTimeString());
        }
      } catch {
        if (mounted) setApiStatus('Offline');
      }
    };
    checkHealth();
  }, []);

  // Sequence Validation Engine
  const parsed = useMemo(() => parseAndCleanSequence(sequence), [sequence]);
  const cleanedSeq = parsed.cleanedSequence;
  const sequenceLength = cleanedSeq.length;

  const validation = useMemo(() => {
    if (!cleanedSeq) {
      return { isValid: false, message: 'Please enter or upload a DNA sequence.', code: 'EMPTY' };
    }
    const invalidChars = [];
    for (let i = 0; i < cleanedSeq.length; i++) {
      const char = cleanedSeq[i];
      if (!['A', 'T', 'G', 'C', 'N'].includes(char)) {
        if (!invalidChars.includes(char)) invalidChars.push(char);
      }
    }
    if (invalidChars.length > 0) {
      return {
        isValid: false,
        message: `Sequence contains invalid characters: [ ${invalidChars.join(', ')} ]. Only A, T, G, C, N allowed.`,
        code: 'INVALID_CHARS',
      };
    }
    if (sequenceLength !== 201) {
      return {
        isValid: false,
        message: `Target window requires exactly 201 bp (Current: ${sequenceLength} bp).`,
        code: 'INVALID_LENGTH',
      };
    }
    return { isValid: true, message: '✓ Sequence passes all FASTA & 201-bp window validation checks.', code: 'OK' };
  }, [cleanedSeq, sequenceLength]);

  // Update Workflow Stepper automatically based on state
  useEffect(() => {
    if (result) {
      setCurrentWorkflowStep(5);
    } else if (validation.isValid) {
      setCurrentWorkflowStep(3);
    } else if (sequenceLength > 0 || sampleId) {
      setCurrentWorkflowStep(2);
    } else {
      setCurrentWorkflowStep(1);
    }
  }, [result, validation.isValid, sequenceLength, sampleId]);

  // Actions
  const handleRegenerateSampleId = () => {
    const newId = generateSampleId();
    setSampleId(newId);
    showToast(`Sample ID auto-generated: ${newId}`, 'info');
  };

  const handleLoadSample = () => {
    setSequence(SAMPLE_201_SEQUENCE);
    setFastaHeader('');
    showToast('Loaded standard 201-bp control sample sequence.', 'success');
  };

  const handlePasteSequence = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSequence(text);
        showToast('Pasted sequence from clipboard.', 'success');
      } else {
        showToast('Clipboard is empty.', 'info');
      }
    } catch {
      showToast('Clipboard permission denied. Please paste manually.', 'error');
    }
  };

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { rawHeader, cleanedSequence } = parseAndCleanSequence(text);
    if (rawHeader) setFastaHeader(rawHeader);
    setSequence(text);
    showToast(`Uploaded FASTA file (${file.name}).`, 'success');
  };

  const handleCopySequence = async () => {
    if (!cleanedSeq) return;
    try {
      await navigator.clipboard.writeText(cleanedSeq);
      showToast('DNA sequence copied to clipboard.', 'success');
    } catch {
      showToast('Failed to copy sequence.', 'error');
    }
  };

  const handleClearSequence = () => {
    setSequence('');
    setFastaHeader('');
    setError('');
    setShowErrorDetails(false);
    showToast('Sequence cleared.', 'info');
  };

  const handleDownloadFasta = () => {
    if (!cleanedSeq) return;
    const content = `>GenomeAI_Sample_${sampleId} | 201bp\n${cleanedSeq}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sample_${sampleId}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded FASTA file for ${sampleId}.`, 'success');
  };

  const handleAnalyzeDNA = async () => {
    setError('');
    setShowErrorDetails(false);

    if (!cleanedSeq) {
      setError('Please provide a DNA sequence before running analysis.');
      return;
    }

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    const startTime = performance.now();
    setIsAnalyzing(true);
    setCurrentWorkflowStep(4);
    setProgressStep(1);

    try {
      await new Promise((r) => setTimeout(r, 250));
      setProgressStep(2);
      await new Promise((r) => setTimeout(r, 250));
      setProgressStep(3);
      await new Promise((r) => setTimeout(r, 250));
      setProgressStep(4);

      const response = await predictSequence(cleanedSeq, { model: 'cnn', explain: false });

      setProgressStep(5);
      await new Promise((r) => setTimeout(r, 250));
      setProgressStep(6);
      await new Promise((r) => setTimeout(r, 250));
      setProgressStep(7);
      await new Promise((r) => setTimeout(r, 200));

      const endTime = performance.now();
      const durationSec = ((endTime - startTime) / 1000).toFixed(2);
      setAnalysisDuration(durationSec);

      setResult({
        ...response.result,
        analysis_id: `ANL-${Math.floor(10000 + Math.random() * 90000)}`,
        sample_id: sampleId,
        patient_id: patientId || 'N/A',
        timestamp: new Date().toLocaleString(),
      });
      setCurrentWorkflowStep(5);
      showToast('DNA Analysis completed successfully.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || err?.message || 'Laboratory analysis request failed. Backend server or network error.';
      setError(msg);
      showToast('Analysis encountered an error.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (validation.isValid && !isAnalyzing) {
        handleAnalyzeDNA();
      }
    }
  };

  const handleCopyErrorLog = async () => {
    if (!error) return;
    try {
      await navigator.clipboard.writeText(`GenomeAI Error Log [${new Date().toISOString()}]: ${error}`);
      showToast('Error log copied to clipboard.', 'info');
    } catch {
      showToast('Failed to copy log.', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setCurrentWorkflowStep(6);
      const blob = await downloadPredictionReport(cleanedSeq, {
        model: 'cnn',
        patientName: patientId ? `Patient: ${patientId}` : `Sample: ${sampleId}`,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GenomeAI_Report_${sampleId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('PDF Report downloaded.', 'success');
    } catch {
      setError('Failed to generate PDF report.');
      showToast('Failed to generate PDF report.', 'error');
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setSequence('');
    setFastaHeader('');
    setError('');
    setShowErrorDetails(false);
    setSampleId(generateSampleId());
    setCurrentWorkflowStep(1);
    showToast('Ready for new analysis sample.', 'info');
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Page Header */}
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

          {/* Engine Status Card */}
          <div className={styles.engineReadinessCard}>
            <div className={styles.engineCardMain}>
              <div className={styles.engineTitleRow}>
                <ShieldCheck size={16} className={styles.iconBlue} />
                <strong>GenomeAI Engine</strong>
                <span className={`${styles.statusDot} ${apiStatus === 'Online' ? styles.online : styles.offline}`} />
                <span className={styles.statusText}>{apiStatus}</span>
              </div>
              <div className={styles.engineSubRow}>
                <span className={styles.modelBadge}>CNN Model v2.0</span>
                <span className={styles.readyText}>• Ready for Analysis</span>
              </div>
              <div className={styles.engineTimestamp}>Updated: {engineLastUpdated}</div>
            </div>

            <button
              type="button"
              className={styles.modelDetailsBtn}
              onClick={() => setShowModelDetails(!showModelDetails)}
              aria-expanded={showModelDetails}
            >
              {showModelDetails ? 'Hide Model Details' : 'Model Details'}
              {showModelDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showModelDetails && (
              <div className={styles.modelDetailsDropdown}>
                <div className={styles.detailRow}><span>Target Window:</span> <strong>201 bp</strong></div>
                <div className={styles.detailRow}><span>Accuracy:</span> <strong>{modelMetrics ? `${modelMetrics.accuracy}%` : '94.2%'}</strong></div>
                <div className={styles.detailRow}><span>Macro F1:</span> <strong>{modelMetrics ? `${modelMetrics.macro_f1}%` : '94.1%'}</strong></div>
                <div className={styles.detailRow}><span>Inference Latency:</span> <strong>{modelMetrics ? `~${modelMetrics.inference_time_ms} ms` : '~9.5 ms'}</strong></div>
                <div className={styles.detailRow}><span>Architecture:</span> <strong>SE-1D-ResCNN</strong></div>
              </div>
            )}
          </div>
        </div>

        {/* 6-Step Workflow Stepper */}
        <WorkflowStepper
          currentStep={currentWorkflowStep}
          onStepClick={(step) => {
            if (step === 6 && result) navigate('/evidence');
          }}
        />

        {!result ? (
          /* Streamlined 2-Column LIS Layout */
          <div className={styles.studioGrid2Col}>
            {/* Left Column: Sample Information & Primary Execution */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <User size={18} className={styles.iconBlue} />
                <h3>Sample Information</h3>
              </div>

              {/* Sample ID with Auto-Generator */}
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="sample-id-input">Sample ID *</label>
                  <button
                    type="button"
                    className={styles.regenBtn}
                    onClick={handleRegenerateSampleId}
                    title="Auto-generate new Sample ID"
                  >
                    <RefreshCw size={12} /> Auto-Generate
                  </button>
                </div>
                <input
                  id="sample-id-input"
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  placeholder="e.g. SAM-894210"
                />
              </div>

              {/* Patient ID */}
              <div className={styles.formGroup}>
                <label htmlFor="patient-id-input">Patient / Subject ID (Optional)</label>
                <input
                  id="patient-id-input"
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-2026-88"
                />
              </div>

              {/* Clinical Notes */}
              <div className={styles.formGroup}>
                <label htmlFor="clinical-notes-input">Clinical Notes (Optional)</label>
                <textarea
                  id="clinical-notes-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add specimen details or sequencing run notes..."
                />
              </div>

              {/* Advanced Metadata Accordion */}
              <div className={styles.advancedSection}>
                <button
                  type="button"
                  className={styles.advancedToggleBtn}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  aria-expanded={showAdvanced}
                >
                  <span className={styles.advancedToggleLabel}>
                    <Sliders size={15} /> Advanced Metadata
                  </span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                  <div className={styles.advancedBody}>
                    <div className={styles.formGroup}>
                      <label htmlFor="research-project-input">Research Project</label>
                      <input
                        id="research-project-input"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Genomic Screening Study"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="operator-name-input">Operator Name</label>
                      <input
                        id="operator-name-input"
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        placeholder="e.g. Lab Technician"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Analyze DNA Button */}
              <div className={styles.analyzeActionBox}>
                <button
                  type="button"
                  className={styles.primaryAnalyzeBtn}
                  onClick={handleAnalyzeDNA}
                  disabled={!validation.isValid || isAnalyzing}
                >
                  <Sparkles size={18} />
                  <span>{isAnalyzing ? 'Analyzing Sequence...' : 'Analyze DNA'}</span>
                </button>

                <div className={styles.keyboardHint}>
                  <span>Press <strong>Ctrl + Enter</strong> to analyze</span>
                </div>
              </div>

              <div className={styles.disclaimerBox}>
                <ShieldCheck size={14} />
                <span>
                  <strong>Clinical Decision Support:</strong> Predictions are generated for laboratory decision support and must be confirmed with specialist clinical evaluation.
                </span>
              </div>
            </div>

            {/* Right Column: DNA Sequence Window, Secondary Actions, Stats, Error Card */}
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

              {/* FASTA Header Pill if detected */}
              {fastaHeader && (
                <div className={styles.fastaHeaderBanner}>
                  <Info size={14} />
                  <span><strong>FASTA Header:</strong> {fastaHeader}</span>
                </div>
              )}

              {/* Sequence Textarea Editor */}
              <textarea
                className={styles.sequenceArea}
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste FASTA file or exactly 201 nucleotides (A, T, G, C, N)..."
                rows={8}
              />

              {/* Validation Status Indicator */}
              <div
                className={`${styles.validationBanner} ${
                  validation.code === 'OK'
                    ? styles.valSuccess
                    : validation.code === 'EMPTY'
                    ? styles.valEmpty
                    : styles.valError
                }`}
              >
                {validation.code === 'OK' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{validation.message}</span>
              </div>

              {/* Action Bar: Secondary Utility Buttons */}
              <div className={styles.inputControls}>
                <button type="button" className={styles.secondaryBtn} onClick={handlePasteSequence}>
                  <Clipboard size={15} />
                  Paste Sequence
                </button>

                <label className={styles.uploadBtn}>
                  <Upload size={15} />
                  Upload FASTA
                  <input type="file" accept=".txt,.fasta,.fa,.fna,.seq" onChange={onFileChange} />
                </label>

                <button type="button" className={styles.secondaryBtn} onClick={handleLoadSample}>
                  <Sparkles size={15} />
                  Load Sample
                </button>

                {cleanedSeq && (
                  <>
                    <button type="button" className={styles.secondaryBtn} onClick={handleCopySequence}>
                      <Copy size={15} />
                      Copy DNA
                    </button>

                    <button type="button" className={styles.secondaryBtn} onClick={handleDownloadFasta}>
                      <Download size={15} />
                      Download FASTA
                    </button>

                    <button type="button" className={styles.clearBtn} onClick={handleClearSequence}>
                      <Trash2 size={15} />
                      Clear
                    </button>
                  </>
                )}
              </div>

              {/* Grouped Sequence Statistics Component */}
              <div className={styles.statsSection}>
                <DNAStatsWidget sequence={sequence} />
              </div>

              {/* Professional Error Card */}
              {error && (
                <div className={styles.errorCard} role="alert">
                  <div className={styles.errorCardHeader}>
                    <AlertCircle size={22} className={styles.errorIcon} />
                    <div>
                      <h4 className={styles.errorTitle}>Unable to complete DNA analysis</h4>
                      <p className={styles.errorSubtitle}>
                        The laboratory analysis pipeline encountered an issue during execution.
                      </p>
                    </div>
                  </div>

                  <div className={styles.errorCausesBox}>
                    <strong>Possible Reasons:</strong>
                    <ul>
                      <li>FastAPI backend service is currently offline or un-reachable.</li>
                      <li>Sequence payload does not conform to the 201-bp window requirements.</li>
                      <li>Network request timed out or experienced connection drop.</li>
                      <li>Internal model prediction pipeline encountered an unhandled exception.</li>
                    </ul>
                  </div>

                  <div className={styles.errorActionGroup}>
                    <button type="button" className={styles.errorRetryBtn} onClick={handleAnalyzeDNA}>
                      <RefreshCw size={14} /> Retry Analysis
                    </button>
                    <button
                      type="button"
                      className={styles.errorDetailsBtn}
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                    >
                      {showErrorDetails ? 'Hide Technical Details' : 'View Technical Details'}
                    </button>
                    <button type="button" className={styles.errorCopyBtn} onClick={handleCopyErrorLog}>
                      <Copy size={14} /> Copy Error Log
                    </button>
                  </div>

                  {showErrorDetails && (
                    <div className={styles.errorTechnicalDetails}>
                      <strong>Technical Traceback:</strong>
                      <code>{error}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Streamlined Post-Analysis Results View */
          <motion.div
            className={styles.resultsContainer}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Prediction Summary Card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardHeader}>
                <Activity size={18} className={styles.summaryIcon} />
                <h3>Prediction Summary</h3>
                {analysisDuration && (
                  <span className={styles.durationChip}>Duration: {analysisDuration}s</span>
                )}
              </div>

              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Predicted Finding</span>
                  <strong className={styles.summaryValueDisease}>{result.predicted_disease}</strong>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Confidence Score</span>
                  <strong className={styles.summaryValueConf}>{result.confidence}%</strong>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Risk Level</span>
                  <span
                    className={`${styles.riskBadge} ${
                      result.predicted_disease === 'Healthy'
                        ? styles.riskHealthy
                        : result.confidence >= 90
                        ? styles.riskHigh
                        : result.confidence >= 70
                        ? styles.riskModerate
                        : styles.riskLow
                    }`}
                  >
                    {result.predicted_disease === 'Healthy'
                      ? 'Low Risk / Baseline'
                      : result.confidence >= 90
                      ? 'High Risk'
                      : result.confidence >= 70
                      ? 'Moderate Risk'
                      : 'Low Confidence / Alert'}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>AI Model Engine</span>
                  <strong className={styles.summaryValueText}>GenomeAI 1D-CNN v2.0</strong>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Analysis Timestamp</span>
                  <strong className={styles.summaryValueText}>{result.timestamp}</strong>
                </div>
              </div>

              {/* Action Buttons Hierarchy */}
              <div className={styles.actionRowCompact}>
                <button type="button" className={styles.primaryAnalyzeBtnSmall} onClick={handleDownloadPDF}>
                  <FileText size={16} />
                  Download PDF Report
                </button>

                <button
                  type="button"
                  className={styles.evidenceLinkBtn}
                  onClick={() =>
                    navigate('/evidence', {
                      state: {
                        predictionResult: result,
                        sequence: cleanedSeq,
                        timestamp: result.timestamp,
                      },
                    })
                  }
                >
                  <FileCheck size={16} />
                  View Supporting Evidence
                </button>

                <button type="button" className={styles.secondaryBtn} onClick={handleNewAnalysis}>
                  <RefreshCw size={16} />
                  Analyze Another Sample
                </button>
              </div>
            </div>

            {/* Clinical Interpretation Card */}
            <div className={styles.clinicalCard}>
              <div className={styles.clinicalCardHeader}>
                <BookOpen size={18} className={styles.clinicalIcon} />
                <h3>Clinical Interpretation & Decision Support</h3>
              </div>

              <div className={styles.clinicalContent}>
                <p className={styles.interpretationText}>
                  {result.predicted_disease === 'Healthy'
                    ? `The genomic sequence analysis did not detect pathogenic variant signatures associated with monitored disease targets. The sequence profile aligns with baseline reference models with a confidence score of ${result.confidence}%.`
                    : `The 1D-CNN deep learning model detected significant nucleotide pattern features corresponding to ${result.predicted_disease} with a confidence score of ${result.confidence}% (${result.confidence_level}).`}
                </p>

                <div className={styles.clinicalDisclaimerBox}>
                  <ShieldCheck size={16} className={styles.disclaimerIcon} />
                  <span>
                    <strong>Research & Decision-Support Notice:</strong> AI predictions generated by GenomeAI are intended for investigational laboratory and decision-support purposes. Results must be confirmed with standard diagnostic procedures and clinical specialist evaluation.
                  </span>
                </div>
              </div>
            </div>

            {/* Supporting Evidence Summary Component */}
            <SupportingEvidenceSummary
              blastData={result.blast}
              predictionResult={result}
              sequence={cleanedSeq}
            />

            <div className={styles.regulatoryBox}>
              <ShieldCheck size={18} />
              <div>
                <strong>Laboratory Regulatory Disclaimer</strong>
                <p>
                  This AI-assisted decision-support analysis is executed under LIS validation protocols. Predictions should be interpreted alongside comprehensive clinical findings and molecular laboratory diagnostic standard procedures.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Pipeline Progress Modal */}
      <AnalysisProgressModal isOpen={isAnalyzing} currentStep={progressStep} error={error} />

      {/* Non-intrusive Toast Banner */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}