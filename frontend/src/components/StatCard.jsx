import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from './GlassCard';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // +12.5% or -2.4%
  trendType = 'positive', // positive, negative, neutral
  color = 'cyan', // cyan, emerald, indigo, amber, rose
}) {
  const iconGradients = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <GlassCard glowColor={color} className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-300 group-hover:scale-110 ${iconGradients[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
        {trend && (
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
              trendType === 'positive'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trendType === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>

      {/* Decorative ambient background blur */}
      <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${
        color === 'emerald' ? 'bg-emerald-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-cyan-500'
      }`} />
    </GlassCard>
  );
}
