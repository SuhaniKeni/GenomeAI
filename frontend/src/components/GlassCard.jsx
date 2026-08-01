import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'emerald', // emerald, cyan, indigo, rose, amber
  onClick,
  ...props
}) {
  const glowClasses = {
    emerald: 'hover:border-emerald-500/50 hover:shadow-[0_0_35px_rgba(16,185,129,0.22)]',
    cyan: 'hover:border-teal-500/50 hover:shadow-[0_0_35px_rgba(20,184,166,0.22)]',
    indigo: 'hover:border-emerald-400/50 hover:shadow-[0_0_35px_rgba(52,211,153,0.22)]',
    rose: 'hover:border-rose-500/50 hover:shadow-[0_0_35px_rgba(244,63,94,0.22)]',
    amber: 'hover:border-amber-500/50 hover:shadow-[0_0_35px_rgba(245,158,11,0.22)]',
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
