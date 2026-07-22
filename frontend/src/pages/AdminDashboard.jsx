import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import {
  Activity, ShieldCheck, RefreshCw, BarChart3, TrendingUp, HeartPulse, LoaderCircle,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { fetchAdminStats, fetchHealth } from '../api/client';
import styles from './AdminDashboard.module.css';

const initialStats = {
  total_predictions: 0,
  average_confidence: 0,
  most_predicted_disease: '-',
  model_usage: [],
  predictions_per_day: [],
};

export default function AdminDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);

  const loadStats = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await fetchAdminStats();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        setStats(initialStats);
      }
    } catch (err) {
      setError(err?.response?.data?.detail?.message || 'Failed to load admin stats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Check health first
      try {
        await fetchHealth();
        if (mounted) setBackendOnline(true);
      } catch {
        if (mounted) setBackendOnline(false);
      } finally {
        if (mounted) setHealthChecked(true);
      }

      // Then load stats
      if (mounted) loadStats();
    }

    init();

    const interval = setInterval(async () => {
      try {
        await fetchHealth();
        if (mounted) setBackendOnline(true);
      } catch {
        if (mounted) setBackendOnline(false);
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadStats]);

  const fadeUp = {
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  };

  const modelUsageData = (stats.model_usage || []).map((item) => ({
    name: item.model || item.name || 'Unknown',
    predictions: item.count || item.predictions || 0,
  }));

  const predictionsPerDayData = (stats.predictions_per_day || []).map((item) => ({
    date: item.date || item.day || '-',
    predictions: item.count || item.predictions || 0,
  }));

  const summaryCards = [
    {
      icon: <Activity size={22} />,
      label: 'Total Predictions',
      value: stats.total_predictions?.toLocaleString() || '0',
      color: 'var(--primary)',
    },
    {
      icon: <TrendingUp size={22} />,
      label: 'Average Confidence',
      value: stats.average_confidence != null ? `${stats.average_confidence}%` : '-',
      color: '#16a34a',
    },
    {
      icon: <HeartPulse size={22} />,
      label: 'Most Predicted Disease',
      value: stats.most_predicted_disease || '-',
      color: '#d946ef',
    },
  ];

  if (loading) {
    return (
      <PageLayout title="Admin Dashboard" subtitle="System overview and performance metrics.">
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${styles.panel} ${styles.skeletonPanel}`}>
              <div className={styles.skeletonCard}>
                <div className={styles.skelCircle} />
                <div className={styles.skelLines}>
                  <div className={styles.skelLine} style={{ width: '40%' }} />
                  <div className={styles.skelLine} style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          ))}
          <div className={`${styles.panel} ${styles.skeletonPanel}`} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.skelChart}>
              <div className={styles.skelLine} style={{ width: '50%', height: 24, marginBottom: 20 }} />
              <div style={{ height: 200, borderRadius: 16, background: 'rgba(203,213,225,0.2)' }} />
            </div>
          </div>
          <div className={`${styles.panel} ${styles.skeletonPanel}`} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.skelChart}>
              <div className={styles.skelLine} style={{ width: '50%', height: 24, marginBottom: 20 }} />
              <div style={{ height: 200, borderRadius: 16, background: 'rgba(203,213,225,0.2)' }} />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Admin Dashboard" subtitle="System overview and performance metrics.">
      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.toolbar}>
        <div className={styles.healthIndicator}>
          <span className={`${styles.healthDot} ${healthChecked ? (backendOnline ? styles.healthOnline : styles.healthOffline) : styles.healthChecking}`} />
          <span>
            {!healthChecked
              ? 'Checking…'
              : backendOnline
                ? 'All Systems Operational'
                : 'Backend Not Reachable'}
          </span>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => loadStats(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <LoaderCircle size={16} className={styles.spin} />
          ) : (
            <RefreshCw size={16} />
          )}
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.cardGrid}>
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.label}
            className={styles.statCard}
            {...fadeUp}
            transition={{ delay: idx * 0.06 }}
          >
            <div className={styles.statIcon} style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>{card.label}</span>
              <strong className={styles.statValue}>{card.value}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Model Usage Bar Chart */}
      <motion.section className={styles.panel} {...fadeUp}>
        <div className={styles.panelHead}>
          <BarChart3 size={20} />
          <h2>Model Usage</h2>
        </div>
        {modelUsageData.length > 0 ? (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelUsageData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: '1px solid rgba(203,213,225,0.6)',
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 13, fontWeight: 600 }}
                />
                <Bar
                  dataKey="predictions"
                  name="Predictions"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.emptyChart}>
            <BarChart3 size={28} strokeWidth={1} />
            <p>No model usage data available.</p>
          </div>
        )}
      </motion.section>

      {/* Predictions Per Day Line Chart */}
      <motion.section className={styles.panel} {...fadeUp}>
        <div className={styles.panelHead}>
          <TrendingUp size={20} />
          <h2>Predictions Per Day</h2>
        </div>
        {predictionsPerDayData.length > 0 ? (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={predictionsPerDayData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(203,213,225,0.3)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: '1px solid rgba(203,213,225,0.6)',
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
                <Line
                  type="monotone"
                  dataKey="predictions"
                  name="Predictions"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', stroke: 'white', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.emptyChart}>
            <TrendingUp size={28} strokeWidth={1} />
            <p>No daily prediction data available.</p>
          </div>
        )}
      </motion.section>
    </PageLayout>
  );
}
