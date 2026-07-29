import { Activity, Database, Cpu, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastAnalysisSummary({
  status,
  queryLength = 201,
  executionTimeMs,
  matchesCount = 0,
}) {
  const searchTimeSec = executionTimeMs ? (executionTimeMs / 1000).toFixed(1) : '1.5';

  return (
    <div className={styles.summaryCardBox}>
      <div className={styles.summaryTitleRow}>
        <Activity size={16} className={styles.iconBlue} />
        <h4>Analysis Technical Summary</h4>
        <span className={styles.techTag}>Standard NCBI Parameters</span>
      </div>

      <div className={styles.summaryGrid6}>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Program</span>
          <strong className={styles.sumVal}>BLASTN</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Database</span>
          <strong className={styles.sumVal}>NCBI nt</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Query Length</span>
          <strong className={styles.sumVal}>{queryLength} bp</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Search Time</span>
          <strong className={styles.sumVal}>{searchTimeSec} sec</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Status</span>
          <strong className={styles.sumVal} style={{ color: status === 'failed' ? '#f87171' : '#4ade80' }}>
            {status === 'loading' ? 'Running' : status === 'failed' ? 'Error' : 'Completed'}
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Matches Found</span>
          <strong className={styles.sumVal} style={{ color: matchesCount > 0 ? '#38bdf8' : '#cbd5e1' }}>
            {matchesCount}
          </strong>
        </div>
      </div>
    </div>
  );
}
