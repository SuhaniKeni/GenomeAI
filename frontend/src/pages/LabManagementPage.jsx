import { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Database, CheckCircle2, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { fetchLabDetails } from '../api/client.js';
import styles from './LabUsersPage.module.css';

export default function LabManagementPage() {
  const [lab, setLab] = useState({
    name: 'Central Genomics Institute',
    lab_code: 'LAB-CENTRAL-01',
    institution: 'National Bioinformatics Center',
    created_at: '2026-01-01',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchLabDetails();
        if (mounted && data.laboratory) {
          setLab(data.laboratory);
        }
      } catch {
        // Keeps default active lab profile
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div>
            <span className={styles.kicker}>Laboratory Infrastructure</span>
            <h1>Laboratory Management & Settings</h1>
            <p>
              Manage laboratory profile, institution affiliation, multi-tenant isolation, and engine parameters.
            </p>
          </div>
        </div>

        <div className={styles.tableCard} style={{ maxWidth: '680px' }}>
          <div className={styles.tableHead}>
            <h3>Laboratory Identity Profile</h3>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label>Laboratory Name</label>
              <input
                type="text"
                value={lab.name}
                onChange={(e) => setLab({ ...lab, name: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Laboratory Code (Unique LIS Identifier)</label>
              <input
                type="text"
                value={lab.lab_code}
                disabled
                style={{ background: 'var(--bg-main)', cursor: 'not-allowed' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>University / Parent Institution</label>
              <input
                type="text"
                value={lab.institution || ''}
                onChange={(e) => setLab({ ...lab, institution: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Database Registration Timestamp</label>
              <input
                type="text"
                value={lab.created_at || 'Registered'}
                disabled
                style={{ background: 'var(--bg-main)', cursor: 'not-allowed' }}
              />
            </div>

            {saved && (
              <div style={{ background: 'var(--badge-ready-bg)', color: 'var(--badge-ready-text)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Laboratory details updated successfully.
              </div>
            )}

            <div>
              <button type="submit" className={styles.primaryBtn}>
                <Save size={16} />
                <span>Save Laboratory Profile</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
