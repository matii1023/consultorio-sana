import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { waitlistApi } from '../api/waitlist.api';
import { useToast } from '../context/ToastContext';

const WaitlistPage = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const { data } = await waitlistApi.getAll();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, []);

  const handleRemove = async (id) => {
    if (!window.confirm('¿Eliminar de la lista de espera?')) return;
    try {
      await waitlistApi.delete(id);
      await loadWaitlist();
      showToast('Entrada eliminada', 'success');
    } catch (err) {
      showToast('Error al eliminar', 'error');
    }
  };

  const priorityLabels = {
    HIGH: { label: 'Alta', color: 'bg-red-100 text-red-700' },
    NORMAL: { label: 'Normal', color: 'bg-sana-100 text-sana-700' },
    LOW: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  };

  return (
    <DashboardLayout>
      <Header
        title="Lista de espera"
        subtitle={`${entries.length} paciente${entries.length !== 1 ? 's' : ''} esperando`}
      />

      <div className="p-8">
        {loading ? (
          <Card><Loader text="Cargando lista..." /></Card>
        ) : entries.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">⏳</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                Lista vacía
              </h3>
              <p className="text-sm text-sana-400">
                Cuando un turno se cancele, podés agregar pacientes aquí para
                llamarlos cuando se libere un horario.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const priority = priorityLabels[entry.priority] || priorityLabels.NORMAL;
              return (
                <Card key={entry.id} className="border border-sana-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                                    flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {entry.patient_first_name?.[0]}{entry.patient_last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sana-800">
                          {entry.patient_first_name} {entry.patient_last_name}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-xs text-sana-400 mt-1">
                        📞 {entry.patient_phone}
                      </p>
                      {(entry.doctor_first_name || entry.specialty_name) && (
                        <p className="text-xs text-sana-500 mt-1">
                          {entry.doctor_first_name && `Dr. ${entry.doctor_first_name} ${entry.doctor_last_name}`}
                          {entry.doctor_first_name && entry.specialty_name && ' · '}
                          {entry.specialty_name}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-sana-400 italic mt-2">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WaitlistPage;