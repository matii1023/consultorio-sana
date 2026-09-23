const MedicalRecordCard = ({ record, onPrescribe }) => {
  const date = new Date(record.date_time_consult || record.created_at).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = new Date(record.date_time_consult || record.created_at).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const vitals = record.vitals || {};

  return (
    <div className="card border border-sana-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-sana-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sana-100 flex items-center justify-center text-sana-600 flex-shrink-0">
            📋
          </div>
          <div>
            <p className="text-sm font-semibold text-sana-800 capitalize">{date}</p>
            <p className="text-xs text-sana-400">
              {time} · Dr. {record.doctor_first_name} {record.doctor_last_name}
            </p>
            {record.specialty_name && (
              <span className="inline-block mt-1 text-[10px] bg-sana-50 text-sana-600 px-2 py-0.5 rounded-full">
                {record.specialty_name}
              </span>
            )}
          </div>
        </div>

        {onPrescribe && (
          <button
            onClick={() => onPrescribe(record)}
            className="text-xs font-medium text-sana-600 hover:bg-sana-50 
                       px-3 py-1.5 rounded-lg border border-sana-200 transition
                       flex items-center gap-1"
            title="Generar receta médica"
          >
            💊 Receta
          </button>
        )}
      </div>

      {/* Signos vitales */}
      {Object.keys(vitals).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-4 border-b border-sana-100">
          {vitals.presion && (
            <div className="text-xs">
              <span className="text-sana-400">Presión:</span>{' '}
              <span className="font-medium text-sana-700">{vitals.presion} mmHg</span>
            </div>
          )}
          {vitals.peso && (
            <div className="text-xs">
              <span className="text-sana-400">Peso:</span>{' '}
              <span className="font-medium text-sana-700">{vitals.peso} kg</span>
            </div>
          )}
          {vitals.altura && (
            <div className="text-xs">
              <span className="text-sana-400">Altura:</span>{' '}
              <span className="font-medium text-sana-700">{vitals.altura} cm</span>
            </div>
          )}
          {vitals.temperatura && (
            <div className="text-xs">
              <span className="text-sana-400">Temp:</span>{' '}
              <span className="font-medium text-sana-700">{vitals.temperatura} °C</span>
            </div>
          )}
          {vitals.frecuencia_cardiaca && (
            <div className="text-xs">
              <span className="text-sana-400">Frec. cardíaca:</span>{' '}
              <span className="font-medium text-sana-700">{vitals.frecuencia_cardiaca} lpm</span>
            </div>
          )}
        </div>
      )}

      {/* Contenido */}
      <div className="space-y-3 py-4">
        <div>
          <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-1">
            Síntomas
          </p>
          <p className="text-sm text-sana-700">{record.symptoms}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-1">
            Diagnóstico
          </p>
          <p className="text-sm text-sana-700">{record.diagnosis}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-1">
            Tratamiento
          </p>
          <p className="text-sm text-sana-700 whitespace-pre-line">{record.treatment}</p>
        </div>

        {record.notes && (
          <div>
            <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-1">
              Notas
            </p>
            <p className="text-sm text-sana-500 italic">{record.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordCard;