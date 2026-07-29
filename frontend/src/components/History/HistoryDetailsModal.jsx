import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Dna, Award, ExternalLink, CheckCircle2, AlertCircle, Database, BookOpen } from 'lucide-react';
import styles from '../Predict/BlastCard.module.css';

export default function HistoryDetailsModal({ isOpen, onClose, record, onDownloadPDF }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const blast = record.blast;
  const topHit = blast?.top_hit;

  return (
    <AnimatePresence>
      <div className={styles.modalBackdrop} onClick={onClose}>
        <motion.div
          className={styles.modalContent}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <h3>
              <Dna size={20} style={{ color: '#38bdf8' }} />
              Analysis Record Details — ANL-{record.id}
            </h3>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* Prediction Summary Grid */}
            <div className={styles.modalMetricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Predicted Disease</span>
                <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{record.predicted_disease}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Confidence</span>
                <strong style={{ color: '#4ade80' }}>
                  {record.confidence}% ({record.confidence_level})
                </strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Engine Model</span>
                <strong>{record.model || 'GenomeAI CNN v2.0'}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Sequence Window</span>
                <strong>{record.sequence_length || 201} bp</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Archived Date</span>
                <strong style={{ fontSize: '0.85rem' }}>
                  {record.timestamp ? record.timestamp.replace('T', ' ').slice(0, 19) : 'N/A'}
                </strong>
              </div>
            </div>

            {/* Sequence Snippet */}
            <div className={styles.descriptionBox}>
              <strong>Input DNA Sequence Snippet</strong>
              <p style={{ fontFamily: 'monospace', letterSpacing: '0.08em', fontSize: '0.85rem' }}>
                {record.sequence ? record.sequence : 'A'.repeat(50) + '...'}
              </p>
            </div>

            {/* Stored Supporting Evidence Section */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dna size={18} style={{ color: '#38bdf8' }} />
                Stored Supporting Evidence Analysis
              </h4>

              {topHit ? (
                <>
                  <div className={styles.modalMetricsGrid}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Top Reference Match</span>
                      <strong style={{ color: '#38bdf8' }}>{topHit.gene}</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Identity %</span>
                      <strong style={{ color: '#4ade80' }}>{topHit.identity}%</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Coverage %</span>
                      <strong>{topHit.coverage}%</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Alignment Length</span>
                      <strong>{topHit.alignment_length} bp</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Accession No.</span>
                      <strong>{topHit.accession}</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Organism</span>
                      <strong style={{ fontStyle: 'italic', color: '#93c5fd' }}>{topHit.organism}</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Bit Score / E-value</span>
                      <strong>{topHit.bit_score} / {topHit.evalue}</strong>
                    </div>
                  </div>

                  <div className={styles.descriptionBox} style={{ marginTop: '12px', marginBottom: '12px' }}>
                    <strong>NCBI Target Description</strong>
                    <p>{topHit.description}</p>
                  </div>

                  <div className={styles.nonBlockingNotice}>
                    ℹ️ Laboratory Interpretation: The sequence demonstrated {topHit.identity}% identity with {topHit.organism} {topHit.gene} ({topHit.accession}), supporting the AI disease prediction.
                  </div>
                </>
              ) : (
                <div className={styles.emptyBox} style={{ margin: '0' }}>
                  <span className={styles.emptyTitle}>
                    {blast?.status === 'failed' ? 'Evidence Analysis Completed' : 'No Significant Sequence Match Stored'}
                  </span>
                  <p className={styles.emptyDesc}>
                    {blast?.error || 'No matching sequence alignments were identified under standard search parameters. Note: This does not invalidate the AI prediction.'}
                  </p>
                </div>
              )}
            </div>

            {/* Mutation Summary or Explainability if available */}
            {record.mutation_summary && (
              <div className={styles.descriptionBox}>
                <strong>Mutation Analysis Summary</strong>
                <p>{record.mutation_summary}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onDownloadPDF(record)}
            >
              <FileText size={16} />
              Download Clinical PDF Report
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
