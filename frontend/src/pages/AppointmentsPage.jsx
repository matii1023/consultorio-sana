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
import WeekCalendar from '../components/appointments/WeekCalendar';
import RescheduleModal from '../components/appointments/RescheduleModal';
import MessagePreviewModal from '../components/appointments/MessagePreviewModal';
import { appointmentsApi } from '../api/appointments.api';
import { doctorsApi } from '../api/doctors.api';
import { patientsApi } from '../api/patients.api';
import { medicalRecordsApi } from '../api/medicalRecords.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { exportToExcel, formatDateTimeForExport } from '../utils/exportHelpers';
import { printAppointmentReceipt } from '../utils/appointmentReceipt';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();

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
  const [viewMode, setViewMode] = useState('list');

  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordAppointment, setRecordAppointment] = useState(null);
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

  // Preview de mensajes
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSending, setPreviewSending] = useState(false);
  const [previewAppointment, setPreviewAppointment] = useState(null);
  const [previewType, setPreviewType] = useState('ticket');

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
      const { data } = viewMode === 'week'
        ? await appointmentsApi.getWeek(selectedDate)
        : await appointmentsApi.getAll({ date: selectedDate });
      setAppointments(data);
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

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
      showToast('Error al generar comprobante', 'error');
    }
  };

  // ---- Preview y envío de WhatsApp ----

  const handleSendWhatsApp = async (appointment) => {
    if (!appointment.patient_phone) {
      showToast('El paciente no tiene teléfono registrado', 'error');
      return;
    }

    setPreviewType('ticket');
    setPreviewAppointment(appointment);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const { data } = await appointmentsApi.getTicketPreview(appointment.id);
      setPreviewData(data);
    } catch (err) {
      showToast('Error al generar la vista previa', 'error');
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendReminder = async (appointment) => {
    if (!appointment.patient_phone) {
      showToast('El paciente no tiene teléfono registrado', 'error');
      return;
    }

    setPreviewType('reminder');
    setPreviewAppointment(appointment);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const { data } = await appointmentsApi.getReminderPreview(appointment.id);
      setPreviewData(data);
    } catch (err) {
      showToast('Error al generar la vista previa', 'error');
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmSendMessage = async (editedBody) => {
    setPreviewSending(true);
    try {
      const { data } = await appointmentsApi.sendEditedMessage(
        previewData.phone,
        editedBody,
        previewAppointment?.id
      );

      if (data.success) {
        showToast(
          previewType === 'ticket'
            ? 'Turno enviado por WhatsApp'
            : 'Recordatorio enviado por WhatsApp',
          'success'
        );
        setPreviewModalOpen(false);
        setPreviewData(null);
        setPreviewAppointment(null);
      } else {
        throw new Error(data.message || 'Error al enviar');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error al enviar', 'error');
      throw err;
    } finally {
      setPreviewSending(false);
    }
  };

  // ---- Fin preview ----

  const handleSendBulkReminders = async () => {
    if (!window.confirm('¿Enviar recordatorios a todas las citas de mañana?')) return;
    try {
      showToast('Enviando recordatorios...', 'info');
      const { data } = await appointmentsApi.sendBulkReminders();
      showToast(`Recordatorios: ${data.sent} correctos, ${data.failed} fallidos`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al enviar recordatorios', 'error');
    }
  };

  const handleOpenReschedule = (appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (data) => {
    setSubmitting(true);
    try {
      await appointmentsApi.reschedule(rescheduleAppointment.id, data);
      setRescheduleModalOpen(false);
      setRescheduleAppointment(null);
      await loadAppointments();
      showToast('Cita reprogramada', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al reprogramar', 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDateFromCalendar = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleSelectAppointmentFromCalendar = (appointment) => {
    setSelectedDate(new Date(appointment.date_time).toISOString().slice(0, 10));
    setViewMode('list');
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
      { key: 'status', label: 'Estado' },
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
        {/* Toggle vista */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-sana-800">
            {viewMode === 'week' ? 'Vista semanal' : 'Vista de lista'}
          </h2>
          <div className="inline-flex rounded-xl bg-sana-50 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                ${viewMode === 'list' ? 'bg-white text-sana-700 shadow-sm' : 'text-sana-500'}`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                ${viewMode === 'week' ? 'bg-white text-sana-700 shadow-sm' : 'text-sana-500'}`}
            >
              📅 Semana
            </button>
          </div>
        </div>

        {/* Vista semanal */}
        {viewMode === 'week' && (
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeDate(-7)}
                className="text-sm text-sana-600 hover:bg-sana-50 px-3 py-1.5 rounded-xl transition"
              >
                ← Semana anterior
              </button>
              <p className="text-sm font-medium text-sana-700 capitalize">
                {formattedDate}
              </p>
              <button
                onClick={() => changeDate(7)}
                className="text-sm text-sana-600 hover:bg-sana-50 px-3 py-1.5 rounded-xl transition"
              >
                Semana siguiente →
              </button>
            </div>

            {loading ? (
              <Loader text="Cargando semana..." />
            ) : (
              <WeekCalendar
                appointments={filteredAppointments}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDateFromCalendar}
                onSelectAppointment={handleSelectAppointmentFromCalendar}
              />
            )}
          </Card>
        )}

        {/* Vista de lista */}
        {viewMode === 'list' && (
          <>
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
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={handleExportAppointments}>
                  📥 Exportar
                </Button>
                <Button variant="secondary" onClick={handleSendBulkReminders}>
                  🔔 Recordar mañana
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
                    onSendWhatsApp={handleSendWhatsApp}
                    onSendReminder={handleSendReminder}
                    onReschedule={handleOpenReschedule}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal nueva cita */}
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

      {/* Modal registro clínico */}
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

      {/* Modal reprogramar */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setRescheduleAppointment(null);
        }}
        title="Reprogramar cita"
        size="lg"
      >
        {rescheduleAppointment && (
          <RescheduleModal
            appointment={rescheduleAppointment}
            onSubmit={handleSaveReschedule}
            onCancel={() => {
              setRescheduleModalOpen(false);
              setRescheduleAppointment(null);
            }}
            loading={submitting}
          />
        )}
      </Modal>

      {/* Modal preview y edición de WhatsApp */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewData(null);
          setPreviewAppointment(null);
        }}
        title={previewType === 'ticket' ? '💬 Enviar turno' : '🔔 Enviar recordatorio'}
        size="lg"
      >
        <MessagePreviewModal
          previewData={previewData}
          loading={previewLoading}
          sending={previewSending}
          onConfirm={handleConfirmSendMessage}
          onCancel={() => {
            setPreviewModalOpen(false);
            setPreviewData(null);
            setPreviewAppointment(null);
          }}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default AppointmentsPage;