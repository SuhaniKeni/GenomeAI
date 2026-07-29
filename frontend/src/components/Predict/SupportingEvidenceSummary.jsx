import { useNavigate } from 'react-router-dom';
import { FileCheck, ArrowRight, ShieldCheck, Database, CheckCircle2, Info, Loader2 } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function SupportingEvidenceSummary({ blastData, predictionResult, sequence, isLoading = false }) {
  const navigate = useNavigate();

  const topHit = blastData?.top_hit || predictionResult?.blast?.top_hit;
  const status = isLoading
    ? 'loading'
    : (topHit ? 'completed' : 'empty');

  const matchesCount = topHit ? 1 : 0;
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleViewEvidence = () => {
    // Store complete analysis context for the evidence page
    const evidenceState = {
      predictionResult,
      blastData,
      sequence,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem('genomeai_current_evidence', JSON.stringify(evidenceState));
    } catch {
      // Ignore storage quota errors if any
    }
    navigate('/evidence', { state: evidenceState });
  };

  return (
    <div className={styles.blastCard} style={{ padding: '20px', margin: '20px 0' }}>
      <div className={styles.cardHeader} style={{ borderBottom: 'none', paddingBottom: '0' }}>
        <div className={styles.titleGroup}>
          <h3>
            <FileCheck size={20} style={{ color: '#38bdf8' }} />
            Supporting Evidence
          </h3>
          <p className={styles.secSub}>
            Integrated multi-source genomic evidence (ClinVar, NCBI, Sequence Similarity) validating AI predictions.
          </p>
        </div>

        {/* Compact Status */}
        <div>
          {isLoading ? (
            <span className={`${styles.statusBadge} ${styles.statusLoading}`}>
              <Loader2 size={14} className="spin" />
              Retrieving Evidence...
            </span>
          ) : topHit ? (
            <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
              <CheckCircle2 size={14} />
              Evidence Available
            </span>
          ) : (
            <span className={`${styles.statusBadge} ${styles.statusInfo}`}>
              <Info size={14} />
              Analysis Complete
            </span>
          )}
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className={styles.summaryGrid6} style={{ marginTop: '16px', marginBottom: '16px' }}>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Evidence Status</span>
          <strong className={styles.sumVal} style={{ color: '#4ade80' }}>
            {isLoading ? 'Processing' : 'Available'}
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Evidence Sources</span>
          <strong className={styles.sumVal} style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
            ClinVar, NCBI, Sequence Similarity
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Matches Found</span>
          <strong className={styles.sumVal} style={{ color: matchesCount > 0 ? '#38bdf8' : '#cbd5e1' }}>
            {matchesCount} Match{matchesCount !== 1 ? 'es' : ''}
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Last Updated</span>
          <strong className={styles.sumVal}>{lastUpdated}</strong>
        </div>
      </div>

      {/* Action Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleViewEvidence}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}
        >
          View Supporting Evidence
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
