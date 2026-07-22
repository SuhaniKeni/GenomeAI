import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Download,
  Stethoscope,
  Clock,
  Activity,
  AlertTriangle,
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import { fetchHistory, downloadPredictionReport } from '../api/client';
import styles from './DoctorDashboard.module.css';

/* ---------- helpers ---------- */

function getConfidenceColor(pct) {
  if (pct >= 90) return '#22c55e';
  if (pct >= 70) return '#eab308';
  return '#ef4444';
}

function getRecommendations(confidence, disease) {
  const base = [];
  if (confidence >= 90) {
    base.push(
      `High-confidence prediction for ${disease}. Immediate specialist consultation recommended.`,
    );
    base.push('Schedule confirmatory diagnostic tests within 7 days.');
    base.push('Begin preliminary treatment protocol under specialist guidance.');
  } else if (confidence >= 70) {
    base.push(
      `Moderate confidence for ${disease}. Additional diagnostic workup suggested.`,
    );
    base.push('Consider repeat testing or alternative diagnostic methods.');
    base.push('Monitor patient symptoms closely over the next 2 weeks.');
  } else {
    base.push('Low confidence prediction. Further investigation required.');
    base.push(
      'Review clinical presentation and consider broader differential diagnosis.',
    );
    base.push('Additional imaging or laboratory tests are recommended.');
  }
  base.push('Document all findings in patient medical records.');
  return base;
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ---------- component ---------- */

export default function DoctorDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetchHistory({ limit: 50, offset: 0 });
        if (!cancelled) {
          setHistoryData(resp);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            'Failed to load prediction history.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const latestPrediction = useMemo(() => {
    if (!historyData || !historyData.records || historyData.records.length === 0) return null;
    return historyData.records[0];
  }, [historyData]);

  const recommendations = useMemo(() => {
    if (!latestPrediction) return [];
    return getRecommendations(
      latestPrediction.confidence || 0,
      latestPrediction.predicted_disease || 'Unknown',
    );
  }, [latestPrediction]);

  const handleDownload = useCallback(async () => {
    if (!latestPrediction) return;
    setDownloading(true);
    try {
      const blob = await downloadPredictionReport(
        latestPrediction.sequence || '',
        { model: latestPrediction.model || 'LSTM', patientName: '' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${latestPrediction.id || 'latest'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [latestPrediction]);

  /* ---------- render ---------- */

  if (loading) {
    return (
      <PageLayout title="Doctor Dashboard" subtitle="Loading your clinical data...">
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <div>Loading predictions…</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Doctor Dashboard" subtitle="Something went wrong">
        <div className={styles.errorBox}>
          <AlertTriangle size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          {error}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Doctor Dashboard"
      subtitle="Clinical overview of patient predictions and recommendations."
    >
      <section className={styles.grid}>
        {/* LEFT COLUMN — Main prediction + metrics */}
        <motion.div
          className={styles.panel}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>Latest Prediction</span>
              <h2>Current Case</h2>
            </div>
          </div>

          {!latestPrediction ? (
            <div className={styles.hint}>
              <Activity size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <br />
              No predictions found. Run a prediction first to see data here.
            </div>
          ) : (
            <>
              {/* MAIN CARD */}
              <div className={styles.mainCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.mainDisease}>
                      {latestPrediction.predicted_disease || 'Unknown'}
                    </div>
                    <div className={styles.mainMeta}>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Model</span>
                        {latestPrediction.model || '—'}
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Date</span>
                        <Clock size={14} />
                        {' '}
                        {formatDate(latestPrediction.timestamp)}
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Patient</span>
                        {latestPrediction.patient_name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* GAUGE */}
                  <div className={styles.gaugeWrapper}>
                    <div className={styles.gauge}>
                      <svg className={styles.gaugeSvg} viewBox="0 0 100 100">
                        <circle className={styles.gaugeCircle} cx="50" cy="50" r="40" />
                        <circle
                          className={styles.gaugeFill}
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={getConfidenceColor(latestPrediction.confidence || 0)}
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={
                            2 * Math.PI * 40 -
                            (2 * Math.PI * 40 * (latestPrediction.confidence || 0)) / 100
                          }
                        />
                      </svg>
                      <div className={styles.gaugeCenter}>
                        {(latestPrediction.confidence || 0).toFixed(0)}%
                      </div>
                    </div>
                    <span className={styles.gaugeLabel}>Confidence</span>
                  </div>
                </div>
              </div>

              {/* METRICS */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Total Predictions</span>
                  <span className={styles.metricValue}>
                    {historyData?.total || 0}
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Avg Confidence</span>
                  <span className={styles.metricValue}>
                    {historyData?.records?.length
                      ? (
                          historyData.records.reduce(
                            (acc, r) => acc + (r.confidence || 0),
                            0,
                          ) / historyData.records.length
                        ).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Model Used</span>
                  <span className={styles.metricValue} style={{ fontSize: '1rem' }}>
                    {latestPrediction.model || '—'}
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Priority</span>
                  <span className={styles.metricValue} style={{ fontSize: '1rem' }}>
                    {latestPrediction.confidence >= 90
                      ? 'Urgent'
                      : latestPrediction.confidence >= 70
                      ? 'Standard'
                      : 'Review'}
                  </span>
                </div>
              </div>

              {/* RECOMMENDATIONS */}
              <div className={styles.recommendationsBox}>
                <h4>Recommendations</h4>
                {recommendations.map((rec, i) => (
                  <div key={i} className={styles.recommendationItem}>
                    {rec}
                  </div>
                ))}
              </div>

              {/* DOWNLOAD */}
              <button
                className={styles.downloadBtn}
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download size={18} />
                {downloading ? 'Downloading…' : 'Download Report (PDF)'}
              </button>

              {/* CLINICAL NOTES */}
              <div className={styles.notesField}>
                <span>Clinical Notes</span>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Type your clinical notes here…"
                  rows={5}
                />
              </div>
            </>
          )}
        </motion.div>

        {/* RIGHT COLUMN — Recent predictions list */}
        <motion.div
          className={styles.panel}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>History</span>
              <h2>Recent Predictions</h2>
            </div>
            {historyData?.records?.length > 0 && (
              <span className={styles.chip}>
                <Stethoscope size={14} /> {historyData.total} total
              </span>
            )}
          </div>

          {!historyData || historyData.records.length === 0 ? (
            <div className={styles.hint}>
              <Activity size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <br />
              No recent predictions available.
            </div>
          ) : (
            <div className={styles.listWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Disease</th>
                    <th>Confidence</th>
                    <th>Model</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.records.map((rec) => {
                    const conf = rec.confidence || 0;
                    const color = getConfidenceColor(conf);
                    return (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 700 }}>
                          {rec.predicted_disease || 'Unknown'}
                        </td>
                        <td>
                          <div className={styles.confidenceBar}>
                            <span style={{ fontWeight: 700, color }}>
                              {conf.toFixed(0)}%
                            </span>
                            <div className={styles.barTrack}>
                              <div
                                className={styles.barFill}
                                style={{ width: `${conf}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.modelBadge}>
                            {rec.model || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                          {formatDate(rec.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </section>
    </PageLayout>
  );
}
