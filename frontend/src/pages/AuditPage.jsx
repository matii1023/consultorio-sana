import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { auditApi } from '../api/audit.api';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await auditApi.getAll({
        entity: filterEntity,
        action: filterAction,
        limit: 200,
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterEntity, filterAction]);

  const actionConfig = {
    CREATE: { label: 'Creó', color: 'bg-emerald-100 text-emerald-700', icon: '➕' },
    UPDATE: { label: 'Actualizó', color: 'bg-blue-100 text-blue-700', icon: '✏️' },
    DELETE: { label: 'Eliminó', color: 'bg-red-100 text-red-700', icon: '🗑️' },
  };

  const entityLabels = {
    patient: 'Paciente',
    appointment: 'Cita',
    doctor: 'Médico',
    specialty: 'Especialidad',
    user: 'Usuario',
    medical_record: 'Historia clínica',
  };

  return (
    <DashboardLayout>
      <Header
        title="Auditoría"
        subtitle={`${logs.length} evento${logs.length !== 1 ? 's' : ''} registrado${logs.length !== 1 ? 's' : ''}`}
      />

      <div className="p-8">
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">Todas las entidades</option>
              <option value="patient">Pacientes</option>
              <option value="appointment">Citas</option>
              <option value="doctor">Médicos</option>
              <option value="specialty">Especialidades</option>
              <option value="user">Usuarios</option>
              <option value="medical_record">Historia clínica</option>
            </select>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Creaciones</option>
              <option value="UPDATE">Actualizaciones</option>
              <option value="DELETE">Eliminaciones</option>
            </select>
          </div>
        </Card>

        {loading ? (
          <Card><Loader text="Cargando auditoría..." /></Card>
        ) : logs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📜</div>
              <p className="text-sm text-sana-400">No hay eventos registrados</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const action = actionConfig[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700', icon: '•' };
              const date = new Date(log.created_at).toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card key={log.id} className="border border-sana-100 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${action.color}`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm text-sana-800">
                            <span className="font-semibold">{log.user_email || 'Sistema'}</span>
                            {' '}
                            <span className={`${action.color} px-2 py-0.5 rounded-full text-xs`}>{action.label}</span>
                            {' '}
                            <span className="text-sana-500">{entityLabels[log.entity] || log.entity}</span>
                          </p>
                          <p className="text-xs text-sana-400 mt-0.5">{log.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-sana-500">{date}</p>
                          {log.ip_address && (
                            <p className="text-[10px] text-sana-300">{log.ip_address}</p>
                          )}
                        </div>
                      </div>
                    </div>
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

export default AuditPage;