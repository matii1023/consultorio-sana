import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import PatientCard from '../components/patients/PatientCard';
import PatientForm from '../components/patients/PatientForm';
import { usePatients } from '../hooks/usePatients';
import { patientsApi } from '../api/patients.api';
import { exportToExcel, formatDateForExport } from '../utils/exportHelpers';

const PatientsPage = () => {
  const navigate = useNavigate();
  const { patients, loading, error, fetchPatients } = usePatients();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(window.__searchTimer);
    window.__searchTimer = setTimeout(() => fetchPatients(value), 300);
  };

  const handleCreate = () => {
    setEditingPatient(null);
    setModalOpen(true);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setModalOpen(true);
  };

  const handleViewPatient = (patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editingPatient) {
        await patientsApi.update(editingPatient.id, form);
      } else {
        await patientsApi.create(form);
      }
      setModalOpen(false);
      setEditingPatient(null);
      await fetchPatients(search);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPatient(null);
  };

const handleExportPatients = () => {
  if (patients.length === 0) {
    alert('No hay pacientes para exportar');
    return;
  }

  const columns = [
    { key: 'last_name', label: 'Apellido' },
    { key: 'first_name', label: 'Nombre' },
    { key: 'document_id', label: 'Documento' },
    { key: 'birth_date', label: 'Fecha de nacimiento', format: formatDateForExport },
    { key: 'gender', label: 'Género' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Dirección' },
    { key: 'emergency_contact', label: 'Contacto de emergencia' },
    {
      key: 'created_at',
      label: 'Fecha de alta',
      format: formatDateForExport,
    },
  ];

  exportToExcel(patients, columns, 'pacientes', 'Pacientes');
};


  return (
    <DashboardLayout>
      <Header
        title="Pacientes"
        subtitle={`${patients.length} paciente${patients.length !== 1 ? 's' : ''} registrado${patients.length !== 1 ? 's' : ''}`}
      />

      <div className="p-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar por nombre, documento o teléfono..."
              className="input-field pl-11"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sana-400">
              🔍
            </span>
          </div>
            <Button variant="secondary" onClick={handleExportPatients}>
    📥 Exportar
  </Button>
          <Button onClick={handleCreate}>+ Nuevo paciente</Button>
        </div>

        {loading && patients.length === 0 ? (
          <Card>
            <Loader text="Cargando pacientes..." />
          </Card>
        ) : error ? (
          <Card>
            <p className="text-red-500 text-center py-4">{error}</p>
          </Card>
        ) : patients.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                {search ? 'No se encontraron resultados' : 'Aún no hay pacientes'}
              </h3>
              <p className="text-sm text-sana-400 mb-6">
                {search
                  ? 'Prueba con otro término de búsqueda'
                  : 'Comienza registrando tu primer paciente'}
              </p>
              {!search && (
                <Button onClick={handleCreate}>+ Registrar primer paciente</Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={handleViewPatient}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingPatient ? 'Editar paciente' : 'Nuevo paciente'}
        size="lg"
      >
        <PatientForm
          initialData={editingPatient}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={submitting}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default PatientsPage;