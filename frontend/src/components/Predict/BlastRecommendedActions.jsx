import { RefreshCw, Sliders, ExternalLink, Download, ArrowDownCircle, Shield } from 'lucide-react';
import styles from './BlastCard.module.css';

export default function BlastRecommendedActions({ onRetry, blastData, sequence }) {
  const handleDownloadSummary = () => {
    const topHit = blastData?.top_hit;
    const textContent = `==================================================
GenomeAI BLAST Sequence Similarity Analysis Report
==================================================
Date: ${new Date().toLocaleString()}
Program: BLASTN
Database: NCBI Nucleotide (nt)
Query Length: ${sequence?.length || 201} bp
Status: ${blastData?.status || 'Completed'}

RESULTS SUMMARY:
Top Gene Match: ${topHit?.gene || 'None'}
Accession: ${topHit?.accession || 'N/A'}
Identity %: ${topHit?.identity || 0}%
Coverage %: ${topHit?.coverage || 0}%
Alignment Length: ${topHit?.alignment_length || 0} bp
Bit Score: ${topHit?.bit_score || 0}
E-value: ${topHit?.evalue || 'N/A'}
Organism: ${topHit?.organism || 'N/A'}
Description: ${topHit?.description || 'No matching sequence alignments identified.'}

DIAGNOSTIC NOTE:
Absent database similarity does not invalidate the AI prediction.
The GenomeAI CNN model analyzes multi-scale non-coding motifs independently.
==================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GenomeAI_BLAST_Summary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScrollToClinVar = () => {
    const el = document.querySelector('[class*="evidenceCard"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.actionsCardBox}>
      <h4 className={styles.actionsTitle}>
        <Sliders size={16} className={styles.iconBlue} />
        Recommended Actions & Next Steps
      </h4>

      <div className={styles.actionButtonsGrid}>
        {onRetry && (
          <button type="button" className={styles.actionCardBtn} onClick={onRetry}>
            <RefreshCw size={16} className={styles.btnIconBlue} />
            <div>
              <strong>Retry BLAST Search</strong>
              <span>Re-query NCBI remote alignment</span>
            </div>
          </button>
        )}

        {onRetry && (
          <button type="button" className={styles.actionCardBtn} onClick={onRetry}>
            <Sliders size={16} className={styles.btnIconPurple} />
            <div>
              <strong>Search with Relaxed Parameters</strong>
              <span>Adjust word size & expected threshold</span>
            </div>
          </button>
        )}

        <a
          href="https://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn&PAGE_TYPE=BlastSearch"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionCardBtn}
        >
          <ExternalLink size={16} className={styles.btnIconGreen} />
          <div>
            <strong>Search Directly on NCBI</strong>
            <span>Open official NCBI Web BLAST tool</span>
          </div>
        </a>

        <button type="button" className={styles.actionCardBtn} onClick={handleDownloadSummary}>
          <Download size={16} className={styles.btnIconAmber} />
          <div>
            <strong>Download Analysis Summary</strong>
            <span>Save text summary report (.txt)</span>
          </div>
        </button>

        <button type="button" className={styles.actionCardBtn} onClick={handleScrollToClinVar}>
          <ArrowDownCircle size={16} className={styles.btnIconCyan} />
          <div>
            <strong>Continue to ClinVar Evidence</strong>
            <span>Inspect genomic annotations & variants</span>
          </div>
        </button>
      </div>
    </div>
  );
}
