import { motion } from 'framer-motion';
import {
  BookOpen,
  Server,
  Activity,
  FileText,
  BarChart3,
  PieChart,
  Clock,
  Shield,
  ExternalLink,
  Code
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import styles from './ApiDocs.module.css';

const API_SECTIONS = [
  {
    id: 'health',
    title: 'Health API',
    icon: Activity,
    method: 'GET',
    methodStyle: 'methodGet',
    endpoint: '/api/health',
    description: 'Check the server health status. Returns a simple response indicating the server is running and available.',
    sampleRequest: `fetch('/api/health')`,
    sampleResponse: `{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}`
  },
  {
    id: 'prediction',
    title: 'Prediction API',
    icon: Server,
    method: 'POST',
    methodStyle: 'methodPost',
    endpoint: '/api/predict',
    description: 'Submit a genomic sequence for disease prediction. Accepts a DNA sequence string and optional model selection. Returns the predicted disease, confidence score, SHAP explanation, mutation analysis, and AI insights.',
    sampleRequest: `fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sequence: "ATGCGATCGTAGCTAG...",
    model: "transformer",
    patient_name: "John Doe"
  })
})`,
    sampleResponse: `{
  "success": true,
  "result": {
    "predicted_disease": "Cardiomyopathy",
    "confidence": 0.973,
    "confidence_level": "High",
    "model": "transformer",
    "all_predictions": {
      "Cardiomyopathy": 0.973,
      "Healthy": 0.018,
      "Diabetes": 0.009
    },
    "inference_time_ms": 145.3,
    "shap_explanation": [
      { "position": 42, "base": "G", "importance": 0.23 },
      { "position": 87, "base": "T", "importance": -0.18 }
    ],
    "mutation_analysis": {
      "mutations_detected": 3,
      "pathogenic_mutations": 2,
      "details": [
        { "position": 156, "ref": "G", "alt": "A", "impact": "Missense" }
      ]
    },
    "ai_insights": "High-confidence prediction..."
  }
}`
  },
  {
    id: 'report',
    title: 'Report API',
    icon: FileText,
    method: 'POST',
    methodStyle: 'methodPost',
    endpoint: '/api/report/download',
    description: 'Generate and download a structured PDF report for a given prediction result. Requires a sequence and optional patient details.',
    sampleRequest: `fetch('/api/report/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sequence: "ATGCGATCGTAGCTAG...",
    model: "lstm",
    patient_name: "Jane Smith"
  })
})`,
    sampleResponse: `[Binary PDF data]
Content-Type: application/pdf
Content-Disposition: attachment; filename="genome_report.pdf"

The response is a downloadable PDF file containing:
- Patient and sample metadata
- Predicted disease & confidence
- SHAP-based explanation plot
- Mutation analysis results
- AI-generated clinical insights
- Model performance disclaimer`
  },
  {
    id: 'benchmark',
    title: 'Benchmark API',
    icon: BarChart3,
    method: 'GET',
    methodStyle: 'methodGet',
    endpoint: '/api/benchmark',
    description: 'Retrieve benchmark performance metrics for all available models (CNN, LSTM, Transformer). Includes accuracy, precision, recall, F1 score, inference time, and ROC curve data.',
    sampleRequest: `fetch('/api/benchmark')`,
    sampleResponse: `{
  "success": true,
  "results": {
    "CNN": {
      "accuracy": 0.952,
      "precision": 0.947,
      "recall": 0.951,
      "f1_score": 0.949,
      "inference_time": 12.4,
      "roc_curve": [
        { "threshold": 0.0, "fpr": 0.0, "tpr": 0.0 },
        { "threshold": 0.1, "fpr": 0.02, "tpr": 0.85 }
      ]
    },
    "LSTM": {
      "accuracy": 0.968,
      "precision": 0.963,
      "recall": 0.967,
      "f1_score": 0.965,
      "inference_time": 28.7,
      "roc_curve": [ ... ]
    },
    "Transformer": {
      "accuracy": 0.981,
      "precision": 0.978,
      "recall": 0.98,
      "f1_score": 0.979,
      "inference_time": 56.2,
      "roc_curve": [ ... ]
    }
  }
}`
  },
  {
    id: 'analytics',
    title: 'Analytics API',
    icon: PieChart,
    method: 'GET',
    methodStyle: 'methodGet',
    endpoint: '/api/analytics',
    description: 'Fetch dataset analytics including dataset size, number of disease classes, training/testing sample counts, class distribution, sequence length statistics, GC content, nucleotide frequencies, and mutation frequency per disease.',
    sampleRequest: `fetch('/api/analytics')`,
    sampleResponse: `{
  "success": true,
  "analytics": {
    "dataset_size": 125000,
    "disease_classes": 8,
    "training_samples": 100000,
    "testing_samples": 25000,
    "class_distribution": {
      "Healthy": 25000,
      "Cardiomyopathy": 18000,
      "Diabetes": 16000
    },
    "sequence_length": {
      "min": 50,
      "max": 500,
      "mean": 250.4,
      "median": 245
    },
    "gc_content": {
      "mean": 42.3,
      "min": 28.1,
      "max": 65.7
    },
    "nucleotide_frequency": {
      "A": 0.28,
      "T": 0.27,
      "G": 0.22,
      "C": 0.21,
      "N": 0.02
    },
    "mutation_frequency": {
      "Cardiomyopathy": 0.043,
      "Diabetes": 0.031,
      "Healthy": 0.008
    }
  }
}`
  },
  {
    id: 'history',
    title: 'History API',
    icon: Clock,
    method: 'GET',
    methodStyle: 'methodGet',
    endpoint: '/api/history',
    description: 'Retrieve paginated prediction history. Supports search, filtering by model and disease, and pagination via limit and offset parameters.',
    sampleRequest: `fetch('/api/history?limit=10&offset=0&search=cardio&model=transformer&disease=Cardiomyopathy')`,
    sampleResponse: `{
  "total": 1250,
  "records": [
    {
      "id": "pred_001",
      "timestamp": "2025-01-15T10:30:00Z",
      "predicted_disease": "Cardiomyopathy",
      "confidence": 0.973,
      "model": "transformer",
      "sequence_preview": "ATGCGATCGT... (42 bp)"
    }
  ]
}`
  },
  {
    id: 'admin',
    title: 'Admin API',
    icon: Shield,
    method: 'GET',
    methodStyle: 'methodGet',
    endpoint: '/api/admin/stats',
    description: 'Access administrative statistics about the system. Returns total predictions, average confidence, most predicted disease, model usage breakdown, and daily prediction counts.',
    sampleRequest: `fetch('/api/admin/stats')`,
    sampleResponse: `{
  "success": true,
  "stats": {
    "total_predictions": 1250,
    "average_confidence": 0.934,
    "most_predicted_disease": "Cardiomyopathy",
    "model_usage": {
      "CNN": 350,
      "LSTM": 500,
      "Transformer": 400
    },
    "predictions_per_day": [
      { "date": "2025-01-10", "count": 45 },
      { "date": "2025-01-11", "count": 62 }
    ]
  }
}`
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function ApiDocs() {
  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.kicker}>
            <Code size={18} />
            Developer Reference
          </div>
          <h1>API Documentation</h1>
          <p>
            Complete reference for the Genome AI REST API. All endpoints return JSON
            responses unless otherwise noted.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {API_SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <motion.div key={section.id} className={styles.panel} variants={itemVariants}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelIcon}>
                    <Icon size={22} />
                  </div>
                  <h2>{section.title}</h2>
                  <span className={`${styles.methodBadge} ${styles[section.methodStyle]}`}>
                    {section.method}
                  </span>
                </div>

                <div className={styles.endpoint}>
                  <span className={styles.endpointUrl}>{section.endpoint}</span>
                </div>

                <p className={styles.desc}>{section.description}</p>

                <div className={styles.sectionTitle}>Sample Request</div>
                <div className={styles.codeBlock}>
                  <code>{section.sampleRequest}</code>
                </div>

                <div className={styles.sectionTitle}>Sample Response</div>
                <div className={styles.codeBlock}>
                  <code>{section.sampleResponse}</code>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          <a href="/docs" className={styles.swaggerLink}>
            <ExternalLink size={20} />
            View Interactive Swagger Documentation
          </a>
        </motion.div>
      </div>
    </div>
  );
}
