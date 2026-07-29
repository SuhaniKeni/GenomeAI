import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Info } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastTechnicalDetails({ queryLength = 201, executionTimeMs }) {
  const [isOpen, setIsOpen] = useState(false);

  const searchTimeSec = executionTimeMs ? (executionTimeMs / 1000).toFixed(1) : '1.5';

  return (
    <div className={styles.technicalAccordionBox}>
      <button
        type="button"
        className={styles.accordionToggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.toggleLeft}>
          <Cpu size={16} className={styles.iconBlue} />
          <strong>Technical Details & Alignment Parameters</strong>
        </span>
        <span className={styles.toggleRight}>
          <span className={styles.advBadge}>Advanced</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className={styles.accordionContent}>
          <div className={styles.techDetailsGrid}>
            <div><span>Program Name:</span> <strong>BLASTN (Nucleotide-Nucleotide)</strong></div>
            <div><span>Database Target:</span> <strong>NCBI nt (Nucleotide Collection)</strong></div>
            <div><span>Algorithm Type:</span> <strong>Local Alignment Search Tool</strong></div>
            <div><span>Sequence Length:</span> <strong>{queryLength} bp</strong></div>
            <div><span>Word Size:</span> <strong>11 nucleotides</strong></div>
            <div><span>Expected Threshold (E):</span> <strong>10.0</strong></div>
            <div><span>Gap Penalty:</span> <strong>Existence: 5, Extension: 2</strong></div>
            <div><span>Match / Mismatch:</span> <strong>1 / -2</strong></div>
            <div><span>Execution Latency:</span> <strong>{searchTimeSec} sec ({executionTimeMs || 1500} ms)</strong></div>
            <div><span>Query Mechanism:</span> <strong>Biopython Bio.Blast.NCBIWWW Async</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
