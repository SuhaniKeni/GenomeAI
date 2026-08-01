import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function AppLayout({ title, subtitle, action, children, showSidebar = true }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Radial Gradient Mesh Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(3,7,18,0))] pointer-events-none z-0" />
      <div className="fixed top-1/4 left-1/6 w-[36rem] h-[36rem] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-float-slow z-0" />
      <div className="fixed bottom-1/4 right-1/6 w-[36rem] h-[36rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-float-reverse z-0" />

      {/* Top Navbar Header - h-16 (64px) */}
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Structural Body (Sidebar + Content Column) */}
      <div className="flex-1 flex w-full relative z-10">
        {/* Desktop / Tablet Sidebar */}
        {showSidebar && (
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Content Container (Takes remaining flex width cleanly without margins or hardcoded offsets) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Title & Action Bar */}
              {(title || subtitle || action) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    {title && (
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                        <span className="gradient-text-emerald">{title}</span>
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium leading-relaxed">{subtitle}</p>
                    )}
                  </div>
                  {action && <div>{action}</div>}
                </div>
              )}

              {/* View Animation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </div>
          </main>

          {/* Footer Component */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
