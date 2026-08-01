import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  color = 'emerald', // 'emerald' | 'cyan' | 'purple' | 'amber' | 'blue'
  className = '',
}) {
  const colorStyles = {
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      glow: 'from-emerald-500/10 to-transparent',
      accent: 'text-emerald-400',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
      glow: 'from-cyan-500/10 to-transparent',
      accent: 'text-cyan-400',
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
      glow: 'from-purple-500/10 to-transparent',
      accent: 'text-purple-400',
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      glow: 'from-blue-500/10 to-transparent',
      accent: 'text-blue-400',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      glow: 'from-amber-500/10 to-transparent',
      accent: 'text-amber-400',
    },
  };

  const scheme = colorStyles[color] || colorStyles.emerald;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-5 shadow-xl overflow-hidden group ${className}`}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${scheme.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">{value}</h3>

        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
              trendType === 'up'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : trendType === 'down'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {trendType === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : trendType === 'down' ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </motion.div>
  );
}
