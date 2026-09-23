import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import SpecialtyForm from '../components/specialties/SpecialtyForm';
import { specialtiesApi } from '../api/specialties.api';

const SpecialtiesPage = () => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSpecialties = async () => {
    setLoading(true);
    try {
      const { data } = await specialtiesApi.getAll();
      setSpecialties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSpecialties(); }, []);

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (spec) => {
    setEditing(spec);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editing) {
        await specialtiesApi.update(editing.id, form);
      } else {
        await specialtiesApi.create(form);
      }
      setModalOpen(false);
      setEditing(null);
      await loadSpecialties();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (spec) => {
    if (!window.confirm(`¿Desactivar la especialidad "${spec.name}"?`)) return;
    try {
      await specialtiesApi.delete(spec.id);
      await loadSpecialties();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al desactivar');
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Especialidades"
        subtitle={`${specialties.length} especialidad${specialties.length !== 1 ? 'es' : ''} activa${specialties.length !== 1 ? 's' : ''}`}
      />

      <div className="p-8">
        <div className="flex justify-end mb-6">
          <Button onClick={handleCreate}>+ Nueva especialidad</Button>
        </div>

        {loading ? (
          <Card><Loader text="Cargando especialidades..." /></Card>
        ) : specialties.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🩺</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                Aún no hay especialidades
              </h3>
              <p className="text-sm text-sana-400 mb-6">
                Crea las especialidades médicas que ofrecerá el consultorio
              </p>
              <Button onClick={handleCreate}>+ Crear primera especialidad</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialties.map((spec) => (
              <Card key={spec.id} className="hover:shadow-soft transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sana-100 flex items-center 
                                  justify-center text-sana-600 text-lg flex-shrink-0">
                    🩺
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sana-800">{spec.name}</h3>
                    {spec.description && (
                      <p className="text-xs text-sana-400 mt-1 line-clamp-2">
                        {spec.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-sana-100">
                  <button
                    onClick={() => handleEdit(spec)}
                    className="text-xs font-medium text-sana-600 hover:bg-sana-50 px-3 py-1.5 rounded-lg transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(spec)}
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
        title={editing ? 'Editar especialidad' : 'Nueva especialidad'}
      >
        <SpecialtyForm
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={submitting}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default SpecialtiesPage;