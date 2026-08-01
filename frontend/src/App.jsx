import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';

// Lazy-loaded Page Routes for Code-Splitting & Optimal Initial Load
const PredictPage = lazy(() => import('./pages/PredictPage'));
const ClinicalReportPage = lazy(() => import('./pages/ClinicalReportPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterLabPage = lazy(() => import('./pages/RegisterLabPage'));
const LabUsersPage = lazy(() => import('./pages/LabUsersPage'));
const LabManagementPage = lazy(() => import('./pages/LabManagementPage'));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary,#040d12)] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <LoadingSkeleton count={3} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-lab" element={<RegisterLabPage />} />
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/analysis" element={<PredictPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/supporting-evidence" element={<EvidencePage />} />
          <Route path="/reports" element={<ClinicalReportPage />} />
          <Route path="/clinical-report" element={<ClinicalReportPage />} />
          <Route path="/users" element={<LabUsersPage />} />
          <Route path="/lab-management" element={<LabManagementPage />} />
          <Route path="/settings" element={<LabManagementPage />} />
          <Route path="/about" element={<ApiDocs />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
