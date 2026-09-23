import { useState } from 'react';
import Button from '../common/Button';

const PrescriptionModal = ({
  patient,
  doctor,
  specialty,
  initialDiagnosis = '',
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [medications, setMedications] = useState([
    { name: '', dose: '', frequency: '', duration: '', notes: '' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dose: '', frequency: '', duration: '', notes: '' },
    ]);
  };

  const removeMedication = (index) => {
    if (medications.length === 1) return;
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validMeds = medications.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      setError('Agrega al menos un medicamento');
      return;
    }

    try {
      await onSubmit({
        patient,
        doctor,
        specialty,
        medications: validMeds,
        instructions,
        diagnosis,
      });
    } catch (err) {
      setError(err.message || 'Error al generar la receta');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Info del paciente */}
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

      {/* Diagnóstico */}
      <div>
        <label className="label">Diagnóstico</label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="input-field"
          placeholder="Ej: Faringitis aguda"
        />
      </div>

      {/* Medicamentos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Medicamentos *</label>
          <button
            type="button"
            onClick={addMedication}
            className="text-xs text-sana-600 hover:text-sana-800 font-medium"
          >
            + Agregar medicamento
          </button>
        </div>

        <div className="space-y-3">
          {medications.map((med, index) => (
            <div
              key={index}
              className="p-3 rounded-xl border border-sana-100 bg-sana-50/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-sana-600">
                  Medicamento #{index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ✕ Quitar
                  </button>
                )}
              </div>

              <input
                type="text"
                value={med.name}
                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                placeholder="Nombre del medicamento (ej: Ibuprofeno 400mg)"
                className="input-field mb-2 text-sm"
              />

              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  value={med.dose}
                  onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                  placeholder="Dosis (1 comp)"
                  className="input-field text-sm"
                />
                <input
                  type="text"
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                  placeholder="Cada 8hs"
                  className="input-field text-sm"
                />
                <input
                  type="text"
                  value={med.duration}
                  onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                  placeholder="5 días"
                  className="input-field text-sm"
                />
              </div>

              <input
                type="text"
                value={med.notes}
                onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                placeholder="Indicaciones adicionales (opcional)"
                className="input-field text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicaciones generales */}
      <div>
        <label className="label">Indicaciones generales</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="input-field resize-none"
          placeholder="Ej: Reposo, hidratación abundante, volver si persiste la fiebre..."
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
          {loading ? 'Generando...' : '📄 Generar receta'}
        </Button>
      </div>
    </form>
  );
};

export default PrescriptionModal;