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
  color = 'emerald', // emerald, cyan, indigo, amber, rose
}) {
  const iconGradients = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    cyan: 'bg-teal-500/15 text-teal-300 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
    indigo: 'bg-emerald-400/15 text-mint-300 border-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  };

  return (
    <GlassCard glowColor={color} className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/70 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-300 group-hover:scale-110 ${iconGradients[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtitle && <span className="text-emerald-200/60 font-medium">{subtitle}</span>}
        {trend && (
          <span
            className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${
              trendType === 'positive'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {trendType === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>

      {/* Decorative ambient background blur */}
      <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl opacity-25 pointer-events-none ${
        color === 'emerald' ? 'bg-emerald-500' : color === 'indigo' ? 'bg-teal-500' : 'bg-emerald-400'
      }`} />
    </GlassCard>
  );
}
