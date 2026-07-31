import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Shield, Trash2, Mail, CheckCircle2, AlertCircle, RefreshCw, X, User
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useToast } from '../context/ToastContext';
import { fetchLabUsers, createLabUser, deleteLabUser } from '../api/client';

export default function LabUsersPage() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Laboratory Technician');
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchLabUsers();
      setUsers(data.users || []);
    } catch {
      showError('Could not load laboratory users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      showError('Please complete all user fields.');
      return;
    }

    setCreating(true);
    try {
      await createLabUser({
        full_name: fullName,
        email,
        password,
        role,
      });
      showSuccess(`Created user account for ${fullName}`);
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Failed to create user account.';
      showError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Remove this user from the laboratory?')) return;
    try {
      await deleteLabUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showSuccess('User account deleted.');
    } catch {
      showError('Failed to delete user account.');
    }
  };

  return (
    <PageLayout
      title="Laboratory Users & Access Control"
      subtitle="Manage personnel accounts, grant Role-Based Access Control (RBAC) permissions, and audit laboratory operators"
      action={
        <GradientButton variant="cyan" size="sm" onClick={() => setModalOpen(true)} icon={UserPlus}>
          Add Laboratory User
        </GradientButton>
      }
    >
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                    Loading laboratory user directory...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.full_name}</p>
                          <p className="text-[10px] text-slate-400">ID: USR-{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        u.role === 'Administrator'
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          : u.role === 'Laboratory Manager'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 hover:text-rose-300 transition-colors"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No users registered in this laboratory account yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Create User Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative max-w-md w-full glass-panel rounded-3xl p-6 border border-cyan-500/30 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" /> Register Laboratory Operator
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Alex Vance"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@genomeai.lab"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password123!"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Laboratory Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Laboratory Technician">Laboratory Technician</option>
                    <option value="Laboratory Manager">Laboratory Manager</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Researcher">Researcher</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <GradientButton variant="glass" size="sm" type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GradientButton>
                  <GradientButton variant="cyan" size="sm" type="submit" loading={creating}>
                    Create Account
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
