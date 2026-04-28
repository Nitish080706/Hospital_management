import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';


import LoginPage from './pages/LoginPage';


import PatientDashboard from './pages/patient/PatientDashboard';
import PatientChatbot from './pages/patient/PatientChatbot';


import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ConsultationPage from './pages/doctor/ConsultationPage';
import DoctorProfile from './pages/doctor/DoctorProfile';


import NurseDashboard from './pages/nurse/NurseDashboard';
import RegisterPatient from './pages/nurse/RegisterPatient';
import DoctorAvailability from './pages/nurse/DoctorAvailability';
import DoctorPatientMap from './pages/nurse/DoctorPatientMap';
import Waitlist from './pages/nurse/Waitlist';


import AdminDashboard from './pages/admin/AdminDashboard';
import InsuranceOverride from './pages/admin/InsuranceOverride';
import ManageAccounts from './pages/admin/ManageAccounts';
import AIAuditLogs from './pages/admin/AIAuditLogs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          
          {}
          <Route path="/patient" element={
            <ProtectedRoute allowedTypes={['patient']}>
              <AppLayout><PatientDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/patient/chatbot" element={
            <ProtectedRoute allowedTypes={['patient']}>
              <AppLayout><PatientChatbot /></AppLayout>
            </ProtectedRoute>
          } />

          {}
          <Route path="/doctor" element={
            <ProtectedRoute allowedTypes={['doctor']}>
              <AppLayout><DoctorDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/consult/:patientId" element={
            <ProtectedRoute allowedTypes={['doctor']}>
              <AppLayout><ConsultationPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/profile" element={
            <ProtectedRoute allowedTypes={['doctor']}>
              <AppLayout><DoctorProfile /></AppLayout>
            </ProtectedRoute>
          } />

          {}
          <Route path="/nurse" element={
            <ProtectedRoute allowedTypes={['nurse']}>
              <AppLayout><NurseDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nurse/register" element={
            <ProtectedRoute allowedTypes={['nurse', 'admin']}>
              <AppLayout><RegisterPatient /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nurse/doctors" element={
            <ProtectedRoute allowedTypes={['nurse', 'admin']}>
              <AppLayout><DoctorAvailability /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nurse/map" element={
            <ProtectedRoute allowedTypes={['nurse', 'admin']}>
              <AppLayout><DoctorPatientMap /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nurse/waitlist" element={
            <ProtectedRoute allowedTypes={['nurse', 'admin']}>
              <AppLayout><Waitlist /></AppLayout>
            </ProtectedRoute>
          } />

          {}
          <Route path="/admin" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/register" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><RegisterPatient /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/doctors" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><DoctorAvailability /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/map" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><DoctorPatientMap /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/waitlist" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><Waitlist /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/insurance" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><InsuranceOverride /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/accounts" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><ManageAccounts /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AppLayout><AIAuditLogs /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
