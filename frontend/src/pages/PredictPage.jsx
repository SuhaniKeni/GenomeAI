import { useMemo, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoaderCircle, Upload, FileText, ShieldCheck, Sparkles } from 'lucide-react';

import ParticleBackground from '../components/ParticleBackground.jsx';
import Navbar from '../components/Navbar.jsx';
import GradientButton from '../components/GradientButton.jsx';
import AnimatedDNA from '../components/AnimatedDNA.jsx';
import { downloadPredictionReport, predictSequence, fetchHealth } from '../api/client.js';
import styles from './PredictPage.module.css';

const initialResult = {
  predicted_disease: '-',
  confidence: 0,
  confidence_level: 'Low',
  model: 'CNN',
  sequence_length: 0,
  label: '-',
  all_predictions: [],
};

function normalizeSequence(text) {
  return String(text || '')
    .replace(/^>.*$/gm, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export default function PredictPage() {
  const shouldReduceMotion = useReducedMotion();
  const [sequence, setSequence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(initialResult);
  const [apiStatus, setApiStatus] = useState('Checking...');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await fetchHealth();
        if (mounted) setApiStatus('Online');
      } catch {
        if (mounted) setApiStatus('Offline');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const sequenceLength = useMemo(() => normalizeSequence(sequence).length, [sequence]);

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSequence(normalizeSequence(text));
  };

  const handlePredict = async () => {
    const cleaned = normalizeSequence(sequence);
    setError('');

    if (!cleaned) {
      setError('Please provide a DNA sequence before predicting.');
      return;
    }

    setLoading(true);
    try {
      const response = await predictSequence(cleaned);
      setResult(response.result);
    } catch (error) {
      const message = error?.response?.data?.detail?.message || 'Prediction failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadPredictionReport(normalizeSequence(sequence));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'GenomeAI_Prediction_Report.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not generate the PDF report.');
    }
  };

  return (
    <div className={styles.page}>
      <ParticleBackground />
      <Navbar />

      <main className={styles.main}>
        <motion.section
          className={styles.header}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div>
            <span className={styles.kicker}>Premium AI Healthcare Dashboard</span>
            <h1>Predict diseases from DNA with deep learning precision.</h1>
            <p>
              Enter a 201-base sequence or upload FASTA/TXT. GenomeAI returns a disease prediction,
              confidence score, top 3 probabilities, and a PDF report.
            </p>
          </div>
          <div className={styles.headerVisual}>
            <AnimatedDNA />
          </div>
        </motion.section>

        <section className={styles.grid}>
          <motion.div className={styles.panel} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.panelKicker}>Sequence Input</span>
                <h2>DNA sequence</h2>
              </div>
              <span className={styles.chip}>{sequenceLength} / 201</span>
            </div>

            <label className={styles.field}>
              <span>Paste DNA sequence</span>
              <textarea
                value={sequence}
                onChange={(event) => setSequence(event.target.value)}
                placeholder="Enter 201 bases using A, T, G, C, N"
                rows={11}
              />
            </label>

            <div className={styles.controls}>
              <label className={styles.uploadButton}>
                <Upload size={16} />
                Upload FASTA / TXT
                <input type="file" accept=".txt,.fasta,.fa,.fna,.seq,text/plain" onChange={onFileChange} />
              </label>

              <GradientButton onClick={handlePredict}>
                {loading ? <LoaderCircle size={16} className={styles.spin} /> : <Sparkles size={16} />}
                {loading ? 'Predicting...' : 'Start Prediction'}
              </GradientButton>

              <button className={styles.ghostButton} onClick={handleDownload} type="button" disabled={!result.predicted_disease || result.predicted_disease === '-'}>
                <FileText size={16} />
                Download PDF Report
              </button>
            </div>

            <div className={styles.statusRow}>
              <ShieldCheck size={16} />
              <span>Your DNA remains private and secure.</span>
            </div>

            {error ? <div className={styles.errorBox}>{error}</div> : null}
          </motion.div>

          <motion.div className={styles.panel} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.panelKicker}>Prediction Result</span>
                <h2>Clinical summary</h2>
              </div>
              <span className={styles.liveStatus}><i /> {apiStatus}</span>
            </div>

            <div className={styles.resultHero}>
              <div>
                <span className={styles.resultLabel}>Predicted disease</span>
                <h3>{result.predicted_disease}</h3>
              </div>
              <div className={styles.confidenceBubble}>
                <strong>{result.confidence}%</strong>
                <span>{result.confidence_level}</span>
              </div>
            </div>

            <div className={styles.metrics}>
              <div>
                <span>Model</span>
                <strong>{result.model}</strong>
              </div>
              <div>
                <span>Sequence length</span>
                <strong>{result.sequence_length}</strong>
              </div>
              <div>
                <span>Label</span>
                <strong>{result.label}</strong>
              </div>
            </div>

            <div className={styles.topPredictions}>
              <span className={styles.panelKicker}>Top 3 predictions</span>
              {result.all_predictions?.map((item) => (
                <div key={item.disease} className={styles.predictionRow}>
                  <span>{item.disease}</span>
                  <strong>{item.probability}%</strong>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}