import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function GradientButton({
  children,
  variant = 'emerald', // emerald, cyan, indigo, rose, outline, glass
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon,
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    emerald: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/40',
    cyan: 'bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500 text-slate-950 font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:from-teal-400 hover:to-emerald-400 border border-teal-400/40',
    indigo: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 border border-emerald-500/30',
    rose: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:from-rose-400 hover:to-pink-500 border border-rose-400/30',
    glass: 'bg-[#09181b]/80 backdrop-blur-md text-emerald-100 border border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-500/40 hover:text-white',
    outline: 'bg-transparent text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base font-bold rounded-2xl gap-2.5',
  };

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center font-medium transition-all duration-200 ${
        variants[variant] || variants.cyan
      } ${sizes[size] || sizes.md} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
