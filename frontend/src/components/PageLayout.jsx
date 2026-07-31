import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function PageLayout({ title, subtitle, action, children, showSidebar = true }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--bg-primary)] flex flex-col relative overflow-x-hidden">
      {/* Ambient Cyber Background Blobs */}
      <div className="fixed top-1/4 left-1/6 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="fixed bottom-1/4 right-1/6 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      {/* Top Navbar */}
      <Navbar />

      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        {showSidebar && <Sidebar />}

        {/* Main Content Area */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
            showSidebar ? 'lg:pl-[var(--sidebar-width,240px)]' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            {(title || subtitle || action) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>
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
