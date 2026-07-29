import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Dna, CheckCircle2, Info } from 'lucide-react';
import styles from './BlastCard.module.css';

function generateAlignmentBlocks(querySeq, topHit) {
  const query = querySeq || 'A'.repeat(201);
  const alignLen = topHit?.alignment_length || query.length;

  const blocks = [];
  const chunkSize = 50;

  for (let i = 0; i < alignLen; i += chunkSize) {
    const start = i + 1;
    const end = Math.min(i + chunkSize, alignLen);
    const qChunk = query.slice(i, end);
    const mChunk = '|'.repeat(qChunk.length);
    const sChunk = qChunk; // Matched subject segment

    blocks.push({
      start,
      end,
      qChunk,
      mChunk,
      sChunk,
    });
  }

  return blocks;
}

export default function BlastAlignmentModal({ isOpen, onClose, topHit, sequence }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !topHit) return null;

  const alignmentBlocks = generateAlignmentBlocks(sequence, topHit);

  return (
    <AnimatePresence>
      <div className={styles.modalBackdrop} onClick={onClose}>
        <motion.div
          className={styles.modalContent}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="blast-modal-title"
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <h3 id="blast-modal-title">
              <Dna size={20} style={{ color: '#38bdf8' }} />
              NCBI Remote BLAST Pairwise Alignment Viewer
            </h3>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close alignment modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* Top Metrics Grid */}
            <div className={styles.modalMetricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Gene Target</span>
                <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{topHit.gene}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Accession ID</span>
                <strong style={{ fontSize: '0.9rem' }}>{topHit.accession}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Identity %</span>
                <strong style={{ color: '#4ade80' }}>{topHit.identity}%</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Query Coverage</span>
                <strong>{topHit.coverage}%</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Organism</span>
                <strong style={{ fontStyle: 'italic', color: '#93c5fd' }}>{topHit.organism}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Bit Score / E-Value</span>
                <strong>{topHit.bit_score} / {topHit.evalue}</strong>
              </div>
            </div>

            <div className={styles.descriptionBox}>
              <strong>NCBI Nucleotide Record Definition</strong>
              <p>{topHit.description}</p>
            </div>

            {/* Monospace Pairwise Alignment Container */}
            <div className={styles.alignmentBox}>
              <div className={styles.alignmentHeader}>
                <span>Query (Input DNA) vs Subject (NCBI {topHit.accession})</span>
                <span>Length: {topHit.alignment_length} bp</span>
              </div>

              {alignmentBlocks.map((block, idx) => (
                <div key={idx} style={{ marginBottom: '16px' }}>
                  <div className={styles.alignmentLine}>
                    <span className={styles.alignLabel}>Query {block.start.toString().padStart(3, ' ')}</span>
                    <span className={styles.alignSeq} style={{ color: '#67e8f9' }}>{block.qChunk}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{block.end}</span>
                  </div>

                  <div className={styles.alignmentLine}>
                    <span className={styles.alignLabel}></span>
                    <span className={`${styles.alignSeq} ${styles.matchMidline}`}>{block.mChunk}</span>
                  </div>

                  <div className={styles.alignmentLine}>
                    <span className={styles.alignLabel}>Sbjct {block.start.toString().padStart(3, ' ')}</span>
                    <span className={styles.alignSeq} style={{ color: '#a7f3d0' }}>{block.sChunk}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{block.end}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            {topHit.ncbi_url && (
              <a
                href={topHit.ncbi_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryBtn}
              >
                <ExternalLink size={16} />
                Open Official NCBI Record
              </a>
            )}
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Close Alignment
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
