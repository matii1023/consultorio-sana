import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const DoctorForm = ({ initialData = null, specialties, onSubmit, onCancel, loading = false }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialty_id: '',
    license_number: '',
    bio: '',
    consultation_fee: '',
  });
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (initialData) {
      setEditMode(true);
      setForm({
        email: initialData.email || '',
        password: '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        phone: initialData.phone || '',
        specialty_id: initialData.specialty_id || '',
        license_number: initialData.license_number || '',
        bio: initialData.bio || '',
        consultation_fee: initialData.consultation_fee || '',
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
      if (!form.email || !form.password || !form.first_name || !form.last_name ||
          !form.specialty_id || !form.license_number) {
        setError('Todos los campos con * son obligatorios');
        return;
      }
    } else {
      if (!form.first_name || !form.last_name || !form.specialty_id || !form.license_number) {
        setError('Todos los campos con * son obligatorios');
        return;
      }
    }

    try {
      const payload = { ...form };
      if (editMode) {
        delete payload.email;
        delete payload.password;
      }
      if (payload.consultation_fee) {
        payload.consultation_fee = parseFloat(payload.consultation_fee);
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
          placeholder="Carlos"
          required
        />
        <Input
          label="Apellidos"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="García"
          required
        />
      </div>

      {!editMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="dr.garcia@sana.com"
            required
          />
          <Input
            label="Contraseña temporal"
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
          label="Teléfono"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+5491123456789"
        />
        <Input
          label="Matrícula / Colegiado"
          name="license_number"
          value={form.license_number}
          onChange={handleChange}
          placeholder="MP-12345"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Especialidad *</label>
          <select
            name="specialty_id"
            value={form.specialty_id}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Selecciona especialidad...</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <Input
          label="Costo consulta (opcional)"
          name="consultation_fee"
          type="number"
          value={form.consultation_fee}
          onChange={handleChange}
          placeholder="150.00"
        />
      </div>

      <div className="mb-4">
        <label className="label">Biografía (opcional)</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={2}
          className="input-field resize-none"
          placeholder="Breve reseña profesional"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : editMode ? 'Actualizar médico' : 'Crear médico'}
        </Button>
      </div>
    </form>
  );
};

export default DoctorForm;