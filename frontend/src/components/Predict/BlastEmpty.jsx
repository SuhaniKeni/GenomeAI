import { CheckCircle2, Info, HelpCircle } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastEmpty({ message }) {
  return (
    <div className={styles.emptyBoxContainer}>
      <div className={styles.emptyHeaderRow}>
        <CheckCircle2 size={22} className={styles.iconGreen} />
        <div>
          <h4 className={styles.emptyTitle}>Analysis Completed Successfully</h4>
          <p className={styles.emptySub}>
            No statistically significant sequence similarity was identified in the selected NCBI nucleotide database.
          </p>
        </div>
      </div>

      <div className={styles.reasonsBox}>
        <strong><Info size={14} /> Potential Biological & Technical Factors:</strong>
        <ul className={styles.reasonsList}>
          <li>The submitted sequence may represent a novel genomic region or variant.</li>
          <li>The sequence may belong to an uncharacterized or non-reference locus.</li>
          <li>The 201 bp window may be too concise to form a statistically unique alignment.</li>
          <li>Default BLAST parameters (word size: 11) may exclude ultra-short motif matches.</li>
          <li>The sequence may represent an unannotated non-coding or intronic segment.</li>
        </ul>
      </div>

      <div className={styles.reassuranceBox}>
        <CheckCircle2 size={16} className={styles.iconGreen} />
        <div>
          <strong>AI Prediction Validation Note:</strong>
          <p>
            The absence of a BLAST database match <strong>DOES NOT invalidate</strong> the GenomeAI CNN disease prediction.
            The CNN model analyzes learned multi-scale spatial motifs and structural features independently of database alignment lookup.
          </p>
        </div>
      </div>
    </div>
  );
}
