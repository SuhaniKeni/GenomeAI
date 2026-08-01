import React from 'react';
import { Dna, Shield, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full border-t border-emerald-900/40 bg-[#040d12]/90 backdrop-blur-xl py-6 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
        
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Dna className="w-4 h-4" />
          </div>
          <span className="font-bold text-emerald-100">GenomeAI Clinical LIS</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#09181b] border border-emerald-900/40 text-emerald-400">ISO-15189 Ready</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/analysis" className="hover:text-emerald-300 transition-colors">Analysis</Link>
          <Link to="/reports" className="hover:text-emerald-300 transition-colors">Reports</Link>
          <Link to="/about" className="hover:text-emerald-300 transition-colors">Documentation</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
        </div>

        <div>
          &copy; {new Date().getFullYear()} GenomeAI Enterprise LIS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
