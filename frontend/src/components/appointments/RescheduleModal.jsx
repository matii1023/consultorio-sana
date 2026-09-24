import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const RescheduleModal = ({ appointment, onSubmit, onCancel, loading = false }) => {
  const [dateTime, setDateTime] = useState(
    appointment.date_time.slice(0, 16)
  );
  const [duration, setDuration] = useState(appointment.duration || 30);
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!dateTime) {
      setError('La nueva fecha y hora es obligatoria');
      return;
    }

    try {
      await onSubmit({
        date_time: dateTime,
        duration: parseInt(duration),
        notify_patient: notifyPatient,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reprogramar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-sana-50 border border-sana-100">
        <p className="text-xs text-sana-500 uppercase tracking-wide mb-1">
          Cita original
        </p>
        <p className="font-semibold text-sana-800">
          {appointment.patient_first_name} {appointment.patient_last_name}
        </p>
        <p className="text-xs text-sana-400 mt-0.5">
          📅 {new Date(appointment.date_time).toLocaleString('es-AR')} · Dr.{' '}
          {appointment.doctor_last_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nueva fecha y hora *"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Duración (min)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input-field"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
          </select>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyPatient}
            onChange={(e) => setNotifyPatient(e.target.checked)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm text-emerald-800">
            💬 Enviar WhatsApp al paciente con el nuevo turno
          </span>
        </label>
      </div>

      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
        ⚠️ La cita volverá al estado "Pendiente" hasta que el paciente confirme.
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-sana-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Reprogramando...' : 'Reprogramar cita'}
        </Button>
      </div>
    </form>
  );
};

export default RescheduleModal;