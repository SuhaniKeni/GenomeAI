import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'gradient' | 'outline' | 'danger' | 'ghost' | 'cyan'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  isDisabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer select-none overflow-hidden';

  const variantStyles = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-950/50 border border-emerald-500/30',
    gradient:
      'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 border border-emerald-400/40',
    cyan:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25 border border-cyan-400/30',
    secondary:
      'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 focus:ring-slate-500 border border-slate-700/80 backdrop-blur-md',
    outline:
      'bg-transparent hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 focus:ring-emerald-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-lg shadow-rose-950/50 border border-rose-500/30',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 focus:ring-slate-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-xs font-bold gap-2',
    lg: 'px-6 py-3.5 text-sm font-bold gap-2.5',
  };

  return (
    <motion.button
      whileHover={!isDisabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled && !isLoading ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      <span className="truncate">{children}</span>

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </motion.button>
  );
}
