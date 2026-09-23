import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import MedicalRecordForm from '../components/medicalRecords/MedicalRecordForm';
import MedicalRecordCard from '../components/medicalRecords/MedicalRecordCard';
import PrescriptionModal from '../components/medicalRecords/PrescriptionModal';
import PrescriptionCard from '../components/medicalRecords/PrescriptionCard';
import EntityTimeline from '../components/common/EntityTimeline';
import { patientsApi } from '../api/patients.api';
import { medicalRecordsApi } from '../api/medicalRecords.api';
import { prescriptionsApi } from '../api/prescriptions.api';
import { auditApi } from '../api/audit.api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { downloadPrescription } from '../utils/prescriptionGenerator';
import { formatAge, formatDate } from '../utils/dateHelpers';

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();

  const clinicInfo = {
    name: settings.clinic_name,
    address: settings.clinic_address,
    phone: settings.clinic_phone,
  };

  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('info');

  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionRecord, setPrescriptionRecord] = useState(null);
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patRes, histRes, prescRes] = await Promise.all([
        patientsApi.getById(id),
        patientsApi.getHistory(id),
        prescriptionsApi.getPatientPrescriptions(id),
      ]);
      setPatient(patRes.data);
      setHistory(histRes.data);
      setPrescriptions(prescRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Cargar auditoría solo cuando se abre la pestaña (lazy loading)
  useEffect(() => {
    if (tab === 'audit' && auditLogs.length === 0 && !auditLoading) {
      const loadAudit = async () => {
        setAuditLoading(true);
        try {
          const { data } = await auditApi.getEntityHistory('patient', id);
          setAuditLogs(data);
        } catch (err) {
          console.error('Error cargando auditoría:', err);
        } finally {
          setAuditLoading(false);
        }
      };
      loadAudit();
    }
  }, [tab, id, auditLogs.length, auditLoading]);

  const handleCreateRecord = async (form) => {
    setSubmitting(true);
    try {
      await medicalRecordsApi.create(form);
      setModalOpen(false);
      await loadData();
      setTab('history');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPrescription = (record) => {
    setPrescriptionRecord(record);
    setPrescriptionModalOpen(true);
  };

  const handleGeneratePrescription = async (data) => {
    setPrescriptionSubmitting(true);
    try {
      await prescriptionsApi.create({
        patient_id: data.patient.id,
        medical_record_id: prescriptionRecord?.id || null,
        diagnosis: data.diagnosis,
        medications: data.medications,
        instructions: data.instructions,
      });

      const doctor = {
        first_name: prescriptionRecord?.doctor_first_name || user?.first_name || '',
        last_name: prescriptionRecord?.doctor_last_name || user?.last_name || '',
        license_number: '',
      };

      downloadPrescription({
        patient: data.patient,
        doctor: doctor,
        specialty: prescriptionRecord?.specialty_name || '',
        medications: data.medications,
        instructions: data.instructions,
        diagnosis: data.diagnosis,
        clinicInfo: clinicInfo,
      });

      setPrescriptionModalOpen(false);
      setPrescriptionRecord(null);
      await loadData();
      setTab('prescriptions');
    } finally {
      setPrescriptionSubmitting(false);
    }
  };

  const handleReprintPrescription = (prescription) => {
    downloadPrescription({
      patient: patient,
      doctor: {
        first_name: prescription.doctor_first_name,
        last_name: prescription.doctor_last_name,
        license_number: '',
      },
      specialty: prescription.specialty_name,
      medications: prescription.medications,
      instructions: prescription.instructions,
      diagnosis: prescription.diagnosis,
      clinicInfo: clinicInfo,
      prescriptionDate: new Date(prescription.created_at),
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Header title="Cargando paciente..." />
        <div className="p-8">
          <Card>
            <Loader text="Cargando información..." />
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <Header title="Paciente no encontrado" />
        <div className="p-8">
          <Card>
            <div className="text-center py-8">
              <p className="text-sana-500 mb-4">
                Este paciente no existe o fue eliminado
              </p>
              <Button onClick={() => navigate('/patients')}>
                Volver a pacientes
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const ageLabel = formatAge(patient.birth_date);
  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`;
  const canCreateRecord = user?.role === 'DOCTOR';

  return (
    <DashboardLayout>
      <Header
        title={`${patient.first_name} ${patient.last_name}`}
        subtitle={`Paciente desde ${formatDate(patient.created_at)}`}
      />

      <div className="p-8">
        <button
          onClick={() => navigate('/patients')}
          className="text-sm text-sana-500 hover:text-sana-700 mb-4 flex items-center gap-1"
        >
          ← Volver a pacientes
        </button>

        <Card className="mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                            flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-sana-800">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-sm text-sana-500 mt-1">
                {ageLabel} · {patient.gender?.toLowerCase()}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <span className="text-sana-600 flex items-center gap-1">
                  📄 {patient.document_id}
                </span>
                <span className="text-sana-600 flex items-center gap-1">
                  📞 {patient.phone}
                </span>
                {patient.email && (
                  <span className="text-sana-600 flex items-center gap-1">
                    ✉️ {patient.email}
                  </span>
                )}
              </div>
              {patient.emergency_contact && (
                <p className="text-xs text-red-500 mt-3">
                  🚨 Emergencia: {patient.emergency_contact}
                </p>
              )}
            </div>
            {canCreateRecord && (
              <Button onClick={() => setModalOpen(true)}>
                + Nuevo registro clínico
              </Button>
            )}
          </div>
        </Card>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setTab('info')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${
                tab === 'info'
                  ? 'bg-sana-500 text-white shadow-soft'
                  : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            Información
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${
                tab === 'history'
                  ? 'bg-sana-500 text-white shadow-soft'
                  : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            Historia clínica ({history.length})
          </button>
          <button
            onClick={() => setTab('prescriptions')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${
                tab === 'prescriptions'
                  ? 'bg-sana-500 text-white shadow-soft'
                  : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            💊 Recetas ({prescriptions.length})
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${
                tab === 'audit'
                  ? 'bg-sana-500 text-white shadow-soft'
                  : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            📜 Historial de cambios
          </button>
        </div>

        {tab === 'info' && (
          <Card>
            <h3 className="text-lg font-semibold text-sana-800 mb-4">
              Datos personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-sana-400 uppercase tracking-wide">
                  Documento
                </p>
                <p className="text-sm text-sana-700 mt-1">{patient.document_id}</p>
              </div>
              <div>
                <p className="text-xs text-sana-400 uppercase tracking-wide">
                  Fecha de nacimiento
                </p>
                <p className="text-sm text-sana-700 mt-1">
                  {formatDate(patient.birth_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-sana-400 uppercase tracking-wide">
                  Edad
                </p>
                <p className="text-sm text-sana-700 mt-1">{ageLabel}</p>
              </div>
              <div>
                <p className="text-xs text-sana-400 uppercase tracking-wide">
                  Género
                </p>
                <p className="text-sm text-sana-700 mt-1 capitalize">
                  {patient.gender?.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-sana-400 uppercase tracking-wide">
                  Teléfono
                </p>
                <p className="text-sm text-sana-700 mt-1">{patient.phone}</p>
              </div>
              {patient.email && (
                <div>
                  <p className="text-xs text-sana-400 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm text-sana-700 mt-1">{patient.email}</p>
                </div>
              )}
              {patient.address && (
                <div>
                  <p className="text-xs text-sana-400 uppercase tracking-wide">
                    Dirección
                  </p>
                  <p className="text-sm text-sana-700 mt-1">{patient.address}</p>
                </div>
              )}
              {patient.emergency_contact && (
                <div className="md:col-span-2">
                  <p className="text-xs text-sana-400 uppercase tracking-wide">
                    Contacto de emergencia
                  </p>
                  <p className="text-sm text-sana-700 mt-1">
                    {patient.emergency_contact}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {tab === 'history' &&
          (history.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-sana-700 mb-2">
                  Sin registros clínicos
                </h3>
                <p className="text-sm text-sana-400 mb-6">
                  Este paciente aún no tiene consultas registradas
                </p>
                {canCreateRecord && (
                  <Button onClick={() => setModalOpen(true)}>
                    + Crear primer registro
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <MedicalRecordCard
                  key={record.id}
                  record={record}
                  onPrescribe={canCreateRecord ? handleOpenPrescription : null}
                />
              ))}
            </div>
          ))}

        {tab === 'prescriptions' &&
          (prescriptions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💊</div>
                <h3 className="text-lg font-semibold text-sana-700 mb-2">
                  Sin recetas emitidas
                </h3>
                <p className="text-sm text-sana-400 mb-6">
                  Este paciente no tiene recetas registradas
                </p>
                {canCreateRecord && history.length > 0 && (
                  <p className="text-xs text-sana-400">
                    Ve a la pestaña "Historia clínica" y genera una receta desde un registro
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((presc) => (
                <PrescriptionCard
                  key={presc.id}
                  prescription={presc}
                  onReprint={() => handleReprintPrescription(presc)}
                />
              ))}
            </div>
          ))}

        {tab === 'audit' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-sana-800">
                  Historial de cambios
                </h3>
                <p className="text-xs text-sana-400 mt-0.5">
                  Todos los movimientos registrados de este paciente
                </p>
              </div>
              <span className="text-xs text-sana-400 bg-sana-50 px-3 py-1 rounded-full">
                {auditLogs.length} evento{auditLogs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <EntityTimeline logs={auditLogs} loading={auditLoading} />
          </Card>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo registro clínico"
        size="lg"
      >
        <MedicalRecordForm
          patient={patient}
          onSubmit={handleCreateRecord}
          onCancel={() => setModalOpen(false)}
          loading={submitting}
        />
      </Modal>

      <Modal
        isOpen={prescriptionModalOpen}
        onClose={() => {
          setPrescriptionModalOpen(false);
          setPrescriptionRecord(null);
        }}
        title="Generar receta médica"
        size="lg"
      >
        {prescriptionRecord && (
          <PrescriptionModal
            patient={patient}
            doctor={{
              first_name: prescriptionRecord.doctor_first_name,
              last_name: prescriptionRecord.doctor_last_name,
              license_number: '',
            }}
            specialty={prescriptionRecord.specialty_name}
            initialDiagnosis={prescriptionRecord.diagnosis}
            onSubmit={handleGeneratePrescription}
            onCancel={() => {
              setPrescriptionModalOpen(false);
              setPrescriptionRecord(null);
            }}
            loading={prescriptionSubmitting}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default PatientDetailPage;