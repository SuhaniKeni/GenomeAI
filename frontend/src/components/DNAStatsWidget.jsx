import React, { useMemo } from 'react';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import styles from './DNAStatsWidget.module.css';

export default function DNAStatsWidget({ sequence }) {
  const stats = useMemo(() => {
    const raw = String(sequence || '').trim();
    // Parse FASTA header if present
    const cleanLines = raw.split('\n').filter(line => !line.startsWith('>'));
    const cleanSeq = cleanLines.join('').toUpperCase().replace(/\s+/g, '');
    const len = cleanSeq.length;

    if (!len) {
      return {
        len: 0,
        gc: 0,
        counts: { A: 0, T: 0, G: 0, C: 0, N: 0 },
        invalidChars: [],
        status: 'Empty Input',
        isValid: false,
      };
    }

    const counts = { A: 0, T: 0, G: 0, C: 0, N: 0 };
    const invalidSet = new Set();

    for (let i = 0; i < len; i++) {
      const char = cleanSeq[i];
      if (counts[char] !== undefined) {
        counts[char]++;
      } else {
        counts.N++;
        invalidSet.add(char);
      }
    }

    const gcCount = counts.G + counts.C;
    const gc = Math.round((gcCount / len) * 100);

    let status = 'Valid Sequence (201 bp)';
    let isValid = true;

    if (invalidSet.size > 0) {
      status = `Invalid Nucleotides [${Array.from(invalidSet).join(', ')}]`;
      isValid = false;
    } else if (len !== 201) {
      status = `Incomplete Window (${len}/201 bp)`;
      isValid = false;
    }

    return { len, gc, counts, invalidChars: Array.from(invalidSet), status, isValid };
  }, [sequence]);

  return (
    <div className={styles.statsCard}>
      <div className={styles.statsCardHeader}>
        <div className={styles.titleGroup}>
          <Activity size={15} className={styles.headerIcon} />
          <span className={styles.headerTitle}>Sequence Statistics</span>
        </div>
        <span className={`${styles.statusPill} ${stats.isValid ? styles.statusValid : styles.statusInvalid}`}>
          {stats.isValid ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
          {stats.status}
        </span>
      </div>

      <div className={styles.metricsGrid}>
        {/* Metric 1: Length */}
        <div className={styles.metricCell}>
          <span className={styles.metricLabel}>Length</span>
          <div className={styles.metricValGroup}>
            <strong className={styles.metricValue}>{stats.len}</strong>
            <span className={styles.metricUnit}>bp</span>
          </div>
          <span className={styles.subtext}>Required: 201 bp</span>
        </div>

        {/* Metric 2: GC Content */}
        <div className={styles.metricCell}>
          <span className={styles.metricLabel}>GC Content</span>
          <div className={styles.metricValGroup}>
            <strong className={styles.metricValue}>{stats.gc}%</strong>
          </div>
          <div className={styles.gcBarTrack}>
            <div className={styles.gcBarFill} style={{ width: `${Math.min(stats.gc, 100)}%` }} />
          </div>
        </div>

        {/* Metric 3: Quality */}
        <div className={styles.metricCell}>
          <span className={styles.metricLabel}>Quality</span>
          <div className={styles.metricValGroup}>
            <strong className={stats.isValid ? styles.textSuccess : styles.textWarning}>
              {stats.isValid ? 'Valid' : stats.len === 0 ? 'Empty' : 'Invalid'}
            </strong>
          </div>
          <span className={styles.subtext}>
            {stats.len === 201 ? '1D-CNN Window OK' : stats.len > 0 ? `${201 - stats.len} bp difference` : 'Paste sequence'}
          </span>
        </div>

        {/* Metric 4: Nucleotide Composition */}
        <div className={styles.metricCellFull}>
          <span className={styles.metricLabel}>Nucleotide Composition</span>
          <div className={styles.compRow}>
            <div className={`${styles.baseChip} ${styles.chipA}`}>
              <span className={styles.baseLetter}>A</span>
              <strong className={styles.baseCount}>{stats.counts.A}</strong>
            </div>
            <div className={`${styles.baseChip} ${styles.chipT}`}>
              <span className={styles.baseLetter}>T</span>
              <strong className={styles.baseCount}>{stats.counts.T}</strong>
            </div>
            <div className={`${styles.baseChip} ${styles.chipG}`}>
              <span className={styles.baseLetter}>G</span>
              <strong className={styles.baseCount}>{stats.counts.G}</strong>
            </div>
            <div className={`${styles.baseChip} ${styles.chipC}`}>
              <span className={styles.baseLetter}>C</span>
              <strong className={styles.baseCount}>{stats.counts.C}</strong>
            </div>
            {stats.counts.N > 0 && (
              <div className={`${styles.baseChip} ${styles.chipN}`}>
                <span className={styles.baseLetter}>N</span>
                <strong className={styles.baseCount}>{stats.counts.N}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
