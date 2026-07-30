import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Dna, ShieldCheck, Clock } from 'lucide-react';
import styles from './AnalysisProgressModal.module.css';

const ANALYSIS_PIPELINE_STEPS = [
  { id: 1, label: 'Uploading', desc: 'Transferring sequence payload to Fast-API backend engine' },
  { id: 2, label: 'Validating', desc: 'Verifying nucleotide alphabet [A, T, G, C, N] and 201 bp target window' },
  { id: 3, label: 'Preprocessing', desc: 'Normalizing base tokens and converting to integer tensors' },
  { id: 4, label: 'Running CNN Model', desc: 'Executing 1D Convolutional Neural Network motif feature extraction' },
  { id: 5, label: 'Generating Results', desc: 'Computing disease association softmax probability vectors' },
  { id: 6, label: 'Generating Report', desc: 'Synthesizing clinical decision-support PDF summary report' },
  { id: 7, label: 'Completed', desc: 'Finalizing LIS database record and rendering summary view' },
];

export default function AnalysisProgressModal({ isOpen, currentStep, error }) {
  const [estTime, setEstTime] = useState(1.5);

  useEffect(() => {
    if (isOpen) {
      setEstTime(Math.max(0.2, (1.8 - currentStep * 0.22).toFixed(1)));
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const currentStepObj = ANALYSIS_PIPELINE_STEPS.find((s) => s.id === currentStep) || ANALYSIS_PIPELINE_STEPS[0];
  const progressPercent = Math.round((currentStep / ANALYSIS_PIPELINE_STEPS.length) * 100);

  return (
    <AnimatePresence>
      <div className={styles.backdrop}>
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.iconWrap}>
                <Dna className={styles.dnaIcon} size={22} />
              </div>
              <div>
                <h3>GenomeAI CNN Analysis Pipeline</h3>
                <span className={styles.sub}>Enterprise Genomic LIS Engine Execution</span>
              </div>
            </div>
            <div className={styles.badge}>{progressPercent}%</div>
          </div>

          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Active Step Highlight Card */}
          <div className={styles.activeStepCard}>
            {error ? (
              <div className={styles.errorContent}>
                <h4>Analysis Encountered an Issue</h4>
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className={styles.stepHeader}>
                  <Loader2 className={styles.spinner} size={18} />
                  <h4>Step {currentStep}: {currentStepObj.label}</h4>
                </div>
                <p className={styles.stepDesc}>{currentStepObj.desc}</p>
              </>
            )}
          </div>

          {/* Step Timeline */}
          <div className={styles.stepsList}>
            {ANALYSIS_PIPELINE_STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`${styles.stepRow} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}
                >
                  <div className={styles.stepIcon}>
                    {isDone ? (
                      <CheckCircle2 size={15} className={styles.checkIcon} />
                    ) : isCurrent ? (
                      <Loader2 size={15} className={styles.spinnerSmall} />
                    ) : (
                      <span className={styles.numDot}>{step.id}</span>
                    )}
                  </div>
                  <span className={styles.stepName}>{step.label}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.footerRow}>
            <div className={styles.timeEst}>
              <Clock size={13} />
              <span>Est. time remaining: <strong>~{estTime}s</strong></span>
            </div>
            <div className={styles.engineTag}>
              <ShieldCheck size={13} />
              <span>CNN Model v2.0</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
