import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles, Dna, ShieldCheck, Activity } from 'lucide-react';
import styles from './AnalysisProgressModal.module.css';

const LAB_PIPELINE_STEPS = [
  { id: 1, label: 'Validating DNA Sequence', desc: 'Verifying nucleotide alphabet [A, T, G, C, N] and 201-base window' },
  { id: 2, label: 'Checking Sequence Quality', desc: 'Calculating GC content % and nucleotide distribution' },
  { id: 3, label: 'Encoding DNA Tokens', desc: 'Converting nucleotides to integer tensors (A=0, T=1, G=2, C=3, N=4)' },
  { id: 4, label: 'Running GenomeAI CNN Engine', desc: 'Processing 1D Convolutional layers & multi-scale motif filters' },
  { id: 5, label: 'Calculating Disease Probabilities', desc: 'Evaluating multi-class softmax probability distribution across 8 diseases' },
  { id: 6, label: 'Generating Laboratory PDF Report', desc: 'Synthesizing ReportLab clinical PDF summary with disclaimers' },
  { id: 7, label: 'Saving Analysis Record', desc: 'Persisting sample metadata and prediction to SQLite LIS database' },
  { id: 8, label: 'Analysis Complete', desc: 'Rendering clinical summary & decision-support insights' },
];

export default function AnalysisProgressModal({ isOpen, currentStep, error }) {
  if (!isOpen) return null;

  const currentStepObj = LAB_PIPELINE_STEPS.find((s) => s.id === currentStep) || LAB_PIPELINE_STEPS[0];
  const progressPercent = Math.round((currentStep / LAB_PIPELINE_STEPS.length) * 100);

  return (
    <AnimatePresence>
      <div className={styles.backdrop}>
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25 }}
        >
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.iconWrap}>
                <Dna className={styles.dnaIcon} size={24} />
              </div>
              <div>
                <h3>GenomeAI Laboratory Pipeline</h3>
                <span className={styles.sub}>AI-Supported DNA Analysis Execution</span>
              </div>
            </div>
            <div className={styles.badge}>{progressPercent}%</div>
          </div>

          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
          </div>

          <div className={styles.activeStepCard}>
            {error ? (
              <div className={styles.errorContent}>
                <h4>Analysis Encountered an Error</h4>
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className={styles.stepHeader}>
                  <Loader2 className={styles.spinner} size={20} />
                  <h4>{currentStepObj.label}</h4>
                </div>
                <p className={styles.stepDesc}>{currentStepObj.desc}</p>
              </>
            )}
          </div>

          <div className={styles.stepsList}>
            {LAB_PIPELINE_STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`${styles.stepRow} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}
                >
                  <div className={styles.stepIcon}>
                    {isDone ? (
                      <CheckCircle2 size={16} className={styles.checkIcon} />
                    ) : isCurrent ? (
                      <Loader2 size={16} className={styles.spinnerSmall} />
                    ) : (
                      <span className={styles.numDot}>{step.id}</span>
                    )}
                  </div>
                  <span className={styles.stepName}>{step.label}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.footerNote}>
            <ShieldCheck size={14} />
            <span>GenomeAI Engine v2.0 • Validated CNN Laboratory Pipeline</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
