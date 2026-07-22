import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Save, Monitor, Moon, Sparkles, Cpu, Eye, Link } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import styles from './SettingsPage.module.css';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:8000';

const STORAGE_KEY = 'genomeai_settings';

const defaults = {
  preferredModel: 'CNN',
  theme: 'light',
  animations: true,
  topPredictions: 5,
  apiEndpoint: API_BASE_URL,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...defaults };
}

export default function SettingsPage() {
  const systemPrefersReduced = useReducedMotion();
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);

    // Apply theme class on <html>
    document.documentElement.setAttribute(
      'data-theme',
      settings.theme
    );

    // Dispatch a custom event so other components can react to settings change
    window.dispatchEvent(
      new CustomEvent('genomeai-settings-change', { detail: settings })
    );
  };

  // Determine if animations are effectively on
  const animationsEnabled = settings.animations && !systemPrefersReduced;

  const fadeUp = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  };

  return (
    <PageLayout title="Settings" subtitle="Customise your GenomeAI experience.">
      <div className={styles.grid}>
        {/* Preferred Model */}
        <motion.section className={styles.panel} {...fadeUp}>
          <div className={styles.panelHead}>
            <Cpu size={22} />
            <h2>Preferred Model</h2>
          </div>
          <p className={styles.desc}>Select the default prediction model.</p>
          <div className={styles.radioGroup}>
            {['CNN', 'LSTM', 'Transformer'].map((model) => (
              <label key={model} className={styles.radioCard}>
                <input
                  type="radio"
                  name="preferredModel"
                  value={model}
                  checked={settings.preferredModel === model}
                  onChange={() => update('preferredModel', model)}
                />
                <span className={styles.radioIndicator} />
                <span className={styles.radioLabel}>{model}</span>
              </label>
            ))}
          </div>
        </motion.section>

        {/* Theme */}
        <motion.section className={styles.panel} {...fadeUp}>
          <div className={styles.panelHead}>
            <Moon size={22} />
            <h2>Theme</h2>
          </div>
          <p className={styles.desc}>Choose between light and dark mode.</p>
          <div className={styles.radioGroup}>
            {[
              { value: 'light', label: 'Light', icon: <Monitor size={18} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={18} /> },
            ].map((opt) => (
              <label key={opt.value} className={styles.radioCard}>
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  checked={settings.theme === opt.value}
                  onChange={() => update('theme', opt.value)}
                />
                <span className={styles.radioIndicator} />
                {opt.icon}
                <span className={styles.radioLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </motion.section>

        {/* Animations */}
        <motion.section className={styles.panel} {...fadeUp}>
          <div className={styles.panelHead}>
            <Sparkles size={22} />
            <h2>Animations</h2>
          </div>
          <p className={styles.desc}>
            Global animations and micro-interactions.{' '}
            {systemPrefersReduced && (
              <span className={styles.hint}>
                Your system prefers reduced motion — animations are off by default.
              </span>
            )}
          </p>
          <label className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Enable animations</span>
            <div className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.animations}
                onChange={(e) => update('animations', e.target.checked)}
              />
              <span className={styles.toggleSlider} />
            </div>
            <span className={styles.toggleState}>
              {animationsEnabled ? 'On' : 'Off'}
            </span>
          </label>
        </motion.section>

        {/* Prediction Options */}
        <motion.section className={styles.panel} {...fadeUp}>
          <div className={styles.panelHead}>
            <Eye size={22} />
            <h2>Prediction Options</h2>
          </div>
          <p className={styles.desc}>Default number of top predictions to show.</p>
          <div className={styles.numberInputWrap}>
            <label className={styles.numberLabel}>
              <span>Top predictions</span>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.topPredictions}
                onChange={(e) =>
                  update('topPredictions', Math.min(20, Math.max(1, Number(e.target.value))))
                }
                className={styles.numberInput}
              />
            </label>
          </div>
        </motion.section>

        {/* API Endpoint */}
        <motion.section className={styles.panel} {...fadeUp}>
          <div className={styles.panelHead}>
            <Link size={22} />
            <h2>API Endpoint</h2>
          </div>
          <p className={styles.desc}>Current backend API endpoint.</p>
          <div className={styles.apiField}>
            <input
              type="text"
              value={settings.apiEndpoint}
              onChange={(e) => update('apiEndpoint', e.target.value)}
              className={styles.apiInput}
              readOnly
            />
            <span className={styles.apiHint}>
              Update via the <code>VITE_API_URL</code> environment variable.
            </span>
          </div>
        </motion.section>

        {/* Save */}
        <motion.div className={styles.saveSection} {...fadeUp}>
          <button className={styles.saveBtn} onClick={handleSave}>
            <Save size={18} />
            {saved ? 'Settings Saved!' : 'Save Settings'}
          </button>
          {saved && (
            <span className={styles.saveToast}>All settings saved to localStorage.</span>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}