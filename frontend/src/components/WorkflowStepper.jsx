import React from 'react';
import { Check, Dna, FileText, ShieldCheck, Play, Activity, Download } from 'lucide-react';
import styles from './WorkflowStepper.module.css';

const WORKFLOW_STEPS = [
  { id: 1, title: 'Upload / Paste', desc: 'Input sequence', icon: Dna },
  { id: 2, title: 'Review Info', desc: 'Sample metadata', icon: FileText },
  { id: 3, title: 'Validate', desc: '201 bp check', icon: ShieldCheck },
  { id: 4, title: 'Analyze DNA', desc: '1D-CNN Model', icon: Play },
  { id: 5, title: 'Review Results', desc: 'Predictions & risk', icon: Activity },
  { id: 6, title: 'Download Report', desc: 'PDF & evidence', icon: Download },
];

export default function WorkflowStepper({ currentStep, onStepClick }) {
  return (
    <nav className={styles.stepperContainer} aria-label="Analysis Pipeline Workflow">
      <div className={styles.stepperHeader}>
        <span className={styles.stepperKicker}>Genomic LIS Analysis Pipeline Workflow</span>
        <span className={styles.stepperBadge}>Step {currentStep} of 6</span>
      </div>

      <ol className={styles.stepsList}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className={`${styles.stepItem} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}
            >
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onStepClick && onStepClick(step.id)}
                disabled={!isCompleted && !isActive}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={styles.iconCircle}>
                  {isCompleted ? <Check size={14} className={styles.checkIcon} /> : <Icon size={14} />}
                </div>

                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>
                    {step.id}. {step.title}
                  </span>
                  <span className={styles.stepDesc}>{step.desc}</span>
                </div>
              </button>

              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`${styles.stepConnector} ${isCompleted ? styles.connectorActive : ''}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
