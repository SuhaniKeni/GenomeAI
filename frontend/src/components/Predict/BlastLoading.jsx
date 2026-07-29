import { Dna, Loader2 } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastLoading() {
  return (
    <div className={styles.loadingBox}>
      <div className={styles.spinnerOuter}>
        <div className={styles.spinner} />
        <Dna size={24} className={styles.dnaPulseIcon} />
      </div>

      <div className={styles.loadingText}>
        <h4>Running NCBI Remote BLAST Search...</h4>
        <p>Aligning 201 bp query sequence against nucleotide (nt) database via NCBI E-utilities...</p>
      </div>

      <div className={styles.progressBarTrack}>
        <div className={styles.progressBarFill} />
      </div>

      <span className={styles.nonBlockingNotice}>
        ⚡ Asynchronous process: AI prediction is ready while BLAST queries NCBI servers.
      </span>
    </div>
  );
}
