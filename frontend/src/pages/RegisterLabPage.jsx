import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Building2, Mail, Lock, User, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { registerLaboratory } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function RegisterLabPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [labName, setLabName] = useState('');
  const [labCode, setLabCode] = useState('');
  const [userEditedCode, setUserEditedCode] = useState(false);
  const [institution, setInstitution] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCodeFromName = (name) => {
    if (!name.trim()) return '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    let prefix = '';
    if (words.length >= 2) {
      prefix = words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
    } else {
      prefix = words[0].slice(0, 4).toUpperCase();
    }
    return `${prefix}-2026`;
  };

  const handleLabNameChange = (e) => {
    const val = e.target.value;
    setLabName(val);
    if (!userEditedCode) {
      setLabCode(generateCodeFromName(val));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const finalCode = labCode.trim() || generateCodeFromName(labName) || 'LAB-2026';

    if (!labName || !adminEmail || !adminName || !adminPassword) {
      showError('Please fill in all required registration fields.');
      return;
    }

    setLoading(true);
    try {
      await registerLaboratory({
        lab_name: labName,
        lab_code: finalCode,
        institution,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      showSuccess('Laboratory registered successfully!');
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Registration failed. Please check details.';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-3xl"
      >
        <GlassCard className="p-8 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mx-auto mb-3">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Dna className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Register New Laboratory</h2>
            <p className="text-xs text-slate-400 mt-1">
              Create your organization profile to access GenomeAI LIS Platform
            </p>
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Section 1: Lab Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-cyan-400 pb-1 border-b border-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Laboratory Info
              </h4>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Laboratory Name *
                </label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={handleLabNameChange}
                  placeholder="Central Genomics Laboratory"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Laboratory Code (Auto-generated)
                </label>
                <input
                  type="text"
                  required
                  value={labCode}
                  onChange={(e) => {
                    setLabCode(e.target.value);
                    setUserEditedCode(true);
                  }}
                  placeholder="CGL-2026"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Parent Institution
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Genome Research Institute"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Section 2: Admin Profile */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-cyan-400 pb-1 border-b border-slate-800 flex items-center gap-2">
                <User className="w-4 h-4" /> Administrator Account
              </h4>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Administrator Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Dr. Sarah Jenkins"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Administrator Email *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@cglab.org"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2 pt-4">
              <GradientButton
                variant="cyan"
                size="lg"
                type="submit"
                loading={loading}
                icon={ArrowRight}
                className="w-full justify-center"
              >
                Create Laboratory Profile & Admin Account
              </GradientButton>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have a laboratory account?{' '}
            <Link to="/login" className="text-cyan-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
