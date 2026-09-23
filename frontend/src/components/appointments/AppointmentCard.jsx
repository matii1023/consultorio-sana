import Badge from '../common/Badge';

const AppointmentCard = ({
  appointment,
  onStatusChange,
  onRegisterConsultation,
  onPrintReceipt,
}) => {
  const time = new Date(appointment.date_time).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusActions = {
    PENDING: [
      { label: 'Confirmar', status: 'CONFIRMED', color: 'text-emerald-600 hover:bg-emerald-50' },
      { label: 'Cancelar',  status: 'CANCELLED', color: 'text-red-500 hover:bg-red-50' },
    ],
    CONFIRMED: [
      { label: 'Iniciar',    status: 'IN_PROGRESS', color: 'text-blue-600 hover:bg-blue-50' },
      { label: 'No asistió', status: 'NO_SHOW',     color: 'text-gray-500 hover:bg-gray-100' },
    ],
    IN_PROGRESS: [
      { label: 'Completar',  status: 'COMPLETED',   color: 'text-sana-600 hover:bg-sana-50' },
    ],
  };

  const actions = statusActions[appointment.status] || [];
  const canRegister = appointment.status === 'IN_PROGRESS' || appointment.status === 'COMPLETED';

  return (
    <div className="card border border-sana-100 hover:shadow-soft transition-all">
      <div className="flex items-start gap-4">
        {/* Hora */}
        <div className="flex flex-col items-center justify-center bg-sana-50 
                        rounded-xl px-3 py-2 min-w-[70px]">
          <span className="text-lg font-semibold text-sana-700">{time}</span>
          <span className="text-[10px] text-sana-400 uppercase tracking-wide">
            {appointment.duration} min
          </span>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sana-800 truncate">
                {appointment.patient_first_name} {appointment.patient_last_name}
              </h3>
              <p className="text-xs text-sana-400 mt-0.5">
                📞 {appointment.patient_phone}
              </p>
            </div>
            <Badge status={appointment.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-sana-500">
            <span className="flex items-center gap-1">
              👨‍⚕️ Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
            </span>
            <span className="flex items-center gap-1">
              🩺 {appointment.specialty_name}
            </span>
          </div>

          {appointment.reason && (
            <p className="text-xs text-sana-400 mt-2 italic truncate">
              "{appointment.reason}"
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-sana-100">
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => onStatusChange?.(appointment.id, action.status)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg 
                        transition-colors ${action.color}`}
          >
            {action.label}
          </button>
        ))}

        {onPrintReceipt && (
          <button
            onClick={() => onPrintReceipt(appointment)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg 
                       text-sana-600 hover:bg-sana-50 transition-colors
                       border border-sana-200"
            title="Imprimir comprobante"
          >
            🖨️ Comprobante
          </button>
        )}

        {canRegister && (
          <button
            onClick={() => onRegisterConsultation?.(appointment)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-sana-500 text-white
                       hover:bg-sana-600 transition-colors ml-auto"
          >
            📝 Registrar consulta
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;