import React from 'react';
import { motion } from 'framer-motion';

export default function ConfidenceGauge({
  score = 0.95, // 0.0 to 1.0
  level = 'High Confidence',
  size = 180,
  strokeWidth = 14,
  label = 'AI Confidence',
}) {
  const percentage = Math.round(score * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct) => {
    if (pct >= 85) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' };
    if (pct >= 65) return { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)', text: 'text-cyan-400' };
    if (pct >= 45) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400' };
    return { stroke: '#f43f5e', glow: 'rgba(244, 63, 94, 0.3)', text: 'text-rose-400' };
  };

  const { stroke, glow, text } = getColor(percentage);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
          style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`text-4xl font-extrabold tracking-tight ${text}`}
        >
          {percentage}%
        </motion.span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
          {label}
        </span>
      </div>

      {level && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${
            percentage >= 85
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : percentage >= 65
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {level}
        </motion.span>
      )}
    </div>
  );
}
