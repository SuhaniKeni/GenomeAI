import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, Building2, Mail, Lock, User, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { registerLaboratory } from '../api/client';
import styles from './AuthPage.module.css';

export default function RegisterLabPage() {
  const navigate = useNavigate();
  const [labName, setLabName] = useState('');
  const [labCode, setLabCode] = useState(`LAB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [institution, setInstitution] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!labName || !labCode || !adminEmail || !adminName || !adminPassword) {
      setError('Please fill in all required laboratory registration fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerLaboratory({
        lab_name: labName,
        lab_code: labCode,
        institution,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCardWide}>
        <div className={styles.brandHeader}>
          <div className={styles.logoWrap}>
            <Dna size={28} />
          </div>
          <h2>Register New Laboratory</h2>
          <span className={styles.subText}>Create a multi-tenant GenomeAI LIS laboratory profile</span>
        </div>

        <form onSubmit={handleRegister} className={styles.formGrid}>
          <div className={styles.formSection}>
            <h4>1. Laboratory Information</h4>
            <div className={styles.formGroup}>
              <label>Laboratory Name *</label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="e.g. Molecular Genetics Institute"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Laboratory Code *</label>
              <input
                type="text"
                value={labCode}
                onChange={(e) => setLabCode(e.target.value)}
                placeholder="e.g. LAB-CENTRAL-01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>University / Parent Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Stanford School of Medicine"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h4>2. Administrator Account</h4>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Administrator Email *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@laboratory.org"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password *</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorBoxSpan}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.submitSpan}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <span>{loading ? 'Creating Laboratory...' : 'Create Laboratory Profile'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <div className={styles.footerLink}>
          <span>Already registered?</span>
          <Link to="/login">Sign In to Existing Laboratory</Link>
        </div>
      </div>
    </div>
  );
}
