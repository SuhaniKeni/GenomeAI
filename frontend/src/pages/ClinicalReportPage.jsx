import { useState } from 'react';
import {
  FileText, Download, Dna, ShieldCheck, User, Sparkles, AlertCircle
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import { downloadPredictionReport } from '../api/client.js';
import styles from './ClinicalReportPage.module.css';


const SAMPLE_201_SEQUENCE =
  'A'.repeat(50) + 'T'.repeat(50) + 'G'.repeat(50) + 'C'.repeat(50) + 'A';

export default function ClinicalReportPage() {
  const [sampleId, setSampleId] = useState('SAM-982104');
  const [patientName, setPatientName] = useState('Jane Doe (Ref: PAT-884)');
  const [sequence, setSequence] = useState(SAMPLE_201_SEQUENCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePDF = async () => {
    const clean = String(sequence || '').replace(/\s+/g, '').toUpperCase();
    if (!clean || clean.length !== 201) {
      setError('Please provide a valid 201-nucleotide sequence to generate the report.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const blob = await downloadPredictionReport(clean, {
        model: 'cnn',
        patientName: patientName || `Sample: ${sampleId}`,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GenomeAI_Clinical_Report_${sampleId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate PDF report from backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>

        <div className={styles.headerRow}>
          <div>
            <span className={styles.kicker}>Laboratory Document Services</span>
            <h1>Clinical PDF Report Generator</h1>
            <p>
              Generate vector-styled ReportLab medical PDF reports containing disease predictions, confidence metrics, and laboratory disclaimers.
            </p>
          </div>
        </div>

        <div className={styles.containerGrid}>
          <div className={styles.formCard}>
            <div className={styles.cardHead}>
              <FileText className={styles.iconBlue} size={20} />
              <h3>Report Configuration</h3>
            </div>

            <div className={styles.formGroup}>
              <label>Sample ID / Specimen Code</label>
              <input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="e.g. SAM-982104"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Patient / Subject Reference Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div className={styles.formGroup}>
              <label>DNA Sequence (201 bp)</label>
              <textarea
                rows={7}
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="Enter 201 nucleotides..."
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleGeneratePDF}
              disabled={loading}
            >
              <Download size={18} />
              <span>{loading ? 'Generating Report...' : 'Generate & Download PDF'}</span>
            </button>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.cardHead}>
              <ShieldCheck className={styles.iconBlue} size={20} />
              <h3>Report Document Structure</h3>
            </div>

            <div className={styles.docMockup}>
              <div className={styles.docHeader}>
                <div>
                  <h4>GenomeAI Clinical Laboratory Analysis Report</h4>
                  <span>Validated 1D-CNN AI Decision Support System</span>
                </div>
                <div className={styles.docLogo}>🧬</div>
              </div>

              <div className={styles.docDivider} />

              <div className={styles.docSection}>
                <strong>Included Sections:</strong>
                <ul>
                  <li>Laboratory Header & Specimen Metadata</li>
                  <li>Predicted Disease Association & Confidence %</li>
                  <li>Ranked Multi-Disease Probability Breakdown Table</li>
                  <li>DNA Sequence Statistics & Base Composition</li>
                  <li>Clinical Recommendation & Mandatory Laboratory Disclaimer</li>
                </ul>
              </div>

              <div className={styles.docNote}>
                <ShieldCheck size={14} />
                <span>PDF binary stream generated directly via ReportLab graphics library</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
