import React from 'react';

export default function Badge({
  children,
  variant = 'neutral', // 'success' | 'warning' | 'error' | 'info' | 'purple' | 'cyan' | 'neutral'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
}) {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    error: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-bold gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
