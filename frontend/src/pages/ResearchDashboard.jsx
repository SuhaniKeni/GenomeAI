import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Activity,
  Beaker,
  Dna,
  PieChart,
  BarChart3,
  BookOpen,
  Percent,
  UserCheck,
  Layers
} from 'lucide-react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import PageLayout from '../components/PageLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { fetchAnalytics } from '../api/client';
import styles from './ResearchDashboard.module.css';

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1'];

const PIE_COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1'];

export default function ResearchDashboard() {
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
      <PageLayout title="Research Dashboard" subtitle="Exploring dataset characteristics and distributions">
        <LoadingSkeleton count={4} columns={4} chart />
      </PageLayout>
    );
  }

  const a = data || {};

  // Stats cards data
  const statCards = [
    { label: 'Dataset Size', value: a.dataset_size?.toLocaleString() ?? '—', icon: Database, color: '#2563eb' },
    { label: 'Disease Classes', value: a.disease_classes ?? '—', icon: Layers, color: '#8b5cf6' },
    { label: 'Training Samples', value: a.training_samples?.toLocaleString() ?? '—', icon: BookOpen, color: '#06b6d4' },
    { label: 'Testing Samples', value: a.testing_samples?.toLocaleString() ?? '—', icon: Beaker, color: '#10b981' }
  ];

  // Class distribution for pie chart
  const classDistro = a.class_distribution
    ? Object.entries(a.class_distribution).map(([name, value]) => ({
        name,
        value: typeof value === 'number' ? value : parseInt(value) || 0
      }))
    : [];

  // Sequence length data
  const seqLenData = a.sequence_length
    ? [{ name: 'Min', value: a.sequence_length.min ?? 0 },
       { name: 'Max', value: a.sequence_length.max ?? 0 },
       { name: 'Mean', value: Math.round(a.sequence_length.mean ?? 0) },
       { name: 'Median', value: Math.round(a.sequence_length.median ?? 0) }]
    : [];

  // GC Content
  const gcStats = a.gc_content || {};

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
            <Activity size={18} />
            Research Analytics
          </div>
          <h1>Research Dashboard</h1>
          <p>
            In-depth exploration of the genomic dataset used for training and evaluating
            our deep learning models.
          </p>
        </motion.div>

        {/* Stats Cards */}
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
                <card.icon size={22} />
              </div>
              <div className={styles.statLabel}>{card.label}</div>
              <div className={styles.statValue}>{card.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Class Distribution Pie + Sequence Length Bar */}
        <motion.div
          className={styles.chartsRow}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div className={styles.panel} variants={itemVariants}>
            <h2>Class Distribution</h2>
            {classDistro.length > 0 ? (
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={classDistro}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={3}
                    >
                      {classDistro.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          stroke="rgba(255,255,255,0.8)"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                      iconType="circle"
                      iconSize={10}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No class distribution data available.</p>
            )}
          </motion.div>

          <motion.div className={styles.panel} variants={itemVariants}>
            <h2>Sequence Length Distribution</h2>
            {seqLenData.length > 0 ? (
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seqLenData} barGap={8}>
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
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Length (bp)"
                      fill="#2563eb"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No sequence length data available.</p>
            )}
          </motion.div>
        </motion.div>

        {/* GC Content Panel */}
        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2>GC Content Statistics</h2>
          <div className={styles.gcContent}>
            {gcStats.mean != null ? (
              <>
                <div className={styles.gcBar}>
                  <span className={styles.gcLabel}>Mean GC</span>
                  <div className={styles.gcTrack}>
                    <div
                      className={styles.gcFill}
                      style={{ width: `${Math.min((gcStats.mean / 100) * 100, 100)}%` }}
                    >
                      <span>{gcStats.mean.toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className={styles.gcPercent}>{gcStats.mean.toFixed(1)}%</span>
                </div>
                {gcStats.min != null && (
                  <div className={styles.gcBar}>
                    <span className={styles.gcLabel}>Min GC</span>
                    <div className={styles.gcTrack}>
                      <div
                        className={styles.gcFill}
                        style={{
                          width: `${Math.min((gcStats.min / 100) * 100, 100)}%`,
                          background: 'linear-gradient(90deg, #8b5cf6, #2563eb)'
                        }}
                      >
                        <span>{gcStats.min.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className={styles.gcPercent}>{gcStats.min.toFixed(1)}%</span>
                  </div>
                )}
                {gcStats.max != null && (
                  <div className={styles.gcBar}>
                    <span className={styles.gcLabel}>Max GC</span>
                    <div className={styles.gcTrack}>
                      <div
                        className={styles.gcFill}
                        style={{
                          width: `${Math.min((gcStats.max / 100) * 100, 100)}%`,
                          background: 'linear-gradient(90deg, #06b6d4, #10b981)'
                        }}
                      >
                        <span>{gcStats.max.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className={styles.gcPercent}>{gcStats.max.toFixed(1)}%</span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No GC content data available.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
