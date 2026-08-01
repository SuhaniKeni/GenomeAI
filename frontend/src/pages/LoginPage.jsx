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
    <div className="min-h-screen bg-[#040d12] text-white flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Radial Grid & Bioluminescent Blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(4,13,18,0))] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[128px] pointer-events-none animate-float-reverse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.22)] bg-[#09181b]/90">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 p-0.5 mx-auto mb-3 shadow-lg shadow-emerald-500/30">
              <div className="w-full h-full bg-[#040d12] rounded-[14px] flex items-center justify-center">
                <Dna className="w-7 h-7 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">GenomeAI LIS Portal</h2>
            <p className="text-xs text-emerald-200/70 mt-1">Clinical Genomic Decision Support System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-emerald-300/80 font-bold mb-1 uppercase tracking-wider text-[10px]">
                Laboratory Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@laboratory.com"
                  className="w-full bg-[#040d12]/90 border border-emerald-900/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-emerald-300/40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-emerald-300/80 font-bold uppercase tracking-wider text-[10px]">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Contact your LIS Administrator to reset your password.');
                  }}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#040d12]/90 border border-emerald-900/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-emerald-300/40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <GradientButton
              variant="emerald"
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
          <div className="mt-6 pt-4 border-t border-emerald-900/40 text-center text-xs text-emerald-200/70">
            Need to register a laboratory?{' '}
            <Link to="/register-lab" className="text-emerald-400 font-bold hover:underline">
              Create Laboratory Profile
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
