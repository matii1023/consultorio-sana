import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const UserForm = ({ initialData = null, onSubmit, onCancel, loading = false }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'SECRETARY',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (initialData) {
      setEditMode(true);
      setForm({
        email: initialData.email || '',
        password: '',
        role: initialData.role || 'SECRETARY',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        phone: initialData.phone || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!editMode) {
      if (!form.email || !form.password || !form.first_name || !form.last_name) {
        setError('Todos los campos con * son obligatorios');
        return;
      }
      if (form.password.length < 4) {
        setError('La contraseña debe tener al menos 4 caracteres');
        return;
      }
    } else {
      if (!form.first_name || !form.last_name) {
        setError('Nombre y apellido son obligatorios');
        return;
      }
    }

    try {
      const payload = { ...form };
      if (editMode) {
        delete payload.email;
        delete payload.password;
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombres"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="María"
          required
        />
        <Input
          label="Apellidos"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="González"
          required
        />
      </div>

      {!editMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Usuario o Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="recepcion o recepcion@sana.com"
            required
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Teléfono (opcional)"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+5491123456789"
        />
        <div>
          <label className="label">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="ADMIN">Administrador</option>
            <option value="SECRETARY">Secretaria / Recepción</option>
            <option value="DOCTOR">Médico</option>
          </select>
        </div>
      </div>

      {form.role === 'DOCTOR' && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
          💡 Para médicos, es mejor crearlos desde el módulo de <strong>Médicos</strong>,
          porque necesitan matrícula, especialidad y otros datos adicionales.
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-sana-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;