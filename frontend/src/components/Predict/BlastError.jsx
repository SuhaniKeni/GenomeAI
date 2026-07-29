import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastError({ error, onRetry }) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'NCBI Remote BLAST search failed or timed out.';

  return (
    <div className={styles.errorBox}>
      <AlertTriangle size={32} className={styles.errorIcon} />

      <h4 className={styles.errorTitle}>Sequence Similarity Search Failed</h4>

      <p className={styles.errorDetail}>
        {errorMessage} (Reason: NCBI server rate limits, network timeout, or connection interruption).
      </p>

      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          <RefreshCw size={16} />
          Retry BLAST Analysis
        </button>
      )}
    </div>
  );
}
