import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { loginUser } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter your laboratory credentials.');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      showSuccess('Authenticated successfully!');
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Authentication failed. Please check credentials.';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 p-0.5 mx-auto mb-3 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Dna className="w-7 h-7 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">GenomeAI LIS Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Clinical Genomic Decision Support System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                Laboratory Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@laboratory.com"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Contact your LIS Administrator to reset your password.');
                  }}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <GradientButton
              variant="cyan"
              size="lg"
              type="submit"
              loading={loading}
              icon={ArrowRight}
              className="w-full justify-center mt-2"
            >
              Sign In to Laboratory LIS
            </GradientButton>
          </form>

          {/* Registration Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Need to register a laboratory?{' '}
            <Link to="/register-lab" className="text-cyan-400 font-bold hover:underline">
              Create Laboratory Profile
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
