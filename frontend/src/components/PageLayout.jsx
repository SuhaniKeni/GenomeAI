import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function PageLayout({ title, subtitle, action, children, showSidebar = true }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Laboratory Radial Grid & Cyber Glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(4,13,18,0))] pointer-events-none z-0" />
      <div className="fixed top-1/4 left-1/6 w-[32rem] h-[32rem] bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none animate-float-slow z-0" />
      <div className="fixed bottom-1/4 right-1/6 w-[32rem] h-[32rem] bg-teal-500/10 rounded-full blur-[128px] pointer-events-none animate-float-reverse z-0" />

      {/* Top Navbar */}
      <Navbar />

      <div className="flex-1 flex w-full relative z-10">
        {/* Sidebar */}
        {showSidebar && <Sidebar />}

        {/* Main Content Area */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
            showSidebar ? 'pl-[var(--sidebar-width,240px)]' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            {(title || subtitle || action) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                      <span className="gradient-text-emerald">{title}</span>
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 font-medium leading-relaxed">{subtitle}</p>
                  )}
                </div>
                {action && <div>{action}</div>}
              </div>
            )}

            {/* Page Content View */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
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
