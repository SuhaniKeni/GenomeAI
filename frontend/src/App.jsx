import { Navigate, Route, Routes } from 'react-router-dom';
import PredictPage from './pages/PredictPage';
import ClinicalReportPage from './pages/ClinicalReportPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboard from './pages/AdminDashboard';
import ApiDocs from './pages/ApiDocs';
import LoginPage from './pages/LoginPage';
import RegisterLabPage from './pages/RegisterLabPage';
import LabUsersPage from './pages/LabUsersPage';
import LabManagementPage from './pages/LabManagementPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-lab" element={<RegisterLabPage />} />
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/analysis" element={<PredictPage />} />
      <Route path="/predict" element={<PredictPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/reports" element={<ClinicalReportPage />} />
      <Route path="/clinical-report" element={<ClinicalReportPage />} />
      <Route path="/users" element={<LabUsersPage />} />
      <Route path="/lab-management" element={<LabManagementPage />} />
      <Route path="/settings" element={<LabManagementPage />} />
      <Route path="/about" element={<ApiDocs />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


