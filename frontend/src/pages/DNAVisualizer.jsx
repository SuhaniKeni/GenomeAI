import { useMemo, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ZoomIn, ZoomOut, Dna } from 'lucide-react';

import PageLayout from '../components/PageLayout';
import styles from './DNAVisualizer.module.css';

const BASE_COLORS = {
  A: '#22c55e',
  T: '#ef4444',
  G: '#3b82f6',
  C: '#eab308',
  N: '#94a3b8',
};

const BASE_LABELS = {
  A: 'Adenine',
  T: 'Thymine',
  G: 'Guanine',
  C: 'Cytosine',
  N: 'Unknown',
};

function normalizeSequence(text) {
  return String(text || '')
    .replace(/^>.*$/gm, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function computeStats(seq) {
  const chars = seq.split('');
  const counts = { A: 0, T: 0, G: 0, C: 0, N: 0 };
  for (const ch of chars) {
    if (counts[ch] !== undefined) counts[ch]++;
  }
  const length = chars.length;
  const gc = length > 0 ? ((counts.G + counts.C) / length) * 100 : 0;
  return { counts, length, gcContent: gc };
}

export default function DNAVisualizer() {
  const shouldReduceMotion = useReducedMotion();
  const [rawSequence, setRawSequence] = useState('');
  const [zoom, setZoom] = useState(1);
  const [hoveredBase, setHoveredBase] = useState(null);
  const visRef = useRef(null);

  const sequence = useMemo(() => normalizeSequence(rawSequence), [rawSequence]);
  const stats = useMemo(() => computeStats(sequence), [sequence]);
  const bases = useMemo(() => sequence.split(''), [sequence]);

  const handleZoomIn = () => setZoom((v) => Math.min(v + 0.25, 3));
  const handleZoomOut = () => setZoom((v) => Math.max(v - 0.25, 0.25));

  const handleZoomSlider = (e) => {
    setZoom(parseFloat(e.target.value));
  };

  return (
    <PageLayout
      title="DNA Sequence Visualizer"
      subtitle="Visualize, explore, and analyze DNA sequences with interactive colored blocks."
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
              <span className={styles.panelKicker}>Sequence Input</span>
              <h2>Enter DNA Sequence</h2>
            </div>
            <span className={styles.chip}>
              <Dna size={14} /> {stats.length} bp
            </span>
          </div>

          <label className={styles.field}>
            <span>Paste DNA sequence (A, T, G, C, N)</span>
            <textarea
              value={rawSequence}
              onChange={(e) => setRawSequence(e.target.value)}
              placeholder="Paste or type your DNA sequence using A, T, G, C, N..."
              rows={8}
            />
          </label>

          {/* LEGEND */}
          <div className={styles.legend}>
            {Object.entries(BASE_COLORS).map(([base, color]) => (
              <div key={base} className={styles.legendItem}>
                <span className={styles.legendBlock} style={{ backgroundColor: color }} />
                {base} — {BASE_LABELS[base]}
              </div>
            ))}
          </div>

          {/* STATS */}
          {sequence.length > 0 && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>GC Content</span>
                <span className={styles.statValue}>
                  {stats.gcContent.toFixed(1)}%
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Length</span>
                <span className={styles.statValue}>
                  {stats.length.toLocaleString()}
                </span>
              </div>
              {Object.entries(stats.counts).map(([base, count]) => (
                <div key={base} className={styles.statCard}>
                  <span className={styles.statLabel}>{base} Count</span>
                  <span className={styles.statValue}>{count}</span>
                  <span className={styles.statHighlight}>
                    {stats.length > 0
                      ? ((count / stats.length) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* VISUALIZATION PANEL */}
        <motion.div
          className={styles.panel}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>Visualization</span>
              <h2>Sequence View</h2>
            </div>
          </div>

          {sequence.length === 0 ? (
            <div className={styles.hint}>
              Enter a DNA sequence in the left panel to see the visualization.
              Each nucleotide is displayed as a colored block —
              <strong>A</strong> (green), <strong>T</strong> (red),
              <strong>G</strong> (blue), <strong>C</strong> (yellow),
              <strong>N</strong> (gray).
            </div>
          ) : (
            <div className={styles.visContainer}>
              {/* ZOOM CONTROLS */}
              <div className={styles.zoomControls}>
                <ZoomOut size={18} onClick={handleZoomOut} style={{ cursor: 'pointer', color: 'var(--muted)' }} />
                <input
                  type="range"
                  min={0.25}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={handleZoomSlider}
                  className={styles.zoomSlider}
                />
                <ZoomIn size={18} onClick={handleZoomIn} style={{ cursor: 'pointer', color: 'var(--muted)' }} />
                <span className={styles.zoomValue}>{zoom.toFixed(2)}×</span>
              </div>

              {/* BASES CONTAINER */}
              <div className={styles.visWrapper} ref={visRef}>
                <div className={styles.basesRow} style={{ transform: `scale(${zoom})` }}>
                  {bases.map((base, index) => (
                    <div
                      key={index}
                      className={styles.baseBlock}
                      style={{ backgroundColor: BASE_COLORS[base] || '#94a3b8' }}
                      onMouseEnter={() => setHoveredBase({ base, position: index + 1 })}
                      onMouseLeave={() => setHoveredBase(null)}
                    >
                      {hoveredBase && hoveredBase.position === index + 1 && (
                        <span className={styles.baseTooltip}>
                          {index + 1}: {base}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>
    </PageLayout>
  );
}
