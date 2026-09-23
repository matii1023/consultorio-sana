import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

// Signos vitales comunes predefinidos
const COMMON_VITALS = [
  { key: 'presion', label: 'Presión arterial', placeholder: '120/80', unit: 'mmHg' },
  { key: 'peso', label: 'Peso', placeholder: '70', unit: 'kg' },
  { key: 'altura', label: 'Altura', placeholder: '175', unit: 'cm' },
  { key: 'temperatura', label: 'Temperatura', placeholder: '36.5', unit: '°C' },
  { key: 'frecuencia_cardiaca', label: 'Frecuencia cardíaca', placeholder: '75', unit: 'lpm' },
  { key: 'frecuencia_respiratoria', label: 'Frecuencia respiratoria', placeholder: '16', unit: 'rpm' },
  { key: 'saturacion', label: 'Saturación O₂', placeholder: '98', unit: '%' },
  { key: 'glucosa', label: 'Glucosa', placeholder: '90', unit: 'mg/dL' },
];

const MedicalRecordForm = ({
  patient,
  appointmentId = null,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form, setForm] = useState({
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  // Estado de vitals: { key: { value, label, unit } }
  const [vitals, setVitals] = useState({});
  const [showVitalPicker, setShowVitalPicker] = useState(false);
  const [customVital, setCustomVital] = useState({ label: '', value: '', unit: '' });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVitalChange = (key, value) => {
    setVitals({ ...vitals, [key]: { ...vitals[key], value } });
  };

  const addCommonVital = (vital) => {
    setVitals({
      ...vitals,
      [vital.key]: { label: vital.label, value: '', unit: vital.unit },
    });
    setShowVitalPicker(false);
  };

  const addCustomVital = () => {
    if (!customVital.label.trim() || !customVital.value.trim()) return;

    const key = `custom_${Date.now()}`;
    setVitals({
      ...vitals,
      [key]: {
        label: customVital.label,
        value: customVital.value,
        unit: customVital.unit,
      },
    });
    setCustomVital({ label: '', value: '', unit: '' });
    setShowVitalPicker(false);
  };

  const removeVital = (key) => {
    const updated = { ...vitals };
    delete updated[key];
    setVitals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.symptoms || !form.diagnosis || !form.treatment) {
      setError('Síntomas, diagnóstico y tratamiento son obligatorios');
      return;
    }

    // Construir objeto de vitals limpio (solo los que tienen valor)
    const cleanVitals = {};
    Object.entries(vitals).forEach(([key, v]) => {
      if (v.value && String(v.value).trim() !== '') {
        cleanVitals[key] = {
          label: v.label,
          value: v.value,
          unit: v.unit || '',
        };
      }
    });

    try {
      await onSubmit({
        patient_id: patient.id,
        appointment_id: appointmentId,
        vitals: Object.keys(cleanVitals).length > 0 ? cleanVitals : null,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el registro');
    }
  };

  // Signos que aún no están agregados
  const availableVitals = COMMON_VITALS.filter((v) => !vitals[v.key]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Paciente */}
      <div className="p-4 rounded-xl bg-sana-50 border border-sana-100">
        <p className="text-xs text-sana-500 uppercase tracking-wide mb-1">
          Paciente
        </p>
        <p className="font-semibold text-sana-800">
          {patient.first_name} {patient.last_name}
        </p>
        <p className="text-xs text-sana-400 mt-0.5">
          Doc: {patient.document_id}
        </p>
      </div>

      {/* Signos vitales */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-sana-700">
            Signos vitales
            <span className="text-xs text-sana-400 font-normal ml-2">
              (opcional, agrega solo los relevantes)
            </span>
          </h3>
          <button
            type="button"
            onClick={() => setShowVitalPicker(!showVitalPicker)}
            className="text-xs text-sana-600 hover:text-sana-800 font-medium"
          >
            + Agregar signo vital
          </button>
        </div>

        {/* Signos ya agregados */}
        {Object.keys(vitals).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {Object.entries(vitals).map(([key, vital]) => (
              <div key={key} className="relative">
                <label className="label text-xs">
                  {vital.label}
                  {vital.unit && (
                    <span className="text-sana-400 font-normal"> ({vital.unit})</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vital.value}
                    onChange={(e) => handleVitalChange(key, e.target.value)}
                    placeholder={`Valor en ${vital.unit || 'unidad'}`}
                    className="input-field text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeVital(key)}
                    className="w-10 h-10 rounded-xl hover:bg-red-50 text-red-500 
                               flex items-center justify-center transition flex-shrink-0"
                    title="Quitar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selector de signos comunes */}
        {showVitalPicker && (
          <div className="p-4 rounded-xl bg-sana-50 border border-sana-200 space-y-3">
            {availableVitals.length > 0 && (
              <div>
                <p className="text-xs text-sana-500 uppercase tracking-wide mb-2">
                  Signos comunes
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableVitals.map((vital) => (
                    <button
                      key={vital.key}
                      type="button"
                      onClick={() => addCommonVital(vital)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white border border-sana-200 
                                 text-sana-700 hover:bg-sana-100 transition"
                    >
                      + {vital.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Signo personalizado */}
            <div className="pt-3 border-t border-sana-200">
              <p className="text-xs text-sana-500 uppercase tracking-wide mb-2">
                Signo personalizado
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={customVital.label}
                  onChange={(e) => setCustomVital({ ...customVital, label: e.target.value })}
                  placeholder="Nombre (ej: IMC)"
                  className="input-field text-sm"
                />
                <input
                  type="text"
                  value={customVital.unit}
                  onChange={(e) => setCustomVital({ ...customVital, unit: e.target.value })}
                  placeholder="Unidad (ej: kg/m²)"
                  className="input-field text-sm"
                />
                <button
                  type="button"
                  onClick={addCustomVital}
                  disabled={!customVital.label.trim() || !customVital.value.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              <input
                type="text"
                value={customVital.value}
                onChange={(e) => setCustomVital({ ...customVital, value: e.target.value })}
                placeholder="Valor"
                className="input-field text-sm mt-2"
              />
            </div>
          </div>
        )}

        {Object.keys(vitals).length === 0 && !showVitalPicker && (
          <p className="text-xs text-sana-400 italic">
            No hay signos vitales agregados aún
          </p>
        )}
      </div>

      {/* Campos clínicos */}
      <div>
        <label className="label">Síntomas *</label>
        <textarea
          name="symptoms"
          value={form.symptoms}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Describe los síntomas que presenta el paciente..."
          required
        />
      </div>

      <div>
        <label className="label">Diagnóstico *</label>
        <textarea
          name="diagnosis"
          value={form.diagnosis}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Diagnóstico médico..."
          required
        />
      </div>

      <div>
        <label className="label">Tratamiento *</label>
        <textarea
          name="treatment"
          value={form.treatment}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Medicación, indicaciones, estudios solicitados..."
          required
        />
      </div>

      <div>
        <label className="label">Notas adicionales</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          className="input-field resize-none"
          placeholder="Observaciones, seguimiento..."
        />
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
          {loading ? 'Guardando...' : 'Guardar registro clínico'}
        </Button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;