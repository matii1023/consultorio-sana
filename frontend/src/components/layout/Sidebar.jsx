import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard',    label: 'Inicio',         icon: '🏠', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
    { path: '/appointments', label: 'Citas',          icon: '📅', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
    { path: '/patients',     label: 'Pacientes',      icon: '👥', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
    { path: '/doctors',      label: 'Médicos',        icon: '👨‍⚕️', roles: ['ADMIN'] },
    { path: '/specialties',  label: 'Especialidades', icon: '🩺', roles: ['ADMIN'] },
    { path: '/users',        label: 'Usuarios',       icon: '👤', roles: ['ADMIN'] },
     { path: '/audit',        label: 'Auditoría',      icon: '📜', roles: ['ADMIN'] },
     { path: '/backups', label: 'Backups', icon: '🛡️', roles: ['ADMIN'] },
     { path: '/settings', label: 'Configuración', icon: '⚙️', roles: ['ADMIN'] },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 bg-white border-r border-sana-100 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sana-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sana-400 to-sana-600 flex items-center justify-center">
            <span className="text-white text-lg font-light">+s</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sana-700 leading-tight">+sana</h1>
            <p className="text-[10px] tracking-widest text-sana-400">CONSULTORIO</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {allowedItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                 ? 'bg-sana-500 text-white shadow-soft'
                 : 'text-sana-600 hover:bg-sana-50'
               }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sana-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-sana-100 flex items-center justify-center text-sana-600 font-medium text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sana-800 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-sana-400 truncate capitalize">
              {user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-sm text-sana-500 hover:text-red-500 hover:bg-red-50 
                     py-2 rounded-xl transition-all text-left px-3"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;