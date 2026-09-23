import { formatAge } from '../../utils/dateHelpers';

const PatientCard = ({ patient, onClick, onEdit }) => {
  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`;

  return (
    <div
      onClick={() => onClick?.(patient)}
      className="card cursor-pointer hover:shadow-lg hover:border-sana-200 
                 border border-transparent transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                        flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
          {initials}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sana-800 truncate">
            {patient.first_name} {patient.last_name}
          </h3>
          <p className="text-xs text-sana-400 mt-0.5">
            Doc: {patient.document_id} · {formatAge(patient.birth_date)}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-sana-500 flex items-center gap-1">
              📞 {patient.phone}
            </span>
            {patient.email && (
              <span className="text-xs text-sana-500 flex items-center gap-1 truncate">
                ✉️ {patient.email}
              </span>
            )}
          </div>
        </div>

        {/* Botón de edición */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(patient);
          }}
          className="w-8 h-8 rounded-lg hover:bg-sana-50 text-sana-500 
                     flex items-center justify-center transition flex-shrink-0"
          title="Editar paciente"
        >
          ✏️
        </button>
      </div>
    </div>
  );
};

export default PatientCard;