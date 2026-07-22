import { useState, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GitCompare, AlertTriangle, Dna } from 'lucide-react';

import PageLayout from '../components/PageLayout';
import styles from './MutationAnalysisPage.module.css';

/* ---------- helpers ---------- */

function normalizeSeq(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

const TRANSITIONS = new Set([
  'A→G', 'G→A',
  'C→T', 'T→C',
]);

const TRANSVERSIONS = new Set([
  'A→T', 'T→A',
  'A→C', 'C→A',
  'G→T', 'T→G',
  'G→C', 'C→G',
]);

function classifyMutation(ref, obs) {
  if (ref === obs) return 'silent';
  const key = `${ref}→${obs}`;
  if (TRANSITIONS.has(key)) return 'transition';
  if (TRANSVERSIONS.has(key)) return 'transversion';
  return 'other';
}

function analyseMutations(refSeq, obsSeq) {
  const length = Math.max(refSeq.length, obsSeq.length);
  const mutations = [];
  for (let i = 0; i < length; i++) {
    const r = refSeq[i] || '-';
    const o = obsSeq[i] || '-';
    if (r !== o) {
      mutations.push({
        position: i + 1,
        reference: r,
        observed: o,
        type: classifyMutation(r, o),
        impact: r === '-' || o === '-' ? 'indel' : 'substitution',
      });
    }
  }

  const total = mutations.length;
  const typeCounts = {};
  for (const m of mutations) {
    typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
  }

  const mutationRate = length > 0 ? (total / length) * 100 : 0;

  // overall impact heuristic
  let overallImpact = 'Low';
  if (total > 0) {
    const transversionCount = typeCounts['transversion'] || 0;
    const indelCount = mutations.filter((m) => m.impact === 'indel').length;
    if (transversionCount > 5 || indelCount > 2 || mutationRate > 15) {
      overallImpact = 'High';
    } else if (transversionCount > 2 || mutationRate > 5) {
      overallImpact = 'Moderate';
    }
  }

  return { mutations, total, typeCounts, mutationRate, overallImpact };
}

/* ---------- component ---------- */

export default function MutationAnalysisPage() {
  const shouldReduceMotion = useReducedMotion();
  const [refSequence, setRefSequence] = useState('');
  const [obsSequence, setObsSequence] = useState('');
  const [compared, setCompared] = useState(false);

  const normalizedRef = useMemo(() => normalizeSeq(refSequence), [refSequence]);
  const normalizedObs = useMemo(() => normalizeSeq(obsSequence), [obsSequence]);

  const analysis = useMemo(
    () => analyseMutations(normalizedRef, normalizedObs),
    [normalizedRef, normalizedObs],
  );

  const handleCompare = useCallback(() => {
    if (normalizedRef.length > 0 && normalizedObs.length > 0) {
      setCompared(true);
    }
  }, [normalizedRef, normalizedObs]);

  const canCompare = normalizedRef.length > 0 && normalizedObs.length > 0;

  return (
    <PageLayout
      title="Mutation Analysis"
      subtitle="Compare a reference DNA sequence against an observed sequence to identify mutations."
    >
      <section className={styles.grid}>
        {/* INPUT PANEL */}
        <motion.div
          className={styles.panel}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>Input</span>
              <h2>Sequences</h2>
            </div>
          </div>

          <label className={styles.field}>
            <span>Reference Sequence (A, T, G, C)</span>
            <textarea
              value={refSequence}
              onChange={(e) => {
                setRefSequence(e.target.value);
                setCompared(false);
              }}
              placeholder="Paste the reference (wild-type) DNA sequence..."
              rows={5}
            />
          </label>

          <label className={styles.field}>
            <span>Observed Sequence (A, T, G, C)</span>
            <textarea
              value={obsSequence}
              onChange={(e) => {
                setObsSequence(e.target.value);
                setCompared(false);
              }}
              placeholder="Paste the observed (mutated) DNA sequence..."
              rows={5}
            />
          </label>

          <button
            className={styles.compareButton}
            disabled={!canCompare}
            onClick={handleCompare}
          >
            <GitCompare size={20} />
            Compare Sequences
          </button>

          {canCompare && (
            <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: '0.85rem' }}>
              Ref: {normalizedRef.length} bp &nbsp;|&nbsp; Obs: {normalizedObs.length} bp
            </div>
          )}
        </motion.div>

        {/* RESULTS PANEL */}
        <motion.div
          className={styles.panel}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>Results</span>
              <h2>Mutation Report</h2>
            </div>
            {compared && (
              <span className={styles.chip}>
                <Dna size={14} /> {analysis.total} mutation{analysis.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!compared ? (
            <div className={styles.hint}>
              <div className={styles.hintIcon}>
                <GitCompare size={48} />
              </div>
              <strong>No comparison yet.</strong>
              <br />
              Enter a reference and observed sequence in the left panel, then click
              <strong> Compare Sequences</strong>.
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className={styles.summary}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Mutations</span>
                  <span className={styles.summaryValue}>{analysis.total}</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Mutation Rate</span>
                  <span className={styles.summaryValue}>
                    {analysis.mutationRate.toFixed(2)}%
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Overall Impact</span>
                  <span className={styles.summaryValue}>{analysis.overallImpact}</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Maximum Length</span>
                  <span className={styles.summaryValue}>
                    {Math.max(normalizedRef.length, normalizedObs.length)}
                  </span>
                </div>
              </div>

              {/* BREAKDOWN */}
              {analysis.total > 0 && (
                <div className={styles.summaryBreakdown}>
                  {['transition', 'transversion', 'silent', 'other'].map((type) => {
                    const count = analysis.typeCounts[type] || 0;
                    const labels = {
                      transition: 'Transitions',
                      transversion: 'Transversions',
                      silent: 'Silent',
                      other: 'Other',
                    };
                    return (
                      <div key={type} className={styles.breakdownRow}>
                        <span className={styles.breakdownLabel}>{labels[type]}</span>
                        <span className={styles.breakdownValue}>
                          {count}{' '}
                          {analysis.total > 0 &&
                            `(${((count / analysis.total) * 100).toFixed(1)}%)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MUTATION TABLE */}
              {analysis.mutations.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Ref</th>
                        <th>Obs</th>
                        <th>Type</th>
                        <th>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.mutations.map((m) => {
                        let badgeClass = styles.badge;
                        if (m.type === 'transition') badgeClass += ` ${styles.badgeTransition}`;
                        else if (m.type === 'transversion') badgeClass += ` ${styles.badgeTransversion}`;
                        else badgeClass += ` ${styles.badgeSilent}`;

                        return (
                          <tr key={m.position}>
                            <td>{m.position}</td>
                            <td style={{ fontWeight: 700 }}>{m.reference}</td>
                            <td style={{ fontWeight: 700 }}>{m.observed}</td>
                            <td>
                              <span className={badgeClass}>{m.type}</span>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>{m.impact}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.hint} style={{ marginTop: 16 }}>
                  <AlertTriangle size={20} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <br />
                  No mutations detected — the sequences are identical.
                </div>
              )}
            </>
          )}
        </motion.div>
      </section>
    </PageLayout>
  );
}
