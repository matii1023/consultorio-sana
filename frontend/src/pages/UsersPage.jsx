import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import UserCard from '../components/users/UserCard';
import UserForm from '../components/users/UserForm';
import { usersApi } from '../api/users.api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.getAll({
        role: filterRole,
        search: search,
      });
      setUsers(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search, filterRole]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormModalOpen(true);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, form);
      } else {
        await usersApi.create(form);
      }
      setFormModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResetPassword = (user) => {
    setPasswordUser(user);
    setNewPassword('');
    setPasswordError('');
    setPasswordModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await usersApi.resetPassword(passwordUser.id, newPassword);
      setPasswordModalOpen(false);
      setPasswordUser(null);
      setNewPassword('');
      alert(`✅ Contraseña actualizada para ${passwordUser.first_name} ${passwordUser.last_name}\n\nNueva contraseña: ${newPassword}`);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      if (user.is_active) {
        await usersApi.delete(user.id);
      } else {
        await usersApi.update(user.id, { is_active: true });
      }
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // Contadores por rol
  const counts = {
    ADMIN: users.filter((u) => u.role === 'ADMIN' && u.is_active).length,
    SECRETARY: users.filter((u) => u.role === 'SECRETARY' && u.is_active).length,
    DOCTOR: users.filter((u) => u.role === 'DOCTOR' && u.is_active).length,
  };

  return (
    <DashboardLayout>
      <Header
        title="Usuarios"
        subtitle="Gestión de usuarios del sistema"
      />

      <div className="p-8">
        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 
                            flex items-center justify-center text-lg">
              👑
            </div>
            <div>
              <p className="text-2xl font-semibold text-sana-800">{counts.ADMIN}</p>
              <p className="text-xs text-sana-400">Administradores</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 
                            flex items-center justify-center text-lg">
              💼
            </div>
            <div>
              <p className="text-2xl font-semibold text-sana-800">{counts.SECRETARY}</p>
              <p className="text-xs text-sana-400">Secretarias</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 
                            flex items-center justify-center text-lg">
              👨‍⚕️
            </div>
            <div>
              <p className="text-2xl font-semibold text-sana-800">{counts.DOCTOR}</p>
              <p className="text-xs text-sana-400">Médicos</p>
            </div>
          </Card>
        </div>

        {/* Filtros y botón */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="input-field pl-11"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sana-400">
              🔍
            </span>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field sm:w-56"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">Administradores</option>
            <option value="SECRETARY">Secretarias</option>
            <option value="DOCTOR">Médicos</option>
          </select>
          <Button onClick={handleCreate}>+ Nuevo usuario</Button>
        </div>

        {/* Lista */}
        {loading ? (
          <Card><Loader text="Cargando usuarios..." /></Card>
        ) : users.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                {search || filterRole ? 'No se encontraron usuarios' : 'Aún no hay usuarios'}
              </h3>
              <p className="text-sm text-sana-400 mb-6">
                {search || filterRole
                  ? 'Prueba con otros filtros'
                  : 'Crea el primer usuario del sistema'}
              </p>
              {!search && !filterRole && (
                <Button onClick={handleCreate}>+ Crear primer usuario</Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onResetPassword={handleOpenResetPassword}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        size="lg"
      >
        <UserForm
          initialData={editingUser}
          onSubmit={handleSubmit}
          onCancel={() => { setFormModalOpen(false); setEditingUser(null); }}
          loading={submitting}
        />
      </Modal>

      {/* Modal de reset de contraseña */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setPasswordUser(null); }}
        title="Cambiar contraseña"
        size="sm"
      >
        {passwordUser && (
          <form onSubmit={handleResetPassword}>
            <div className="p-3 rounded-xl bg-sana-50 border border-sana-100 mb-4">
              <p className="text-xs text-sana-500 uppercase tracking-wide mb-1">
                Usuario
              </p>
              <p className="font-semibold text-sana-800">
                {passwordUser.first_name} {passwordUser.last_name}
              </p>
              <p className="text-xs text-sana-400 mt-0.5">{passwordUser.email}</p>
            </div>

            <Input
              label="Nueva contraseña"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              required
            />

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700 mt-2">
              ⚠️ Anota la nueva contraseña para comunicársela al usuario. No podrás verla después.
            </div>

            {passwordError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {passwordError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-sana-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setPasswordModalOpen(false); setPasswordUser(null); }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default UsersPage;