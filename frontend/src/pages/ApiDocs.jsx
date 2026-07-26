import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dna, ShieldCheck, Cpu, Database, Sparkles, Activity, FileText, Clock,
  Users, ChevronDown, ChevronUp, Layers, CheckCircle2, AlertTriangle,
  Building2, GraduationCap, Microscope, BookOpen, BarChart2
} from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import styles from './ApiDocs.module.css';

const SUPPORTED_DISEASES = [
  { name: 'Healthy / Benign Sequence', category: 'Baseline', desc: 'Benign & likely benign non-pathogenic genomic variants.' },
  { name: 'Hereditary Breast & Ovarian Cancer (HBOC)', category: 'Oncology', desc: 'Pathogenic BRCA1 & BRCA2 genomic risk variants.' },
  { name: 'Breast Cancer', category: 'Oncology', desc: 'Genomic risk variants associated with PALB2 & CHEK2 alterations.' },
  { name: 'Lung Cancer', category: 'Oncology', desc: 'Somatic & germline sequence patterns linked to EGFR, KRAS, & ALK.' },
  { name: "Alzheimer's Disease", category: 'Neurology', desc: 'Neurodegenerative variant signatures within ApoE & APP pathways.' },
  { name: "Parkinson's Disease", category: 'Neurology', desc: 'Dopaminergic LRRK2 & PINK1 genomic locus variant classifications.' },
  { name: 'Leukemia', category: 'Hematology', desc: 'Hematologic malignancy variants in CEBPA & FLT3 DNA.' },
  { name: 'Type 2 Diabetes', category: 'Endocrinology', desc: 'Metabolic genomic locus susceptibility classification (ABCC8/GCK).' },
  { name: 'Ovarian Cancer', category: 'Oncology', desc: 'Gynecologic oncology risk variants (RAD51C/BRIP1).' },
  { name: 'Colorectal Cancer', category: 'Oncology', desc: 'Gastrointestinal genomic mutation sequence analysis (APC/MSH).' },
];



const WORKFLOW_STEPS = [
  { step: '01', title: 'DNA Sample', desc: 'Sequenced in lab' },
  { step: '02', title: 'Sequence Validation', desc: '201-bp window check' },
  { step: '03', title: 'CNN Analysis', desc: 'Pattern extraction' },
  { step: '04', title: 'Disease Prediction', desc: 'Multi-class mapping' },
  { step: '05', title: 'Confidence Score', desc: 'Probability rating' },
  { step: '06', title: 'PDF Report', desc: 'Clinical export' },
  { step: '07', title: 'Expert Review', desc: 'Medical interpretation' },
];

const KEY_FEATURES = [
  { icon: ShieldCheck, title: 'DNA Validation', desc: 'Automated 201-bp window checking, GC content computation, and base count auditing.' },
  { icon: Cpu, title: 'AI Disease Prediction', desc: 'Evaluates genomic sequences against 8 multi-class disease risk categories.' },
  { icon: BarChart2, title: 'Confidence Scoring', desc: 'Outputs exact percentage confidence ratings and ranked probability distributions.' },
  { icon: FileText, title: 'PDF Report Export', desc: 'Generates vector-styled ReportLab laboratory reports for clinical record-keeping.' },
  { icon: Clock, title: 'Analysis History', desc: 'Searchable audit trail stored in SQLite/PostgreSQL with multi-tenant lab scoping.' },
  { icon: Users, title: 'User Management', desc: 'Role-Based Access Control (RBAC) for Admins, Lab Managers, Techs, and Researchers.' },
];

