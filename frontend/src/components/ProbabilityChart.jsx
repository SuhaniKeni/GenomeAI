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

export default function ProbabilityChart({ predictions = {} }) {
  // Format predictions into chart array
  const data = Object.entries(predictions).map(([disease, prob]) => ({
    disease,
    probability: Math.round(prob * 1000) / 10, // percentage e.g. 88.5
  }));

  // Sort descending
  data.sort((a, b) => b.probability - a.probability);

  const colors = ['#06b6d4', '#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#ec4899'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-3 rounded-xl shadow-2xl text-xs">
          <p className="font-bold text-white mb-1">{item.disease}</p>
          <p className="text-cyan-400 font-semibold">
            Probability Score: <span className="text-white">{item.probability}%</span>
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
            <span>📊</span> Disease Risk Probability Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Categorical probability scores output by neural classification layer</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="disease"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
