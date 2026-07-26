import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dna, Building2, Mail, Lock, User, ShieldCheck, GraduationCap, ArrowRight, AlertCircle
} from 'lucide-react';
import { registerLaboratory } from '../api/client';
import styles from './AuthPage.module.css';

export default function RegisterLabPage() {
  const navigate = useNavigate();
  const [labName, setLabName] = useState('');
  const [labCode, setLabCode] = useState('');
  const [userEditedCode, setUserEditedCode] = useState(false);
  const [institution, setInstitution] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleLabCodeChange = (e) => {
    setLabCode(e.target.value);
    setUserEditedCode(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const finalCode = labCode.trim() || generateCodeFromName(labName) || 'LAB-2026';

    if (!labName || !adminEmail || !adminName || !adminPassword) {
      setError('Please fill in all required laboratory registration fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerLaboratory({
        lab_name: labName,
        lab_code: finalCode,
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
        {/* Page Header */}
        <div className={styles.brandHeaderCompact}>
          <div className={styles.logoWrapCompact}>
            <Dna size={22} />
          </div>
          <h2>Register New Laboratory</h2>
          <span className={styles.subTextCompact}>
            Create your laboratory profile to securely access the GenomeAI Laboratory Information System.
          </span>
        </div>

        {/* 2-Column Section Form */}
        <form onSubmit={handleRegister} className={styles.formGrid}>
          {/* Section 1: Laboratory Information */}
          <div className={styles.formSectionCard}>
            <div className={styles.sectionHead}>
              <div className={styles.secIconWrap}>
                <Building2 size={18} />
              </div>
              <div>
                <h3>Laboratory Information</h3>
                <p>Basic information about your organization.</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Laboratory Name *</label>
              <div className={styles.inputWrap}>
                <Building2 size={15} className={styles.icon} />
                <input
                  type="text"
                  value={labName}
                  onChange={handleLabNameChange}
                  placeholder="Central Genomics Laboratory"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelWithHelper}>
                <label>Laboratory Code *</label>
                <span className={styles.helperBadge}>Auto-generated</span>
              </div>
              <div className={styles.inputWrap}>
                <ShieldCheck size={15} className={styles.icon} />
                <input
                  type="text"
                  value={labCode}
                  onChange={handleLabCodeChange}
                  placeholder="CGL-2026"
                  required
                />
              </div>
              <span className={styles.fieldHelper}>Must be unique across GenomeAI.</span>
            </div>

            <div className={styles.formGroup}>
              <label>University / Parent Institution</label>
              <div className={styles.inputWrap}>
                <GraduationCap size={15} className={styles.icon} />
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Genome Research Institute"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Administrator Account */}
          <div className={styles.formSectionCard}>
            <div className={styles.sectionHead}>
              <div className={styles.secIconWrap}>
                <User size={18} />
              </div>
              <div>
                <h3>Administrator Account</h3>
                <p>Create primary administrator credentials.</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <div className={styles.inputWrap}>
                <User size={15} className={styles.icon} />
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Dr. Sarah Jenkins"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Administrator Email *</label>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.icon} />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@cglab.org"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Password *</label>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.icon} />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <span className={styles.fieldHelper}>Minimum 8 characters.</span>
            </div>
          </div>

          {error && (
            <div className={styles.errorBoxSpan}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.submitSpan}>
            <button type="submit" className={styles.submitBtnLarge} disabled={loading}>
              <span>{loading ? 'Creating Laboratory Profile...' : 'Create Laboratory Profile'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Clean Centered Footer Link */}
        <div className={styles.footerLinkCentered}>
          <span>Already have a laboratory account?</span>
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
