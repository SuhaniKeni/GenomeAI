import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy, Check, Filter } from 'lucide-react';
import GlassCard from './GlassCard';

export default function NucleotideViewer({
  sequence = '',
  mutations = [], // [{ position: 25, ref: 'A', alt: 'T', gene: 'BRCA1' }]
  chunkSize = 10,
}) {
  const [copied, setCopied] = useState(false);
  const [filterMutationOnly, setFilterMutationOnly] = useState(false);
  const [searchPos, setSearchPos] = useState('');

  const cleanSeq = String(sequence).replace(/\s+/g, '').toUpperCase();
  const bases = cleanSeq.split('');

  const baseColors = {
    A: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
    T: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
    G: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
    C: 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30',
  };

  const copySequence = () => {
    navigator.clipboard.writeText(cleanSeq);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mutationPositions = new Set(mutations.map((m) => m.position || m.pos));

  return (
    <GlassCard className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🧬</span> Interactive DNA Sequence Viewer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Sequence Length: <span className="text-cyan-400 font-semibold">{bases.length} bp</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Base Color Legend */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <span className="flex items-center gap-1 font-mono font-bold text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> A
            </span>
            <span className="flex items-center gap-1 font-mono font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> T
            </span>
            <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> G
            </span>
            <span className="flex items-center gap-1 font-mono font-bold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> C
            </span>
          </div>

          <button
            onClick={copySequence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-slate-700/60 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            {copied ? 'Copied!' : 'Copy Sequence'}
          </button>
        </div>
      </div>

      {/* Sequence Box */}
      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex flex-wrap gap-2 font-mono text-sm">
          {bases.map((base, idx) => {
            const isMutation = mutationPositions.has(idx + 1);
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.15 }}
                className={`relative px-2 py-1 rounded-md border font-bold text-center transition-all ${
                  isMutation
                    ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                    : baseColors[base] || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={`Position ${idx + 1}: ${base}`}
              >
                <span>{base}</span>
                <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-[9px] text-slate-400 opacity-60">
                  {(idx + 1) % 10 === 0 ? idx + 1 : ''}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
