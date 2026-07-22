import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Dna,
  Activity,
  AlertTriangle,
  BarChart3,
  PieChart,
  TrendingUp,
  Layers
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
import { fetchAnalytics } from '../api/client';
import styles from './DatasetAnalytics.module.css';

const NUCLEOTIDE_COLORS = {
  A: '#2563eb',
  T: '#06b6d4',
  G: '#8b5cf6',
  C: '#10b981',
  N: '#f59e0b'
};

const DISEASE_COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1'];

export default function DatasetAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAnalytics()
      .then(res => {
        if (mounted && res?.success && res?.analytics) {
          setData(res.analytics);
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
      <PageLayout title="Dataset Analytics" subtitle="Rich visualizations of genomic dataset characteristics">
        <LoadingSkeleton count={4} columns={4} chart />
      </PageLayout>
    );
  }

  const a = data || {};

  // Stats
  const statCards = [
    { label: 'Dataset Size', value: a.dataset_size?.toLocaleString() ?? '—', icon: Database, color: '#2563eb' },
    { label: 'Disease Classes', value: a.disease_classes ?? '—', icon: Layers, color: '#8b5cf6' },
    { label: 'Training Samples', value: a.training_samples?.toLocaleString() ?? '—', icon: BarChart3, color: '#06b6d4' },
    { label: 'Testing Samples', value: a.testing_samples?.toLocaleString() ?? '—', icon: Activity, color: '#10b981' }
  ];

  // Disease Distribution
  const diseaseDistro = a.class_distribution
    ? Object.entries(a.class_distribution).map(([name, value]) => ({
        name,
        count: typeof value === 'number' ? value : parseInt(value) || 0
      }))
    : [];

  const maxDiseaseCount = Math.max(...diseaseDistro.map(d => d.count), 1);

  // Nucleotide Frequency
  const nucFreq = a.nucleotide_frequency
    ? Object.entries(a.nucleotide_frequency).map(([base, freq]) => ({
        base,
        frequency: typeof freq === 'number' ? freq : parseFloat(freq) || 0
      }))
    : [];

  // Mutation Frequency per disease
  const mutationFreq = a.mutation_frequency
    ? Object.entries(a.mutation_frequency).map(([disease, freq]) => ({
        disease,
        frequency: typeof freq === 'number' ? freq : parseFloat(freq) || 0
      }))
    : [];

  // Sequence length for class imbalance visualization
  const classImbalanceData = diseaseDistro.map(d => ({
    name: d.name,
    samples: d.count
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color || 'var(--ink)' }}>
            <strong>{p.name || label}:</strong> {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
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
            <Database size={18} />
            Dataset Insights
          </div>
          <h1>Dataset Analytics</h1>
          <p>
            Comprehensive visual exploration of genome sequence data, including disease
            distributions, nucleotide composition, and mutation patterns per disease.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className={styles.statsGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {statCards.map((card, idx) => (
            <motion.div key={idx} className={styles.statCard} variants={itemVariants}>
              <div className={styles.statIcon} style={{ background: `${card.color}14`, color: card.color }}>
                <card.icon size={20} />
              </div>
              <div className={styles.statLabel}>{card.label}</div>
              <div className={styles.statValue}>{card.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Disease Distribution (Horizontal Bar) */}
        {diseaseDistro.length > 0 && (
          <motion.div
            className={styles.panel}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <h2>Disease Distribution</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={diseaseDistro}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    axisLine={{ stroke: 'rgba(203,213,225,0.3)' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: 'var(--ink)', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Sample Count"
                    fill="#2563eb"
                    radius={[0, 8, 8, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Class Imbalance + Nucleotide Frequency */}
        <motion.div
          className={styles.chartsRow}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div className={styles.panel} variants={itemVariants}>
            <h2>Class Imbalance</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classImbalanceData} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(203,213,225,0.3)' }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="samples"
                    name="Samples"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className={styles.panel} variants={itemVariants}>
            <h2>Nucleotide Frequency</h2>
            {nucFreq.length > 0 ? (
              <>
                {nucFreq.map(({ base, frequency }) => (
                  <div key={base} className={styles.freqRow}>
                    <div
                      className={styles.freqLabel}
                      style={{ background: NUCLEOTIDE_COLORS[base] || '#888' }}
                    >
                      {base}
                    </div>
                    <div className={styles.freqTrack}>
                      <div
                        className={styles.freqFill}
                        style={{
                          width: `${Math.min(frequency * 100, 100)}%`,
                          background: NUCLEOTIDE_COLORS[base] || '#888'
                        }}
                      />
                    </div>
                    <span className={styles.freqPercent}>
                      {(frequency * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No nucleotide frequency data available.</p>
            )}
          </motion.div>
        </motion.div>

        {/* Mutation Frequency per Disease */}
        {mutationFreq.length > 0 && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>Mutation Frequency per Disease</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mutationFreq}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    axisLine={{ stroke: 'rgba(203,213,225,0.3)' }}
                  />
                  <YAxis
                    dataKey="disease"
                    type="category"
                    tick={{ fontSize: 11, fill: 'var(--ink)', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="frequency"
                    name="Mutation Rate"
                    fill="#06b6d4"
                    radius={[0, 8, 8, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Additional Genomic Metrics */}
        {a.gc_content && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>Genomic Composition Overview</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'GC Content (Mean)', value: a.gc_content.mean ?? 0, fill: '#2563eb' },
                    { name: 'GC Content (Min)', value: a.gc_content.min ?? 0, fill: '#8b5cf6' },
                    { name: 'GC Content (Max)', value: a.gc_content.max ?? 0, fill: '#10b981' }
                  ]}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(203,213,225,0.3)' }}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v.toFixed(1)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="GC %"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
