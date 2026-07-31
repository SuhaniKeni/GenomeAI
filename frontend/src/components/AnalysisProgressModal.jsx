import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Cpu, Activity, BarChart2, CheckCircle2, Loader2 } from 'lucide-react';

export default function AnalysisProgressModal({ isOpen, modelName = '1D-CNN v2.0', onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Sequence Tokenization', desc: 'Slicing FASTA sequence into k-mer token embeddings', icon: Dna, color: 'text-cyan-400' },
    { title: 'Deep Neural Processing', desc: `Running tensor ops on ${modelName} neural engine`, icon: Cpu, color: 'text-emerald-400' },
    { title: 'SHAP Feature Attribution', desc: 'Computing perturbation-based local feature attributions', icon: Activity, color: 'text-indigo-400' },
    { title: 'Clinical Report Synthesis', desc: 'Packaging disease prediction & ReportLab PDF assets', icon: BarChart2, color: 'text-amber-400' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const timer1 = setTimeout(() => setCurrentStep(1), 600);
    const timer2 = setTimeout(() => setCurrentStep(2), 1400);
    const timer3 = setTimeout(() => setCurrentStep(3), 2200);
    const timer4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative max-w-md w-full glass-panel rounded-3xl p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center overflow-hidden"
        >
          {/* Top Animated Pulse Glow */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

          {/* Central Spinner Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <Dna className="w-8 h-8 text-cyan-400 absolute animate-pulse" />
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight mb-1">
            GenomeAI Inference Engine
          </h3>
          <p className="text-xs text-slate-400 mb-6">Executing multi-layer deep learning inference</p>

          {/* Progress Steps */}
          <div className="space-y-4 text-left">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isDone = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-90'
                      : isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/30 border-slate-800/60 opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    ) : (
                      <Icon className={`w-5 h-5 ${step.color}`} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
