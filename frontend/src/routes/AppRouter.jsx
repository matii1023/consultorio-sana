import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Páginas
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PatientsPage from '../pages/PatientsPage';
import PatientDetailPage from '../pages/PatientDetailPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import DoctorsPage from '../pages/DoctorsPage';
import SpecialtiesPage from '../pages/SpecialtiesPage';
import UsersPage from '../pages/UsersPage';
import AuditPage from '../pages/AuditPage';
import MessagesPage from '../pages/MessagesPage';   // ← Este faltaba
import NotFoundPage from '../pages/NotFoundPage';
import BackupsPage from '../pages/BackupsPage';
import SettingsPage from '../pages/SettingsPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/messages" element={<MessagesPage />} />

          {/* Solo Admin */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/specialties" element={<SpecialtiesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/backups" element={<BackupsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;