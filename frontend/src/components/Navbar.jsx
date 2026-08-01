import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dna, Search, Command, Menu, X
} from 'lucide-react';
import { fetchHealth } from '../api/client';

export default function Navbar({ mobileMenuOpen = false, onToggleMobileMenu }) {
  const [apiOnline, setApiOnline] = useState(false);
  const [apiChecking, setApiChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await fetchHealth();
        if (mounted) setApiOnline(true);
      } catch {
        if (mounted) setApiOnline(false);
      } finally {
        if (mounted) setApiChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full h-16 backdrop-blur-2xl bg-[#030712]/90 border-b border-slate-800/80 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        
        {/* Left Brand + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center">
                <Dna className="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform duration-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight gradient-text-emerald flex items-center gap-1.5">
                GenomeAI <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">v2.0</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-1">Clinical LIS Engine</span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar Hint */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500" />
          <span className="grow truncate">Search genomic variants, samples, genes...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Health Status Dot */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiChecking ? 'bg-amber-400 animate-ping' : apiOnline ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-rose-400'}`} />
            <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">
              {apiChecking ? 'Checking...' : apiOnline ? 'Engine Online' : 'Offline'}
            </span>
          </div>

          {/* CTA Action */}
          <Link
            to="/analysis"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200"
          >
            <Dna className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">New Analysis</span>
          </Link>

          {/* User Profile Quick Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xs">
                SJ
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
