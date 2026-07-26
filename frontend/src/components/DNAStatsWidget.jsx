import { useMemo } from 'react';
import { Activity, Percent, Dna, ShieldCheck } from 'lucide-react';
import styles from './DNAStatsWidget.module.css';

export default function DNAStatsWidget({ sequence }) {
  const stats = useMemo(() => {
    const clean = String(sequence || '').toUpperCase().replace(/\s+/g, '');
    const len = clean.length;
    if (!len) {
      return { len: 0, gc: 0, counts: { A: 0, T: 0, G: 0, C: 0, N: 0 }, status: 'Empty' };
    }

    const counts = { A: 0, T: 0, G: 0, C: 0, N: 0 };
    for (let i = 0; i < len; i++) {
      const char = clean[i];
      if (counts[char] !== undefined) {
        counts[char]++;
      } else {
        counts.N++;
      }
    }

    const gcCount = counts.G + counts.C;
    const gc = Math.round((gcCount / len) * 100);

    let status = 'Valid Window';
    if (len !== 201) status = `Incomplete (${len}/201)`;

    return { len, gc, counts, status };
  }, [sequence]);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.metricCard}>
          <div className={styles.labelRow}>
            <Activity size={14} className={styles.iconBlue} />
            <span>Sequence Length</span>
          </div>
          <div className={styles.valRow}>
            <strong>{stats.len}</strong>
            <span className={styles.unit}>/ 201 bp</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.labelRow}>
            <Percent size={14} className={styles.iconTeal} />
            <span>GC Content</span>
          </div>
          <div className={styles.valRow}>
            <strong>{stats.gc}%</strong>
            <div className={styles.miniBar}>
              <div className={styles.miniFill} style={{ width: `${stats.gc}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.labelRow}>
            <Dna size={14} className={styles.iconNavy} />
            <span>Nucleotide Composition</span>
          </div>
          <div className={styles.baseRow}>
            <span className={`${styles.baseBadge} ${styles.badgeA}`}>A: {stats.counts.A}</span>
            <span className={`${styles.baseBadge} ${styles.badgeT}`}>T: {stats.counts.T}</span>
            <span className={`${styles.baseBadge} ${styles.badgeG}`}>G: {stats.counts.G}</span>
            <span className={`${styles.baseBadge} ${styles.badgeC}`}>C: {stats.counts.C}</span>
            {stats.counts.N > 0 && <span className={`${styles.baseBadge} ${styles.badgeN}`}>N: {stats.counts.N}</span>}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.labelRow}>
            <ShieldCheck size={14} className={styles.iconGreen} />
            <span>Quality Status</span>
          </div>
          <div className={styles.statusRow}>
            <span className={stats.len === 201 ? styles.statusOk : styles.statusWarn}>
              {stats.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
