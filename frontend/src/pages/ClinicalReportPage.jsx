import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, LoaderCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { predictSequenceExtended, downloadPredictionReport } from '../api/client';
import styles from './ClinicalReportPage.module.css';

export default function ClinicalReportPage() {
  const [patientName, setPatientName] = useState('');
  const [sequence, setSequence] = useState('');
  const [model, setModel] = useState('cnn');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!sequence.trim()) return;
    setLoading(true);
    try {
      const res = await predictSequenceExtended(sequence.trim(), { model });
      if (res?.success && res?.result) {
        setReportData({ ...res.result, patientName: patientName || undefined });
      }
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  }, [sequence, model, patientName]);

  const handleDownload = useCallback(async () => {
    if (!reportData) return;
    setDownloading(true);
    try {
      const blob = await downloadPredictionReport(sequence, {
        model,
        patientName: patientName || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'genomeai_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [reportData, sequence, model, patientName]);

  const topPredictions = reportData?.all_predictions
    ? Array.isArray(reportData.all_predictions)
      ? reportData.all_predictions.slice(0, 5)
      : Object.entries(reportData.all_predictions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
    : [];

  return (
    <PageLayout
      title="Clinical Report Generator"
      subtitle="Generate professional PDF reports for clinical documentation."
    >
      <section className={styles.grid}>
        {/* FORM */}
        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>Report Form</span>
              <h2>Patient & Sequence</h2>
            </div>
          </div>

          <label className={styles.field}>
            <span>Patient Name (optional)</span>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </label>

          <label className={styles.field}>
            <span>DNA Sequence</span>
            <textarea
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              placeholder="Paste DNA sequence (A, T, G, C, N)..."
              rows={6}
            />
          </label>

          <label className={styles.field}>
            <span>Model</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="cnn">CNN</option>
              <option value="lstm">LSTM</option>
              <option value="transformer">Transformer</option>
            </select>
          </label>

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={loading || !sequence.trim()}
          >
            {loading ? <LoaderCircle size={20} className={styles.spin} /> : <FileText size={20} />}
            {loading ? 'Analyzing…' : 'Generate Report'}
          </button>

          {reportData && (
            <button
              className={styles.downloadBtn}
              onClick={handleDownload}
              disabled={downloading}
              style={{ marginTop: 12 }}
            >
              <Download size={18} />
              {downloading ? 'Downloading…' : 'Download PDF'}
            </button>
          )}
        </motion.div>

        {/* PREVIEW */}
        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>Preview</span>
              <h2>Report Preview</h2>
            </div>
          </div>

          {!reportData ? (
            <div className={styles.hint}>
              <div className={styles.hintIcon}>
                <FileText size={48} />
              </div>
              <strong>No report generated yet.</strong>
              <br />
              Fill in the sequence details on the left and click
              <strong> Generate Report</strong>.
            </div>
          ) : (
            <div className={styles.reportPreview}>
              <div className={styles.reportPaper}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportBrand}>
                    <span className={styles.reportBrandAccent}>Genome</span>AI
                  </div>
                  <div className={styles.reportSubhead}>Clinical Genomic Report</div>
                  <span className={styles.reportTimestamp}>
                    Generated: {new Date().toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}>Patient Information</div>
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Name</span>
                    <span className={styles.reportValue}>
                      {reportData.patientName || '—'}
                    </span>
                  </div>
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Report Date</span>
                    <span className={styles.reportValue}>
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <hr className={styles.reportDivider} />

                <div className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}>Prediction Summary</div>
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Predicted Disease</span>
                    <span className={styles.reportValue}>
                      {reportData.predicted_disease}
                    </span>
                  </div>
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Confidence</span>
                    <span className={styles.reportValue}>
                      {Number(reportData.confidence).toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Model</span>
                    <span className={styles.reportValue}>{reportData.model}</span>
                  </div>
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Inference Time</span>
                    <span className={styles.reportValue}>
                      {reportData.inference_time_ms?.toFixed(1)} ms
                    </span>
                  </div>
                </div>

                <hr className={styles.reportDivider} />

                <div className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}>Top Predictions</div>
                  <div className={styles.predictionBars}>
                    {topPredictions.map((item, idx) => {
                      const [disease, prob] = Array.isArray(item)
                        ? [item[0], item[1]]
                        : [item.disease || item.name, item.probability || item.value];
                      const pct = typeof prob === 'number' && prob > 1 ? prob : (prob * 100);
                      return (
                        <div key={disease || idx} className={styles.predictionBarRow}>
                          <span className={styles.predictionLabel}>{disease}</span>
                          <div className={styles.predictionBarTrack}>
                            <div
                              className={styles.predictionBarFill}
                              style={{ width: `${pct.toFixed(1)}%` }}
                            />
                          </div>
                          <span className={styles.predictionPct}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <hr className={styles.reportDivider} />

                <div className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}>AI Insights</div>
                  <p style={{ lineHeight: 1.7, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {reportData.ai_insights || reportData.shap_explanation_summary ||
                      'The prediction was generated using a trained genomic classifier. High-confidence predictions indicate strong pattern matching with known disease-associated sequences.'}
                  </p>
                </div>

                <hr className={styles.reportDivider} />

                <div className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}>Mutation Summary</div>
                  {reportData.mutation_analysis ? (
                    <p style={{ lineHeight: 1.7, color: 'var(--ink)', fontSize: '0.9rem' }}>
                      {reportData.mutation_analysis.mutations_detected != null
                        ? `${reportData.mutation_analysis.mutations_detected} mutation(s) detected, including ${reportData.mutation_analysis.pathogenic_mutations || 0} pathogenic variant(s).`
                        : 'No significant mutations detected.'}
                    </p>
                  ) : (
                    <div className={styles.mutationPlaceholder}>
                      No reference sequence available for mutation analysis. Provide a reference sequence to enable mutation detection.
                    </div>
                  )}
                </div>

                <hr className={styles.reportDivider} />

                <div className={styles.disclaimer}>
                  <strong>Clinical Disclaimer:</strong> This report is generated by an AI-powered
                  research system and is intended for informational and research purposes only.
                  It does not constitute a medical diagnosis, clinical recommendation, or
                  substitute for professional medical advice. All findings should be reviewed
                  and validated by a qualified healthcare professional.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>
    </PageLayout>
  );
}
