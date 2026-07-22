import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  BarChart3,
  Table2,
  Zap,
  Target,
  Timer,
  Layers,
  FileDown,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import PageLayout from '../components/PageLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { fetchBenchmark } from '../api/client';
import styles from './ModelDashboard.module.css';

const MODEL_META = {
  CNN: { color: '#2563eb', gradient: 'rgba(37,99,235,0.12)', badge: styles.cnn },
  LSTM: { color: '#06b6d4', gradient: 'rgba(6,182,212,0.12)', badge: styles.lstm },
  Transformer: { color: '#8b5cf6', gradient: 'rgba(139,92,246,0.12)', badge: styles.transformer }
};

const METRICS_CONFIG = [
  { key: 'accuracy', label: 'Accuracy', icon: Target },
  { key: 'precision', label: 'Precision', icon: CrosshairIcon },
  { key: 'recall', label: 'Recall', icon: Activity },
  { key: 'f1_score', label: 'F1 Score', icon: Layers },
  { key: 'inference_time', label: 'Inference Time (ms)', icon: Timer }
];

function CrosshairIcon({ size, className }) {
  return <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>;
}

function formatMetric(value, key) {
  if (key === 'inference_time') return `${value?.toFixed(2) ?? '—'} ms`;
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export default function ModelDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchBenchmark()
      .then(res => {
        if (mounted && res?.success && res?.results) {
          setData(res.results);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <PageLayout title="Model Comparison Dashboard" subtitle="Analyzing benchmark performance across architectures">
        <LoadingSkeleton count={3} columns={3} chart />
      </PageLayout>
    );
  }

  const models = data ? Object.entries(data) : [];
  const metrics = METRICS_CONFIG.map(m => ({
    ...m,
    values: models.map(([name, model]) => ({
      name,
      value: model[m.key] ?? 0,
      color: MODEL_META[name]?.color || '#888'
    }))
  }));

  const comparisonData = models[0]?.[1]
    ? Object.keys(models[0][1])
        .filter(k => k !== 'roc_curve' && k !== 'confusion_matrix' && k !== 'classification_report')
        .map(key => {
          const entry = { metric: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
          models.forEach(([name, model]) => {
            entry[name] = model[key] ?? 0;
          });
          return entry;
        })
    : [];

  const rocData = models.reduce((acc, [name, model]) => {
    if (model.roc_curve && Array.isArray(model.roc_curve)) {
      model.roc_curve.forEach((point, idx) => {
        if (!acc[idx]) acc[idx] = { threshold: point.threshold ?? idx };
        acc[idx][name] = point.tpr ?? point.value ?? 0;
        acc[idx][`${name}_fpr`] = point.fpr ?? 0;
      });
    }
    return acc;
  }, []);

  const hasRoc = rocData.length > 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: 'rgba(255,255,255,0.96)',
        padding: '14px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(226,232,240,0.9)',
        boxShadow: '0 12px 28px rgba(15,23,42,0.12)',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--ink)' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.kicker}>
            <BarChart3 size={18} />
            Benchmark Analysis
          </div>
          <h1>Model Comparison Dashboard</h1>
          <p>
            Deep-dive performance benchmarks comparing CNN, LSTM, and Transformer
            architectures across accuracy, speed, and predictive quality metrics.
          </p>
        </motion.div>

        {/* Model Metric Columns */}
        <motion.div
          className={styles.modelGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {models.map(([name, model]) => {
            const meta = MODEL_META[name] || {};
            return (
              <motion.div key={name} className={styles.panel} variants={itemVariants}>
                <div className={styles.panelHead}>
                  <h2>{name}</h2>
                  <div className={`${styles.modelBadge} ${meta.badge || ''}`}>
                    <Cpu size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    {name}
                  </div>
                </div>
                <div className={styles.metricList}>
                  {METRICS_CONFIG.map(({ key, label, icon: Icon }) => (
                    <div key={key} className={styles.metricRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} color={meta.color || 'var(--muted)'} />
                        <span className={styles.metricLabel}>{label}</span>
                      </div>
                      <span className={styles.metricValue}>
                        {formatMetric(model?.[key], key)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Comparison Chart */}
        {comparisonData.length > 0 && (
          <motion.div
            className={styles.chartsSection}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <motion.div className={styles.chartPanel} variants={itemVariants}>
              <h3>Metric Comparison</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} barGap={4} barCategoryGap={16}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                    <XAxis
                      dataKey="metric"
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(203,213,225,0.3)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 1.02]}
                      tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      iconType="circle"
                    />
                    {models.map(([name]) => (
                      <Bar
                        key={name}
                        dataKey={name}
                        fill={MODEL_META[name]?.color || '#888'}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={44}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Inference Time Chart */}
            <motion.div className={styles.chartPanel} variants={itemVariants}>
              <h3>Inference Time (ms)</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={models.map(([name, model]) => ({
                      name,
                      time: model.inference_time ?? 0
                    }))}
                  >
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: 'var(--muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(203,213,225,0.3)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}ms`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {models.map(([name]) => (
                      <Bar
                        key={name}
                        dataKey="time"
                        name={name}
                        fill={MODEL_META[name]?.color || '#888'}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ROC Curve Data Table */}
        {hasRoc && (
          <motion.div
            className={styles.tablePanel}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Table2 size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>
                ROC Curve Data
              </h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Threshold / Index</th>
                    {models.map(([name]) => (
                      <th key={name} style={{ color: MODEL_META[name]?.color }}>
                        {name} (TPR)
                      </th>
                    ))}
                    {models.map(([name]) => (
                      <th key={`${name}-fpr`} style={{ color: MODEL_META[name]?.color }}>
                        {name} (FPR)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rocData.slice(0, 20).map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>
                        {typeof row.threshold === 'number' ? row.threshold.toFixed(2) : idx}
                      </td>
                      {models.map(([name]) => (
                        <td key={name} style={{ fontWeight: 600 }}>
                          {row[name] != null ? Number(row[name]).toFixed(4) : '—'}
                        </td>
                      ))}
                      {models.map(([name]) => (
                        <td key={`${name}-fpr`} style={{ color: 'var(--muted)' }}>
                          {row[`${name}_fpr`] != null ? Number(row[`${name}_fpr`]).toFixed(4) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rocData.length > 20 && (
              <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Showing first 20 of {rocData.length} data points
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
