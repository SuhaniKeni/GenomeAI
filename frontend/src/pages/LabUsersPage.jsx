import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Trash2, Mail, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import { fetchLabUsers, createLabUser, deleteLabUser } from '../api/client.js';
import styles from './LabUsersPage.module.css';

export default function LabUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Laboratory Technician');
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLabUsers();
      setUsers(data.users || []);
    } catch {
      setError('Could not load laboratory users.');
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
      setError('Please complete all user creation fields.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await createLabUser({
        full_name: fullName,
        email,
        password,
        role,
      });
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Failed to create user account.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the laboratory?')) return;
    try {
      await deleteLabUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to delete user account.');
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div>
            <span className={styles.kicker}>LIS User Management</span>
            <h1>Laboratory Users & Access Control</h1>
            <p>
              Manage personnel accounts, grant Role-Based Access Control (RBAC) permissions, and audit laboratory operators.
            </p>
          </div>

          <button type="button" className={styles.primaryBtn} onClick={() => setModalOpen(true)}>
            <UserPlus size={18} />
            <span>Create Laboratory User</span>
          </button>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h3>Active Personnel ({users.length})</h3>
            <button type="button" className={styles.refreshBtn} onClick={loadUsers}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role / Designation</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>Loading laboratory personnel...</td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className={styles.idCell}>#USR-{u.id}</td>
                      <td className={styles.nameCell}>
                        <strong>{u.full_name}</strong>
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td>
                        <span className={styles.roleChip}>{u.role}</span>
                      </td>
                      <td className={styles.dateCell}>{u.created_at ? u.created_at.slice(0, 10) : 'Recent'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.delBtn}
                          onClick={() => handleDeleteUser(u.id)}
                          title="Remove User Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>No personnel registered in this laboratory.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {modalOpen && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Add New Laboratory User</h3>
                <button type="button" className={styles.closeBtn} onClick={() => setModalOpen(false)}>×</button>
              </div>

              <form onSubmit={handleCreateUser} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@laboratory.org"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Initial Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Role / RBAC Permission *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="Administrator">Administrator</option>
                    <option value="Laboratory Manager">Laboratory Manager</option>
                    <option value="Laboratory Technician">Laboratory Technician</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Student">Student</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={creating}>
                    {creating ? 'Saving...' : 'Add Personnel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
