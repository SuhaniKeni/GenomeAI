import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ShieldCheck, Dna, Clock, FileText, Sparkles,
  ArrowRight, CheckCircle2, RefreshCw, BarChart2, Zap, Layers
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import { fetchHealth, fetchHistory, fetchAnalytics, fetchModelMetrics } from '../api/client.js';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    recentList: [],
    systemStatus: 'Checking...',
    datasetSize: '19,984',
  });
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      try {
        const [healthRes, historyRes, analyticsRes, metricsRes] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchHistory({ limit: 6 }).catch(() => ({ items: [], total: 0 })),
          fetchAnalytics().catch(() => null),
          fetchModelMetrics().catch(() => null),
        ]);

        if (mounted) {
          setStats({
            totalAnalyses: historyRes?.total || 0,
            recentList: historyRes?.items || [],
            systemStatus: healthRes ? 'Online' : 'Offline',
            datasetSize: analyticsRes?.analytics?.dataset_size
              ? Number(analyticsRes.analytics.dataset_size).toLocaleString()
              : '19,984',
          });
          if (metricsRes && metricsRes.available !== false && metricsRes.accuracy) {
            setModelMetrics(metricsRes);
          } else {
            setModelMetrics(null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>

        {/* Banner Hero */}
        <div className={styles.heroBanner}>
          <div className={styles.heroLeft}>
            <span className={styles.heroKicker}>Clinical Decision Support System</span>
            <h1>Molecular Laboratory Control Dashboard</h1>
            <p>
              AI-assisted genomic disease risk classification, sequence validation, and clinical laboratory reporting.
            </p>

            <div className={styles.heroActions}>
              <Link to="/analysis" className={styles.primaryCta}>
                <Sparkles size={18} />
                <span>New DNA Analysis</span>
              </Link>
              <Link to="/history" className={styles.secondaryCta}>
                <Clock size={18} />
                <span>Analysis History</span>
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.engineCard}>
              <div className={styles.engineHeader}>
                <Dna className={styles.dnaIcon} size={20} />
                <div>
                  <strong>GenomeAI CNN Engine</strong>
                  <span className={styles.verText}>v2.0 Verified</span>
                </div>
              </div>

              <div className={styles.statList}>
                <div><span>Test Accuracy:</span> <strong>{modelMetrics ? `${modelMetrics.accuracy}%` : 'Not Available'}</strong></div>
                <div><span>Macro F1:</span> <strong>{modelMetrics ? `${modelMetrics.macro_f1}%` : 'N/A'}</strong></div>
                <div><span>Dataset Variants:</span> <strong>{modelMetrics ? modelMetrics.dataset_size?.toLocaleString() : stats.datasetSize}</strong></div>
                <div><span>Engine Latency:</span> <strong>{modelMetrics ? `~${modelMetrics.inference_time_ms} ms` : '~9.5 ms'}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <Activity className={styles.iconBlue} size={18} />
              <span>Total Analyses</span>
            </div>
            <div className={styles.metricVal}>{loading ? '...' : stats.totalAnalyses}</div>
            <span className={styles.subText}>Logged in LIS database</span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <ShieldCheck className={styles.iconTeal} size={18} />
              <span>Engine Status</span>
            </div>
            <div className={styles.metricVal}>{stats.systemStatus}</div>
            <span className={styles.subText}>FastAPI REST Backend</span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <BarChart2 className={styles.iconNavy} size={18} />
              <span>CNN Accuracy</span>
            </div>
            <div className={styles.metricVal}>
              {modelMetrics ? `${modelMetrics.accuracy}%` : 'Not Available'}
            </div>
            <span className={styles.subText}>
              {modelMetrics ? `${modelMetrics.test_samples?.toLocaleString()} Test Samples` : '19,984 genomic samples'}
            </span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <FileText className={styles.iconGreen} size={18} />
              <span>Generated Reports</span>
            </div>
            <div className={styles.metricVal}>{loading ? '...' : stats.totalAnalyses}</div>
            <span className={styles.subText}>Clinical PDF reports</span>
          </div>
        </div>

        {/* Recent Laboratory Activity Section */}
        <div className={styles.sectionCard}>
          <div className={styles.secHeader}>
            <div>
              <h3>Recent Laboratory Activity</h3>
              <p>Latest DNA sequence disease risk predictions processed by GenomeAI</p>
            </div>
            <Link to="/history" className={styles.viewAllLink}>
              View All History <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Analysis ID</th>
                  <th>Predicted Disease Association</th>
                  <th>Confidence Score</th>
                  <th>Confidence Level</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentList.length > 0 ? (
                  stats.recentList.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.idCell}>
                        <strong>ANL-{item.id}</strong>
                      </td>
                      <td className={styles.diseaseCell}>
                        <strong>{item.predicted_disease}</strong>
                      </td>
                      <td>
                        <span className={styles.confBadge}>{item.confidence}%</span>
                      </td>
                      <td>
                        <span className={styles.levelBadge}>{item.confidence_level}</span>
                      </td>
                      <td className={styles.timeCell}>{item.created_at || 'Recently'}</td>
                      <td>
                        <span className={styles.statusCompleted}>
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>
                      No analyses recorded yet. Click "New DNA Analysis" to start your first sequence analysis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
