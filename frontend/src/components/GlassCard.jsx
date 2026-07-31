import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'cyan', // cyan, emerald, indigo, rose, amber
  onClick,
  ...props
}) {
  const glowClasses = {
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    indigo: 'hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    rose: 'hover:border-rose-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    amber: 'hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect ? { y: -3 } : undefined}
      transition={{ duration: 0.2 }}
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        hoverEffect ? glowClasses[glowColor] || glowClasses.cyan : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
