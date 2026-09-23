import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from '../common/CommandPalette';
import { useWhatsAppPolling } from '../../hooks/useWhatsAppPolling';
import { useUpcomingAppointments } from '../../hooks/useUpcomingAppointments';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  const whatsappEnabled = user?.role === 'ADMIN' || user?.role === 'SECRETARY';
  useWhatsAppPolling(whatsappEnabled);
  useUpcomingAppointments(true);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        {children || <Outlet />}
      </main>
      <CommandPalette />
    </div>
  );
};

export default DashboardLayout;