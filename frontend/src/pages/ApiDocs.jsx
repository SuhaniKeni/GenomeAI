import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dna, ShieldCheck, Cpu, Database, Sparkles, Activity, FileText, Clock,
  Users, ChevronDown, ChevronUp, Layers, CheckCircle2, AlertTriangle,
  Building2, GraduationCap, Microscope, BookOpen, BarChart2, Code, Terminal
} from 'lucide-react';

import PageLayout from '../components/PageLayout';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { fetchModelMetrics } from '../api/client';

const SUPPORTED_DISEASES = [
  { name: 'Healthy / Benign Sequence', category: 'Baseline', desc: 'Benign & likely benign non-pathogenic genomic variants.' },
  { name: 'Hereditary Breast & Ovarian Cancer (HBOC)', category: 'Oncology', desc: 'Pathogenic BRCA1 & BRCA2 genomic risk variants.' },
  { name: 'Breast Cancer', category: 'Oncology', desc: 'Genomic risk variants associated with PALB2 & CHEK2 alterations.' },
  { name: 'Lung Cancer', category: 'Oncology', desc: 'Somatic & germline sequence patterns linked to EGFR, KRAS, & ALK.' },
  { name: "Alzheimer's Disease", category: 'Neurology', desc: 'Neurodegenerative variant signatures within ApoE & APP pathways.' },
  { name: "Parkinson's Disease", category: 'Neurology', desc: 'Dopaminergic LRRK2 & PINK1 genomic locus variant classifications.' },
  { name: 'Leukemia', category: 'Hematology', desc: 'Hematologic malignancy variants in CEBPA & FLT3 DNA.' },
  { name: 'Type 2 Diabetes', category: 'Endocrinology', desc: 'Metabolic genomic locus susceptibility classification (ABCC8/GCK).' },
];

export default function ApiDocs() {
  const [modelMetrics, setModelMetrics] = useState(null);

  useEffect(() => {
    fetchModelMetrics()
      .then((res) => {
        if (res && res.available !== false && res.accuracy) {
          setModelMetrics(res);
        }
      })
      .catch(() => setModelMetrics(null));
  }, []);

  return (
    <PageLayout
      title="System Architecture & API Documentation"
      subtitle="RESTful OpenAPI endpoints, 1D-CNN v2.0 neural specifications, and multi-class disease risk categories"
    >
      {/* Hero Overview */}
      <GlassCard className="p-8 border-cyan-500/30">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> LIS Decision Support Core
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">GenomeAI System Architecture</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              GenomeAI provides an automated bioinformatic classification pipeline for molecular genetics laboratories. By combining raw 201-bp sequence sliding windows with 1D Convolutional Neural Networks and local SHAP feature attributions, GenomeAI delivers instant clinical risk estimates.
            </p>
          </div>

          {modelMetrics && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 shrink-0">
              <p className="font-bold text-white mb-1">Engine Metrics</p>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Accuracy:</span>
                <span className="font-bold text-cyan-400">{modelMetrics.accuracy}%</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Macro F1:</span>
                <span className="font-bold text-emerald-400">{modelMetrics.macro_f1}%</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Latency:</span>
                <span className="font-bold text-indigo-400">~{modelMetrics.inference_time_ms} ms</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Disease Categories Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Dna className="w-5 h-5 text-cyan-400" /> Supported Genomic Classification Categories
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUPPORTED_DISEASES.map((dis, idx) => (
            <GlassCard key={idx} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {dis.category}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{dis.name}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{dis.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* OpenAPI Endpoint References */}
      <GlassCard>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" /> REST API Endpoint Reference
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { method: 'POST', path: '/api/predict', desc: 'Runs 1D-CNN disease risk classification on 201-bp sequence' },
            { method: 'POST', path: '/api/predict/extended', desc: 'Runs prediction + SHAP explainability feature attributions' },
            { method: 'POST', path: '/api/predict/report', desc: 'Streams ReportLab vector PDF clinical report asset' },
            { method: 'GET', path: '/api/history', desc: 'Retrieves audited analysis log records from database' },
            { method: 'GET', path: '/health', desc: 'System health check and database connectivity monitor' },
          ].map((ep, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ep.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {ep.method}
                </span>
                <span className="font-bold text-white">{ep.path}</span>
              </div>
              <span className="text-[11px] font-sans text-slate-400">{ep.desc}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </PageLayout>
  );
}
