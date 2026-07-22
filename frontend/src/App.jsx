import { Navigate, Route, Routes } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import AnimatedDNA from './components/AnimatedDNA';
import GradientButton from './components/GradientButton';
import FeatureSection from './components/FeatureSection';
import StatsSection from './components/StatsSection';
import Footer from './components/Footer';
import PredictPage from './pages/PredictPage';
import ModelDashboard from './pages/ModelDashboard';
import ResearchDashboard from './pages/ResearchDashboard';
import DatasetAnalytics from './pages/DatasetAnalytics';
import DNAVisualizer from './pages/DNAVisualizer';
import MutationAnalysisPage from './pages/MutationAnalysisPage';
import DoctorDashboard from './pages/DoctorDashboard';
import ClinicalReportPage from './pages/ClinicalReportPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import ApiDocs from './pages/ApiDocs';
import { features, stats } from './data/siteContent';
import styles from './styles/App.module.css';

function HomePage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={styles.page}>
      <ParticleBackground />
      <Navbar />

      <main className={styles.main}>
        {/* ============================================= */}
        {/* HERO */}
        {/* ============================================= */}
        <section className={styles.hero} id="home">
          <motion.div
            className={styles.heroCopy}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className={styles.badgeRow}>
              <span className={styles.badge}>
                <span>🧠</span> Deep Learning &bull; Genomics &bull; AI
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              <span>AI-Powered</span>
              <span className={styles.highlight}>DNA</span>
              <span>Disease Prediction</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Analyze DNA sequences using a deep learning CNN model trained on
              disease-associated genomic mutations.
            </p>

            <div className={styles.heroActions}>
              <GradientButton to="/predict">
                Start Prediction
                <ArrowRight size={18} />
              </GradientButton>
              <a className={styles.secondaryButton} href="#about">
                Learn More
              </a>
            </div>

            <div className={styles.securityNote}>
              <ShieldCheck size={18} />
              <span>Your DNA remains private and secure.</span>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          >
            <AnimatedDNA />
          </motion.div>
        </section>

        {/* ============================================= */}
        {/* FEATURES */}
        {/* ============================================= */}
        <FeatureSection items={features} />

        {/* ============================================= */}
        {/* STATS */}
        {/* ============================================= */}
        <StatsSection items={stats} />
      </main>

      {/* ============================================= */}
      {/* FOOTER */}
      {/* ============================================= */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/predict" element={<PredictPage />} />
      <Route path="/model-dashboard" element={<ModelDashboard />} />
      <Route path="/research-dashboard" element={<ResearchDashboard />} />
      <Route path="/dataset-analytics" element={<DatasetAnalytics />} />
      <Route path="/dna-visualizer" element={<DNAVisualizer />} />
      <Route path="/mutation-analysis" element={<MutationAnalysisPage />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/clinical-report" element={<ClinicalReportPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
