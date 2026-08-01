import React from 'react';
import { Dna, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#030712]/90 backdrop-blur-xl py-6 px-4 sm:px-8 relative z-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">GenomeAI Clinical Platform</span>
          <span className="text-slate-400">| Enterprise Edition v2.0</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> HIPAA Compliant Architecture
          </span>
          <a
            href="https://github.com/SuhaniKeni/GenomeAI"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1 font-medium"
          >
            GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
