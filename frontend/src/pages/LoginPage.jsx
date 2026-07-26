import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { loginUser } from '../api/client';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@genomeai.lab');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in your laboratory email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError('');
    try {
      await loginUser(demoEmail, demoPass);
      navigate('/');
    } catch {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoWrap}>
            <Dna size={28} />
          </div>
          <h2>GenomeAI LIS Portal</h2>
          <span className={styles.subText}>Clinical Genomic Decision Support System</span>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Laboratory Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.icon} />
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
              <a href="#forgot" className={styles.forgotLink} onClick={() => alert('Please contact your LIS Laboratory Administrator to reset your password.')}>
                Forgot Password?
              </a>
            </div>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.icon} />
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
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In to Laboratory LIS'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className={styles.demoBox}>
          <span>Quick Demo Roles:</span>
          <div className={styles.demoChips}>
            <button type="button" onClick={() => handleQuickDemo('admin@genomeai.lab', 'admin123')}>
              Administrator
            </button>
            <button type="button" onClick={() => handleQuickDemo('tech@genomeai.lab', 'tech123')}>
              Technician
            </button>
            <button type="button" onClick={() => handleQuickDemo('manager@genomeai.lab', 'manager123')}>
              Lab Manager
            </button>
          </div>
        </div>

        <div className={styles.footerLink}>
          <span>Need to register a new laboratory?</span>
          <Link to="/register-lab">Create Laboratory Profile</Link>
        </div>
      </div>
    </div>
  );
}
