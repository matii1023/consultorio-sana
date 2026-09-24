import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const PatientForm = ({ initialData = null, onSubmit, onCancel, loading = false }) => {
  const [form, setForm] = useState({
    document_id: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'MASCULINO',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        document_id: initialData.document_id || '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        birth_date: initialData.birth_date?.slice(0, 10) || '',
        gender: initialData.gender || 'MASCULINO',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        emergency_contact: initialData.emergency_contact || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.document_id || !form.first_name || !form.last_name ||
        !form.birth_date || !form.phone) {
      setError('Documento, nombres, fecha de nacimiento y teléfono son obligatorios');
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Documento"
          name="document_id"
          value={form.document_id}
          onChange={handleChange}
          placeholder="12345678"
          required
        />
        <div>
          <label className="label">Género *</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="input-field"
          >
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombres"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="Juan Carlos"
          required
        />
        <Input
          label="Apellidos"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Pérez Gómez"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Fecha de nacimiento"
          name="birth_date"
          type="date"
          value={form.birth_date}
          onChange={handleChange}
          required
        />
        <div>
          <Input
            label="Teléfono (WhatsApp)"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="2634589236"
            required
          />
          <p className="text-xs text-sana-400 -mt-2 mb-4">
            💡 Podés escribir el número sin el +54 9. El sistema lo completa automáticamente.
          </p>
        </div>
      </div>

      <Input
        label="Email (opcional)"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="paciente@email.com"
      />

      <Input
        label="Dirección (opcional)"
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder="Av. Siempre Viva 742"
      />

      <Input
        label="Contacto de emergencia (opcional)"
        name="emergency_contact"
        value={form.emergency_contact}
        onChange={handleChange}
        placeholder="María Pérez 2634589236"
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear paciente'}
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;