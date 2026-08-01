import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna, Activity, Sun, Moon, Search, Bell, Shield, Menu, X, ArrowRight, Sparkles, User
} from 'lucide-react';
import { fetchHealth } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const [apiOnline, setApiOnline] = useState(false);
  const [apiChecking, setApiChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'New Analysis', to: '/analysis' },
    { label: 'History', to: '/history' },
    { label: 'Reports', to: '/reports' },
    { label: 'Evidence', to: '/evidence' },
    { label: 'Users', to: '/users' },
    { label: 'API Docs', to: '/api-docs' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#040d12]/80 border-b border-emerald-900/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#040d12] rounded-[10px] flex items-center justify-center">
              <Dna className="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight gradient-text-emerald flex items-center gap-1">
              GenomeAI <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">v2.0</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-300/70 uppercase tracking-widest -mt-1">Clinical LIS Platform</span>
          </div>
        </Link>



        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Health Status Dot */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#09181b]/90 border border-emerald-900/40 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiChecking ? 'bg-amber-400 animate-ping' : apiOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-400'}`} />
            <span className="text-[11px] font-medium text-emerald-200/80">
              {apiChecking ? 'Checking...' : apiOnline ? 'Engine Online' : 'Offline'}
            </span>
          </div>


          {/* CTA Action */}
          <Link
            to="/analysis"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-500 transition-all"
          >
            <Dna className="w-4 h-4" />
            <span>New Analysis</span>
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#09181b] border border-emerald-900/40 text-emerald-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#040d12]/95 backdrop-blur-2xl border-b border-emerald-900/40 px-4 pt-2 pb-6 space-y-2"
          >
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(item.to)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-emerald-200/70 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/analysis"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg"
            >
              <Dna className="w-4 h-4" />
              <span>Launch DNA Analysis</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
