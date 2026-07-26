import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { loginUser } from '../api/client';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your laboratory credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Authentication failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoWrap}>
            <Dna size={24} />
          </div>
          <h2>GenomeAI LIS Portal</h2>
          <span className={styles.subText}>Clinical Genomic Decision Support System</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Laboratory Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={15} className={styles.icon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@laboratory.com"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.passHeader}>
              <label>Password</label>
              <a
                href="#forgot"
                className={styles.forgotLink}
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact your LIS Laboratory Administrator to reset your password.');
                }}
              >
                Forgot Password?
              </a>
            </div>
            <div className={styles.inputWrap}>
              <Lock size={15} className={styles.icon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In to Laboratory LIS'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Registration Section */}
        <div className={styles.footerLink}>
          <span>Need to register a laboratory?</span>
          <Link to="/register-lab">Create Laboratory Profile</Link>
        </div>
      </div>
    </div>
  );
}
