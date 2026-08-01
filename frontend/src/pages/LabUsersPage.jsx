import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Shield, Trash2, Mail, CheckCircle2, AlertCircle, RefreshCw, X, User
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
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
      showError('Failed to create user account.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Remove user ${name} from laboratory roster?`)) return;
    try {
      await deleteLabUser(userId);
      showSuccess(`Removed ${name}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      showError('Failed to delete user.');
    }
  };

  return (
    <PageLayout
      title="Laboratory User Management"
      subtitle="Manage access permissions, team roles, and laboratory personnel accounts"
    >
      <Card>
        <CardHeader
          title="Personnel Roster"
          subtitle={`Active Personnel Accounts: ${users.length}`}
          icon={Users}
          action={
            <Button variant="gradient" size="sm" icon={UserPlus} onClick={() => setModalOpen(true)}>
              Add Personnel
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      {u.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="cyan" size="sm">
                        {u.role || 'Personnel'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteUser(u.id, u.full_name)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8">
                    <EmptyState
                      icon={Users}
                      title="No Laboratory Users Found"
                      description="Click 'Add Personnel' to register a new user account for your team."
                      actionLabel="Add Personnel"
                      onAction={() => setModalOpen(true)}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Laboratory Personnel"
        subtitle="Provision a new user account for GenomeAI LIS"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Alex Morgan"
              className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.morgan@hospital.org"
              className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Account Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="Laboratory Technician">Laboratory Technician</option>
              <option value="Senior Bioinformatician">Senior Bioinformatician</option>
              <option value="Clinical Geneticist">Clinical Geneticist</option>
              <option value="LIS Administrator">LIS Administrator</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" type="submit" isLoading={creating}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
