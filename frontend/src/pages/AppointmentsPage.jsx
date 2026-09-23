import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import AppointmentCard from '../components/appointments/AppointmentCard';
import AppointmentForm from '../components/appointments/AppointmentForm';
import MedicalRecordForm from '../components/medicalRecords/MedicalRecordForm';
import { appointmentsApi } from '../api/appointments.api';
import { doctorsApi } from '../api/doctors.api';
import { patientsApi } from '../api/patients.api';
import { medicalRecordsApi } from '../api/medicalRecords.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import {
  exportToExcel,
  formatDateTimeForExport,
} from '../utils/exportHelpers';
import { printAppointmentReceipt } from '../utils/appointmentReceipt';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();

  // ✅ clinicInfo DENTRO del componente
  const clinicInfo = {
    name: settings.clinic_name,
    address: settings.clinic_address,
    phone: settings.clinic_phone,
  };

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordAppointment, setRecordAppointment] = useState(null);
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  const isDoctor = user?.role === 'DOCTOR';

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [docsRes, patRes] = await Promise.all([
          doctorsApi.getAll(),
          patientsApi.getAll(),
        ]);
        setDoctors(docsRes.data);
        setPatients(patRes.data);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    loadCatalogs();
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsApi.getAll({ date: selectedDate });
      setAppointments(data);
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filterDoctor && a.doctor_id !== filterDoctor) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      return true;
    });
  }, [appointments, filterDoctor, filterStatus]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      let patientId;

      if (data.mode === 'new') {
        const patientRes = await patientsApi.create(data.newPatient);
        patientId = patientRes.data.id;

        const refreshed = await patientsApi.getAll();
        setPatients(refreshed.data);

        showToast(
          `Paciente ${data.newPatient.first_name} ${data.newPatient.last_name} registrado`,
          'success'
        );
      } else {
        patientId = data.selectedPatient.id;
      }

      await appointmentsApi.create({
        patient_id: patientId,
        doctor_id: data.appointment.doctor_id,
        date_time: data.appointment.date_time,
        duration: data.appointment.duration,
        reason: data.appointment.reason,
        notes: data.appointment.notes,
      });

      setNewModalOpen(false);
      await loadAppointments();
      showToast('Cita agendada correctamente', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al agendar cita', 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      await loadAppointments();

      const labels = {
        CONFIRMED: 'Cita confirmada',
        IN_PROGRESS: 'Consulta iniciada',
        COMPLETED: 'Consulta completada',
        CANCELLED: 'Cita cancelada',
        NO_SHOW: 'Paciente no asistió',
      };
      showToast(labels[status] || 'Estado actualizado', 'success');
    } catch (err) {
      console.error('Error cambiando estado:', err);
      showToast('Error al cambiar estado', 'error');
    }
  };

  const handleRegisterConsultation = (appointment) => {
    setRecordAppointment(appointment);
    setRecordModalOpen(true);
  };

  const handleSaveRecord = async (form) => {
    setRecordSubmitting(true);
    try {
      await medicalRecordsApi.create(form);
      setRecordModalOpen(false);
      setRecordAppointment(null);
      await loadAppointments();
      showToast('Registro clínico guardado', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar registro', 'error');
      throw err;
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handlePrintReceipt = async (appointment) => {
    try {
      showToast('Generando comprobante...', 'info');
      await printAppointmentReceipt(appointment, clinicInfo);
    } catch (err) {
      console.error('Error generando comprobante:', err);
      showToast('Error al generar comprobante', 'error');
    }
  };

  const handleExportAppointments = () => {
    if (filteredAppointments.length === 0) {
      showToast('No hay citas para exportar', 'warning');
      return;
    }

    const columns = [
      { key: 'date_time', label: 'Fecha y hora', format: formatDateTimeForExport },
      { key: 'duration', label: 'Duración (min)' },
      { key: 'patient_last_name', label: 'Apellido' },
      { key: 'patient_first_name', label: 'Nombre' },
      { key: 'patient_document', label: 'Documento' },
      { key: 'patient_phone', label: 'Teléfono' },
      { key: 'doctor_last_name', label: 'Médico' },
      { key: 'specialty_name', label: 'Especialidad' },
      {
        key: 'status',
        label: 'Estado',
        format: (status) => {
          const labels = {
            PENDING: 'Pendiente',
            CONFIRMED: 'Confirmada',
            IN_PROGRESS: 'En consulta',
            COMPLETED: 'Completada',
            CANCELLED: 'Cancelada',
            NO_SHOW: 'No asistió',
          };
          return labels[status] || status;
        },
      },
      { key: 'reason', label: 'Motivo' },
    ];

    exportToExcel(filteredAppointments, columns, 'citas', 'Citas');
    showToast(`${filteredAppointments.length} citas exportadas`, 'success');
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const clearFilters = () => {
    setFilterDoctor('');
    setFilterStatus('');
  };

  const hasFilters = filterDoctor || filterStatus;
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    'es-AR',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  const recordPatient = recordAppointment
    ? {
        id: recordAppointment.patient_id,
        first_name: recordAppointment.patient_first_name,
        last_name: recordAppointment.patient_last_name,
        document_id: recordAppointment.patient_document,
      }
    : null;

  return (
    <DashboardLayout>
      <Header title="Citas" subtitle="Agenda y gestión de citas médicas" />

      <div className="p-8">
        <Card className="mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeDate(-1)}
                className="w-10 h-10 rounded-xl hover:bg-sana-50 text-sana-600 transition"
              >
                ←
              </button>
              <div className="text-center min-w-[250px]">
                <p className="text-sm font-medium text-sana-800 capitalize">
                  {formattedDate}
                </p>
                {isToday && <span className="text-xs text-sana-400">Hoy</span>}
              </div>
              <button
                onClick={() => changeDate(1)}
                className="w-10 h-10 rounded-xl hover:bg-sana-50 text-sana-600 transition"
              >
                →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field w-auto"
              />
              {!isToday && (
                <Button variant="secondary" onClick={goToToday}>
                  Hoy
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-sana-500 mb-1 block">Médico</label>
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="input-field"
              >
                <option value="">Todos los médicos</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.first_name} {d.last_name} — {d.specialty_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs text-sana-500 mb-1 block">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="IN_PROGRESS">En consulta</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="NO_SHOW">No asistió</option>
              </select>
            </div>

            {hasFilters && (
              <div className="sm:self-end sm:pb-0.5">
                <button
                  onClick={clearFilters}
                  className="text-xs text-sana-500 hover:text-sana-700 
                             px-3 py-2.5 rounded-xl hover:bg-sana-50 transition"
                >
                  ✕ Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-sana-800">
            {filteredAppointments.length} cita
            {filteredAppointments.length !== 1 ? 's' : ''}
            {hasFilters && ` (de ${appointments.length})`}
            {isToday ? ' para hoy' : ' para esta fecha'}
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportAppointments}>
              📥 Exportar
            </Button>
            <Button onClick={() => setNewModalOpen(true)}>+ Nueva cita</Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <Loader text="Cargando agenda..." />
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                {hasFilters
                  ? 'No hay citas que coincidan con los filtros'
                  : 'No hay citas agendadas'}
              </h3>
              <p className="text-sm text-sana-400 mb-6">
                {hasFilters
                  ? 'Prueba quitando o cambiando los filtros'
                  : isToday
                  ? 'Comienza agendando una cita para hoy'
                  : 'No hay citas para esta fecha'}
              </p>
              {hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={() => setNewModalOpen(true)}>+ Agendar cita</Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusChange={handleStatusChange}
                onRegisterConsultation={handleRegisterConsultation}
                onPrintReceipt={handlePrintReceipt}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Nueva cita"
        size="lg"
      >
        <AppointmentForm
          doctors={doctors}
          patients={patients}
          onSubmit={handleCreate}
          onCancel={() => setNewModalOpen(false)}
          loading={submitting}
        />
      </Modal>

      <Modal
        isOpen={recordModalOpen}
        onClose={() => {
          setRecordModalOpen(false);
          setRecordAppointment(null);
        }}
        title="Registro clínico"
        size="lg"
      >
        {recordPatient && (
          <MedicalRecordForm
            patient={recordPatient}
            appointmentId={recordAppointment?.id}
            onSubmit={handleSaveRecord}
            onCancel={() => {
              setRecordModalOpen(false);
              setRecordAppointment(null);
            }}
            loading={recordSubmitting}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default AppointmentsPage;