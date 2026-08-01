import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function PageLayout({ title, subtitle, action, children, showSidebar = true }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary,#030712)] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Radial Mesh & Glowing Blobs */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(3,7,18,0))] pointer-events-none z-0" />
      <div className="fixed top-1/4 left-1/6 w-[36rem] h-[36rem] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-float-slow z-0" />
      <div className="fixed bottom-1/4 right-1/6 w-[36rem] h-[36rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-float-reverse z-0" />
      <div className="fixed top-2/3 left-1/3 w-[28rem] h-[28rem] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Header Navbar */}
      <Navbar />

      <div className="flex-1 flex w-full relative z-10">
        {/* Left Sidebar */}
        {showSidebar && <Sidebar />}

        {/* Main View Area */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
            showSidebar ? 'pl-[var(--sidebar-width,240px)]' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Title & Header Bar */}
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

            {/* View View Animation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
