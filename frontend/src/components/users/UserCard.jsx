const UserCard = ({ user, onEdit, onResetPassword, onToggleActive }) => {
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  const roleConfig = {
    ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-700', icon: '👑' },
    SECRETARY: { label: 'Secretaria', color: 'bg-blue-100 text-blue-700', icon: '💼' },
    DOCTOR: { label: 'Médico', color: 'bg-emerald-100 text-emerald-700', icon: '👨‍⚕️' },
  };

  const role = roleConfig[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700', icon: '👤' };

  return (
    <div className={`card border border-sana-100 hover:shadow-soft transition-all
                     ${!user.is_active ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                        flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sana-800 truncate">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-xs text-sana-400 mt-0.5 truncate">
                {user.email}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${role.color} flex items-center gap-1 flex-shrink-0`}>
              {role.icon} {role.label}
            </span>
          </div>

          {user.phone && (
            <p className="text-xs text-sana-500 mt-2">📞 {user.phone}</p>
          )}

          {!user.is_active && (
            <p className="text-xs text-red-500 mt-2 font-medium">⚠ Usuario desactivado</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-sana-100">
        <button
          onClick={() => onEdit(user)}
          className="text-xs font-medium text-sana-600 hover:bg-sana-50 px-3 py-1.5 rounded-lg transition"
        >
          Editar
        </button>
        <button
          onClick={() => onResetPassword(user)}
          className="text-xs font-medium text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition"
        >
          🔑 Contraseña
        </button>
        <button
          onClick={() => onToggleActive(user)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ml-auto
            ${user.is_active
              ? 'text-red-500 hover:bg-red-50'
              : 'text-emerald-600 hover:bg-emerald-50'
            }`}
        >
          {user.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
};

export default UserCard;