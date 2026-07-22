import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, Trash2, XCircle, LoaderCircle, ChevronDown, Filter } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { fetchHistory, deleteHistoryRecord, clearAllHistory } from '../api/client';
import styles from './HistoryPage.module.css';

const MODELS = ['All', 'CNN', 'LSTM', 'Transformer'];

function formatDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const shouldReduceMotion = useReducedMotion();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('All');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const limit = 25;

  const loadHistory = useCallback(async (reset = false) => {
    setLoading(true);
    setError('');
    try {
      const currentOffset = reset ? 0 : offset;
      const params = { limit, offset: currentOffset };
      if (search.trim()) params.search = search.trim();
      if (modelFilter !== 'All') params.model = modelFilter;

      const data = await fetchHistory(params);
      const newRecords = data.records || [];
      setTotal(data.total || 0);

      if (reset) {
        setRecords(newRecords);
        setOffset(limit);
      } else {
        setRecords((prev) => [...prev, ...newRecords]);
        setOffset((prev) => prev + limit);
      }
      setHasMore(newRecords.length === limit);
    } catch (err) {
      setError(err?.response?.data?.detail?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [offset, search, modelFilter]);

  useEffect(() => {
    setOffset(0);
    loadHistory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, modelFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteHistoryRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err?.response?.data?.detail?.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearAllHistory();
      setRecords([]);
      setTotal(0);
      setHasMore(false);
      setOffset(0);
    } catch (err) {
      setError(err?.response?.data?.detail?.message || 'Failed to clear history.');
    } finally {
      setClearing(false);
    }
  };

  const fadeUp = {
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  };

  return (
    <PageLayout title="Prediction History" subtitle="Browse and manage all past predictions.">
      <motion.section className={styles.toolbar} {...fadeUp}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by disease or sequence…"
            value={search}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterWrap}>
          <Filter size={16} />
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className={styles.modelSelect}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {records.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={handleClearAll}
            disabled={clearing}
          >
            {clearing ? <LoaderCircle size={16} className={styles.spin} /> : <XCircle size={16} />}
            {clearing ? 'Clearing…' : 'Clear All'}
          </button>
        )}
      </motion.section>

      <motion.section className={styles.tablePanel} {...fadeUp}>
        {error && <div className={styles.errorBox}>{error}</div>}

        {loading && records.length === 0 ? (
          <div className={styles.skeleton}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skelCell} style={{ width: '10%' }} />
                <div className={styles.skelCell} style={{ width: '30%' }} />
                <div className={styles.skelCell} style={{ width: '15%' }} />
                <div className={styles.skelCell} style={{ width: '15%' }} />
                <div className={styles.skelCell} style={{ width: '20%' }} />
                <div className={styles.skelCell} style={{ width: '10%' }} />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={40} strokeWidth={1.2} />
            <h3>No predictions found</h3>
            <p>Submit a DNA sequence on the Predict page to see your history here.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Disease</th>
                    <th>Confidence</th>
                    <th>Model</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id} className={styles.tableRow}>
                      <td className={styles.cellId}>{rec.id}</td>
                      <td className={styles.cellDisease}>{rec.predicted_disease || '-'}</td>
                      <td>
                        <span className={styles.confBadge}>
                          {rec.confidence != null ? `${rec.confidence}%` : '-'}
                        </span>
                      </td>
                      <td>{rec.model || '-'}</td>
                      <td className={styles.cellDate}>{formatDate(rec.timestamp)}</td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(rec.id)}
                          disabled={deletingId === rec.id}
                          title="Delete record"
                        >
                          {deletingId === rec.id ? (
                            <LoaderCircle size={14} className={styles.spin} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.totalLabel}>{total} total records</span>
              {hasMore && (
                <button
                  className={styles.loadMoreBtn}
                  onClick={() => loadHistory(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle size={16} className={styles.spin} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              )}
            </div>
          </>
        )}
      </motion.section>
    </PageLayout>
  );
}