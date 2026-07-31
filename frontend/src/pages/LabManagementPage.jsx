import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Database, CheckCircle2, Save, Sun, Moon } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { fetchLabDetails } from '../api/client';

export default function LabManagementPage() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { showSuccess } = useToast();
  const [lab, setLab] = useState({
    name: 'Central Genomics Institute',
    lab_code: 'LAB-CENTRAL-01',
    institution: 'National Bioinformatics Center',
    created_at: '2026-01-01',
  });

  useEffect(() => {
    fetchLabDetails()
      .then((data) => {
        if (data && data.laboratory) setLab(data.laboratory);
      })
      .catch(() => {});
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    showSuccess('Laboratory profile updated successfully.');
  };

  return (
    <PageLayout
      title="Laboratory Management & Settings"
      subtitle="Manage laboratory profile, institution affiliation, theme preferences, and engine parameters"
    >
      <div className="max-w-3xl space-y-6">

        {/* Laboratory Profile Card */}
        <GlassCard>
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" /> Laboratory Identity Profile
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Laboratory Name</label>
              <input
                type="text"
                value={lab.name}
                onChange={(e) => setLab({ ...lab, name: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 font-bold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Laboratory Code</label>
                <input
                  type="text"
                  value={lab.lab_code}
                  disabled
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2.5 font-mono text-cyan-400 cursor-not-allowed opacity-80"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">University / Institution</label>
                <input
                  type="text"
                  value={lab.institution || ''}
                  onChange={(e) => setLab({ ...lab, institution: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Database Registration Timestamp</label>
              <input
                type="text"
                value={lab.created_at || 'Registered'}
                disabled
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2.5 font-mono text-slate-400 cursor-not-allowed opacity-80"
              />
            </div>

            <div className="pt-2">
              <GradientButton variant="cyan" size="md" type="submit" icon={Save}>
                Save Laboratory Profile
              </GradientButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </PageLayout>
  );
}
