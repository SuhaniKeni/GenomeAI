import { FileText, ExternalLink, Dna, CheckCircle2, Award } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastSummary({ topHit, onOpenAlignment }) {
  if (!topHit) return null;

  const {
    gene,
    accession,
    organism,
    identity,
    coverage,
    alignment_length,
    bit_score,
    evalue,
    description,
    ncbi_url,
  } = topHit;

  return (
    <div>
      <div className={styles.dashboardGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Top Gene Match</span>
          <span className={styles.metricValue} style={{ color: '#38bdf8' }}>
            {gene || 'N/A'}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Sequence Identity</span>
          <span className={styles.metricValue}>
            <span className={styles.highlightPill}>{identity}%</span>
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Query Coverage</span>
          <span className={styles.metricValue}>{coverage}%</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Alignment Length</span>
          <span className={styles.metricValue}>{alignment_length} bp</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Accession No.</span>
          <span className={styles.metricValue} style={{ fontSize: '0.95rem' }}>
            {accession}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Organism</span>
          <span className={`${styles.metricValue} ${styles.organismText}`}>
            {organism}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Bit Score</span>
          <span className={styles.metricValue}>{bit_score}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>E-Value</span>
          <span className={styles.metricValue}>{evalue}</span>
        </div>
      </div>

      {description && (
        <div className={styles.descriptionBox}>
          <strong>NCBI Target Description</strong>
          <p>{description}</p>
        </div>
      )}

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onOpenAlignment}
        >
          <Dna size={16} />
          View Full Alignment
        </button>

        {ncbi_url && (
          <a
            href={ncbi_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            <ExternalLink size={16} />
            Open in NCBI Nuccore
          </a>
        )}
      </div>
    </div>
  );
}
