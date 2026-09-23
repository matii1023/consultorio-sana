import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import DoctorForm from '../components/doctors/DoctorForm';
import { doctorsApi } from '../api/doctors.api';
import { specialtiesApi } from '../api/specialties.api';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, specsRes] = await Promise.all([
        doctorsApi.getAll(),
        specialtiesApi.getAll(),
      ]);
      setDoctors(docsRes.data);
      setSpecialties(specsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (doctor) => {
    setEditing(doctor);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editing) {
        await doctorsApi.update(editing.id, form);
      } else {
        await doctorsApi.create(form);
      }
      setModalOpen(false);
      setEditing(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`¿Desactivar al Dr. ${doctor.first_name} ${doctor.last_name}?`)) return;
    try {
      await doctorsApi.delete(doctor.id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al desactivar');
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Médicos"
        subtitle={`${doctors.length} médico${doctors.length !== 1 ? 's' : ''} activo${doctors.length !== 1 ? 's' : ''}`}
      />

      <div className="p-8">
        <div className="flex justify-end mb-6">
          <Button onClick={handleCreate}>+ Nuevo médico</Button>
        </div>

        {loading ? (
          <Card><Loader text="Cargando médicos..." /></Card>
        ) : doctors.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👨‍⚕️</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                Aún no hay médicos registrados
              </h3>
              <p className="text-sm text-sana-400 mb-6">
                Registra al primer médico del consultorio
              </p>
              <Button onClick={handleCreate}>+ Registrar primer médico</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="hover:shadow-soft transition">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                                  flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {doctor.first_name?.[0]}{doctor.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sana-800 truncate">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </h3>
                    <span className="inline-block mt-1 text-xs bg-sana-100 text-sana-700 
                                     px-2 py-0.5 rounded-full">
                      {doctor.specialty_name}
                    </span>
                    <p className="text-xs text-sana-400 mt-2">
                      📋 Matrícula: {doctor.license_number}
                    </p>
                    {doctor.phone && (
                      <p className="text-xs text-sana-400">📞 {doctor.phone}</p>
                    )}
                    {doctor.consultation_fee && (
                      <p className="text-xs text-sana-500 mt-1 font-medium">
                        💰 ${doctor.consultation_fee}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-sana-100">
                  <button
                    onClick={() => handleEdit(doctor)}
                    className="text-xs font-medium text-sana-600 hover:bg-sana-50 px-3 py-1.5 rounded-lg transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(doctor)}
                    className="text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                  >
                    Desactivar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar médico' : 'Nuevo médico'}
        size="lg"
      >
        <DoctorForm
          initialData={editing}
          specialties={specialties}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={submitting}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default DoctorsPage;