import { BookOpen, ShieldCheck } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastScientificInterpretation({ topHit }) {
  return (
    <div className={styles.interpretationBox}>
      <div className={styles.interpHeader}>
        <BookOpen size={16} className={styles.iconBlue} />
        <h4>Scientific Interpretation & Biological Significance</h4>
      </div>

      {topHit ? (
        <p className={styles.interpBody}>
          The uploaded DNA sequence demonstrated a <strong>{topHit.identity}% similarity</strong> with the{' '}
          <em>{topHit.organism}</em> reference sequence for <strong>{topHit.gene}</strong> ({topHit.accession}).
          The high sequence identity provides strong biological evidence supporting the AI disease classification and confirms the evolutionary conservation of this nucleotide window.
        </p>
      ) : (
        <p className={styles.interpBody}>
          No statistically significant nucleotide alignment was identified under the selected BLAST parameters (E-value threshold: 10.0).
          <br /><br />
          This outcome <strong>does not indicate an invalid DNA sequence</strong> and should not be interpreted as a negative disease result.
          GenomeAI's 1D-CNN model evaluates learned multi-scale non-coding motifs, structural variant patterns, and epigenetic signals independently of traditional sequence alignment database matches.
        </p>
      )}

      <div className={styles.interpFooterNote}>
        <ShieldCheck size={14} />
        <span>Complementary Decision Support: Combine BLAST alignment metrics with ClinVar variant annotations and clinical findings.</span>
      </div>
    </div>
  );
}
