import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const AppointmentForm = ({ doctors, patients, onSubmit, onCancel, loading = false }) => {
  const [mode, setMode] = useState('existing');
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [newPatient, setNewPatient] = useState({
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

  const [form, setForm] = useState({
    doctor_id: '',
    date_time: '',
    duration: 30,
    reason: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');

  useEffect(() => {
    if (form.doctor_id) {
      const doctor = doctors.find((d) => d.id === form.doctor_id);
      setDoctorSpecialty(doctor?.specialty_name || '');
    } else {
      setDoctorSpecialty('');
    }
  }, [form.doctor_id, doctors]);

  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setFilteredPatients([]);
      return;
    }
    const q = patientSearch.toLowerCase();
    const filtered = patients.filter(
      (p) =>
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.document_id?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
    setFilteredPatients(filtered.slice(0, 8));
  }, [patientSearch, patients]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNewPatientChange = (e) => {
    setNewPatient({ ...newPatient, [e.target.name]: e.target.value });
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.first_name} ${patient.last_name}`);
    setShowDropdown(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError('');
    if (newMode === 'new') {
      setSelectedPatient(null);
      setPatientSearch('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.doctor_id || !form.date_time) {
      setError('Médico y fecha/hora son obligatorios');
      return;
    }

    if (mode === 'existing') {
      if (!selectedPatient) {
        setError('Debes seleccionar un paciente');
        return;
      }
    } else {
      if (
        !newPatient.document_id ||
        !newPatient.first_name ||
        !newPatient.last_name ||
        !newPatient.birth_date ||
        !newPatient.phone
      ) {
        setError(
          'Para el nuevo paciente: documento, nombres, apellidos, fecha de nacimiento y teléfono son obligatorios'
        );
        return;
      }
    }

    try {
      await onSubmit({
        mode,
        selectedPatient,
        newPatient,
        appointment: form,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar la cita');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* SECCIÓN PACIENTE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Paciente *</label>
          <div className="inline-flex rounded-xl bg-sana-50 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('existing')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition
                ${mode === 'existing'
                  ? 'bg-white text-sana-700 shadow-sm'
                  : 'text-sana-500'
                }`}
            >
              Existente
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('new')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition
                ${mode === 'new'
                  ? 'bg-white text-sana-700 shadow-sm'
                  : 'text-sana-500'
                }`}
            >
              + Nuevo
            </button>
          </div>
        </div>

        {/* MODO: PACIENTE EXISTENTE */}
        {mode === 'existing' && (
          <div className="relative">
            {selectedPatient ? (
              <div className="p-3 rounded-xl bg-sana-50 border border-sana-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                                flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {selectedPatient.first_name?.[0]}
                  {selectedPatient.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sana-800 truncate">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  <p className="text-xs text-sana-400">
                    Doc: {selectedPatient.document_id} · {selectedPatient.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="w-8 h-8 rounded-lg hover:bg-white text-sana-500 
                             flex items-center justify-center transition flex-shrink-0"
                  title="Cambiar paciente"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar por nombre, documento o teléfono..."
                  className="input-field"
                />

                {showDropdown && patientSearch.length >= 2 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white 
                                  rounded-xl shadow-xl border border-sana-100 z-20 
                                  max-h-64 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-sana-400">
                        No se encontraron pacientes
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left px-4 py-2.5 hover:bg-sana-50 
                                     transition flex items-center gap-3 border-b border-sana-50 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                                          flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {p.first_name?.[0]}
                            {p.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-sana-800 truncate">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-xs text-sana-400 truncate">
                              Doc: {p.document_id} · {p.phone}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* MODO: PACIENTE NUEVO */}
        {mode === 'new' && (
          <div className="p-4 rounded-xl bg-sana-50 border border-sana-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Documento *"
                name="document_id"
                value={newPatient.document_id}
                onChange={handleNewPatientChange}
                placeholder="12345678"
              />
              <div>
                <label className="label">Género *</label>
                <select
                  name="gender"
                  value={newPatient.gender}
                  onChange={handleNewPatientChange}
                  className="input-field"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nombres *"
                name="first_name"
                value={newPatient.first_name}
                onChange={handleNewPatientChange}
                placeholder="Juan"
              />
              <Input
                label="Apellidos *"
                name="last_name"
                value={newPatient.last_name}
                onChange={handleNewPatientChange}
                placeholder="Pérez"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Fecha de nacimiento *"
                name="birth_date"
                type="date"
                value={newPatient.birth_date}
                onChange={handleNewPatientChange}
              />
              <div>
                <Input
                  label="Teléfono (WhatsApp) *"
                  name="phone"
                  value={newPatient.phone}
                  onChange={handleNewPatientChange}
                  placeholder="2634589236"
                />
                <p className="text-xs text-sana-400 -mt-2 mb-4">
                  💡 Podés escribir el número sin el +54 9.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Email (opcional)"
                name="email"
                type="email"
                value={newPatient.email}
                onChange={handleNewPatientChange}
                placeholder="paciente@email.com"
              />
              <Input
                label="Contacto de emergencia (opcional)"
                name="emergency_contact"
                value={newPatient.emergency_contact}
                onChange={handleNewPatientChange}
                placeholder="María 2634589236"
              />
            </div>

            <Input
              label="Dirección (opcional)"
              name="address"
              value={newPatient.address}
              onChange={handleNewPatientChange}
              placeholder="Av. Siempre Viva 742"
            />

            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-emerald-600 text-sm">💡</span>
              <p className="text-xs text-emerald-700">
                El paciente se registrará automáticamente al guardar la cita.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN CITA */}
      <div className="pt-2 border-t border-sana-100">
        <p className="text-xs text-sana-500 uppercase tracking-wide mb-3">
          Datos de la cita
        </p>

        <div className="mb-4">
          <label className="label">Médico *</label>
          <select
            name="doctor_id"
            value={form.doctor_id}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Selecciona un médico...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.first_name} {d.last_name} — {d.specialty_name}
              </option>
            ))}
          </select>
          {doctorSpecialty && (
            <p className="text-xs text-sana-400 mt-1">
              🩺 Especialidad: {doctorSpecialty}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Fecha y hora *"
              name="date_time"
              type="datetime-local"
              value={form.date_time}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label">Duración (min)</label>
            <select
              name="duration"
              value={form.duration}
              onChange={handleChange}
              className="input-field"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>

        <Input
          label="Motivo de consulta"
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="Ej: Dolor de cabeza persistente"
        />

        <div>
          <label className="label">Notas internas</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className="input-field resize-none"
            placeholder="Notas solo visibles para el personal"
          />
        </div>
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
          {loading ? 'Agendando...' : 'Agendar cita'}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;