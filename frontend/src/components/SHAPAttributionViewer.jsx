import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import GlassCard from './GlassCard';
import { Sparkles, Activity } from 'lucide-react';

export default function SHAPAttributionViewer({ shapData = {} }) {
  // Extract features / attributions
  const items = Object.entries(shapData).map(([motif, val]) => ({
    motif,
    attribution: Math.round(Number(val) * 1000) / 1000,
  }));

  items.sort((a, b) => Math.abs(b.attribution) - Math.abs(a.attribution));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-3 rounded-xl shadow-2xl text-xs">
          <p className="font-bold text-white mb-1">k-Mer Motif: {item.motif}</p>
          <p className={item.attribution >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            SHAP Value: {item.attribution > 0 ? `+${item.attribution}` : item.attribution}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> SHAP Feature Attribution Explainability
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Local SHAP (SHapley Additive exPlanations) sequence motif contributions to disease risk
          </p>
        </div>
      </div>

      <div className="h-64 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
            <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis dataKey="motif" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="attribution" radius={[0, 4, 4, 0]}>
              {items.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.attribution >= 0 ? '#10b981' : '#f43f5e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.slice(0, 6).map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border backdrop-blur-md flex items-center justify-between text-xs ${
              item.attribution >= 0
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-rose-950/30 border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${item.attribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="font-mono font-bold text-white">{item.motif}</span>
            </div>
            <span className={`font-semibold ${item.attribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.attribution > 0 ? `+${item.attribution}` : item.attribution}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
