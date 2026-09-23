import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const SpecialtyForm = ({ initialData = null, onSubmit, onCancel, loading = false }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Nombre de la especialidad"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Ej: Cardiología"
        required
      />

      <div className="mb-4">
        <label className="label">Descripción (opcional)</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Breve descripción de la especialidad"
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
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear especialidad'}
        </Button>
      </div>
    </form>
  );
};

export default SpecialtyForm;