export default function ApiDocs() {
  const [techOpen, setTechOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* 1. Hero Section */}
        <section className={styles.heroCard}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>Commercial LIS Platform Overview</span>
          </div>
          <h1>GenomeAI: AI-Assisted DNA Disease Analysis Platform</h1>
          <p className={styles.tagline}>
            "Analyze DNA with AI. Generate professional laboratory reports."
          </p>
          <p className={styles.heroSub}>
            GenomeAI is a high-performance Laboratory Information System (LIS) that empowers molecular biology laboratories, geneticists, and research institutions to accelerate DNA sequence interpretation with validated deep learning algorithms.
          </p>
        </section>

        {/* 2. What is GenomeAI? */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Dna className={styles.iconBlue} size={20} />
            <h2>What is GenomeAI?</h2>
          </div>
          <div className={styles.grid2}>
            <div className={styles.textCard}>
              <p>
                Modern genomic sequencing generates vast nucleotide datasets. Traditional analysis relies on manual variant lookup, which is time-consuming and often overlooks contextual motif interactions across non-coding regions.
              </p>
              <p>
                <strong>GenomeAI</strong> acts as an intelligent decision-support copilot for laboratory technicians and bioinformaticians. By analyzing raw 201-bp DNA sequence windows, GenomeAI calculates disease probability distributions across 8 major health conditions in milliseconds.
              </p>
            </div>
            <div className={styles.textCardHighlight}>
              <ShieldCheck className={styles.iconTeal} size={24} />
              <div>
                <strong>Built for Modern Laboratories</strong>
                <p>
                  GenomeAI streamlines laboratory operations from sample receipt to report distribution while maintaining strict multi-tenant data privacy and clinical audit trails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Visual Workflow */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Activity className={styles.iconBlue} size={20} />
            <h2>Laboratory Workflow Pipeline</h2>
          </div>
          <div className={styles.workflowTrack}>
            {WORKFLOW_STEPS.map((s, idx) => (
              <div key={s.step} className={styles.workflowStep}>
                <div className={styles.stepNum}>{s.step}</div>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
                {idx < WORKFLOW_STEPS.length - 1 && <div className={styles.arrow} />}
              </div>
            ))}
          </div>
        </section>

        {/* 4. Key Features */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Sparkles className={styles.iconBlue} size={20} />
            <h2>Core Platform Features</h2>
          </div>
          <div className={styles.featuresGrid}>
            {KEY_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className={styles.featureCard}>
                  <div className={styles.featIconWrap}>
                    <Icon size={20} />
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Supported Diseases */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Database className={styles.iconBlue} size={20} />
            <h2>Supported Disease Categories</h2>
          </div>
          <div className={styles.diseaseGrid}>
            {SUPPORTED_DISEASES.map((dis) => (
              <div key={dis.name} className={styles.diseaseCard}>
                <span className={styles.categoryTag}>{dis.category}</span>
                <h4>{dis.name}</h4>
                <p>{dis.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. AI Analysis Engine */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Cpu className={styles.iconBlue} size={20} />
            <h2>The GenomeAI CNN Engine</h2>
          </div>
          <div className={styles.engineCard}>
            <p className={styles.engineSimple}>
              GenomeAI processes DNA similarly to how computer vision systems identify patterns in digital images. Instead of reading individual letters independently, the 1D Convolutional Neural Network scans nucleotide windows to detect complex motif structures, GC density clusters, and mutation signatures associated with disease risks.
            </p>

            <button
              type="button"
              className={styles.collapseToggle}
              onClick={() => setTechOpen(!techOpen)}
            >
              <span>Technical Architecture & Training Parameters</span>
              {techOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {techOpen && (
              <motion.div
                className={styles.techDetailsBox}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <ul>
                  <li><strong>Embedding Layer:</strong> Nucleotide tokens (A, T, G, C, N) mapped to 32-dimensional dense vector space.</li>
                  <li><strong>Multi-Scale Convolutions:</strong> Parallel 1D convolutional layers with kernel sizes 7, 5, and 3 to capture multi-scale motifs.</li>
                  <li><strong>Activations & Regularization:</strong> Swish non-linear activations with Batch Normalization and 0.3 Dropout.</li>
                  <li><strong>Dual Pooling Strategy:</strong> Combines GlobalMaxPooling1D and GlobalAveragePooling1D for localized spike and composition feature retention.</li>
                  <li><strong>Optimization:</strong> Adam optimizer trained on Categorical Crossentropy loss.</li>
                </ul>
              </motion.div>
            )}
          </div>
        </section>

        {/* 7. Platform Statistics */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <BarChart2 className={styles.iconBlue} size={20} />
            <h2>Validated Engine Performance</h2>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statVal}>68,527</div>
              <div className={styles.statLabel}>ClinVar Variant Targets</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>8</div>
              <div className={styles.statLabel}>Disease Categories</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>65.46%</div>
              <div className={styles.statLabel}>Measured Validation Accuracy</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>v2.0</div>
              <div className={styles.statLabel}>GenomeAI CNN Model</div>
            </div>
          </div>
        </section>

        {/* 8. Technology Stack */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Layers className={styles.iconBlue} size={20} />
            <h2>Enterprise Technology Stack</h2>
          </div>
          <div className={styles.techStackGrid}>
            <div className={styles.stackCard}>
              <strong>Frontend</strong>
              <span>React 19, Tailwind CSS, Lucide Icons, Recharts, Framer Motion</span>
            </div>
            <div className={styles.stackCard}>
              <strong>Backend REST API</strong>
              <span>FastAPI, Python 3.12, Uvicorn, ReportLab PDF Engine</span>
            </div>
            <div className={styles.stackCard}>
              <strong>AI & Deep Learning</strong>
              <span>TensorFlow, Keras 1D-CNN, PyTorch, SHAP Explainability</span>
            </div>
            <div className={styles.stackCard}>
              <strong>Database & Security</strong>
              <span>SQLAlchemy 2.0 ORM, SQLite / PostgreSQL, JWT Bearer Tokens</span>
            </div>
          </div>
        </section>

        {/* 9. Intended Users */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <Users className={styles.iconBlue} size={20} />
            <h2>Target Audience</h2>
          </div>
          <div className={styles.usersGrid}>
            <div className={styles.userCard}>
              <Microscope size={22} className={styles.iconBlue} />
              <h4>Molecular Biology Labs</h4>
              <p>Accelerate variant classification during high-throughput sequencing runs.</p>
            </div>
            <div className={styles.userCard}>
              <Building2 size={22} className={styles.iconTeal} />
              <h4>Genetic Research Centers</h4>
              <p>Audit multi-class risk probabilities across large cohort datasets.</p>
            </div>
            <div className={styles.userCard}>
              <GraduationCap size={22} className={styles.iconNavy} />
              <h4>Universities & Institutes</h4>
              <p>Train students on AI-assisted bioinformatics decision-support workflows.</p>
            </div>
            <div className={styles.userCard}>
              <BookOpen size={22} className={styles.iconGreen} />
              <h4>Biotechnology Students</h4>
              <p>Gain hands-on experience with modern LIS software and AI disease modeling.</p>
            </div>
          </div>
        </section>

        {/* 10. Important Notice */}
        <section className={styles.disclaimerCard}>
          <AlertTriangle className={styles.iconWarn} size={24} />
          <div>
            <h3>Regulatory & Clinical Decision Support Notice</h3>
            <p>
              GenomeAI is an AI-assisted decision-support software designed to assist laboratory personnel and bioinformatics researchers. It is <strong>NOT</strong> an autonomous medical diagnostic device. Predictions generated by GenomeAI must always be evaluated alongside laboratory findings, patient history, and expert clinical judgment by qualified healthcare professionals.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
