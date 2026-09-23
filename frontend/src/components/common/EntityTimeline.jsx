import Loader from './Loader';

const EntityTimeline = ({ logs, loading }) => {
  const actionConfig = {
    CREATE: { label: 'Creó', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: '➕' },
    UPDATE: { label: 'Actualizó', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: '✏️' },
    DELETE: { label: 'Eliminó', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: '🗑️' },
  };

  const entityLabels = {
    patient: 'Paciente',
    appointment: 'Cita',
    doctor: 'Médico',
    specialty: 'Especialidad',
    user: 'Usuario',
    medical_record: 'Registro clínico',
    prescription: 'Receta',
  };

  if (loading) {
    return <Loader text="Cargando historial..." />;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-sm text-sana-400">Sin movimientos registrados</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical de la timeline */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-sana-100" />

      <div className="space-y-4">
        {logs.map((log) => {
          const config = actionConfig[log.action] || {
            label: log.action,
            color: 'bg-gray-100 text-gray-700',
            dot: 'bg-gray-400',
            icon: '•',
          };

          const date = new Date(log.created_at).toLocaleString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={log.id} className="relative pl-12">
              {/* Punto de la timeline */}
              <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full ${config.dot} ring-4 ring-cream`} />

              <div className="p-3 rounded-xl bg-white border border-sana-100 hover:shadow-soft transition">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.color} font-medium`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-sana-500">
                        {entityLabels[log.entity] || log.entity}
                      </span>
                    </div>
                    <p className="text-sm text-sana-700 mt-1.5">
                      {log.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-sana-500">{date}</p>
                    {log.user_email && (
                      <p className="text-[10px] text-sana-400 mt-0.5 truncate max-w-[150px]">
                        {log.user_email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntityTimeline;