const PrescriptionCard = ({ prescription, onReprint }) => {
  const date = new Date(prescription.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = new Date(prescription.created_at).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="card border border-sana-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-sana-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sana-100 flex items-center justify-center text-sana-600 flex-shrink-0">
            💊
          </div>
          <div>
            <p className="text-sm font-semibold text-sana-800 capitalize">{date}</p>
            <p className="text-xs text-sana-400">
              {time} · Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
            </p>
            {prescription.specialty_name && (
              <span className="inline-block mt-1 text-[10px] bg-sana-50 text-sana-600 px-2 py-0.5 rounded-full">
                {prescription.specialty_name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onReprint}
          className="text-xs font-medium text-sana-600 hover:bg-sana-50 
                     px-3 py-1.5 rounded-lg border border-sana-200 transition"
          title="Descargar nuevamente"
        >
          📥 Reimprimir
        </button>
      </div>

      {/* Diagnóstico */}
      {prescription.diagnosis && (
        <div className="py-3 border-b border-sana-100">
          <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-1">
            Diagnóstico
          </p>
          <p className="text-sm text-sana-700">{prescription.diagnosis}</p>
        </div>
      )}

      {/* Medicamentos */}
      <div className="py-3">
        <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-2">
          Medicamentos ({prescription.medications?.length || 0})
        </p>
        <div className="space-y-2">
          {(prescription.medications || []).map((med, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-sana-50 border border-sana-100">
              <p className="text-sm font-medium text-sana-800">
                {idx + 1}. {med.name}
              </p>
              <p className="text-xs text-sana-500 mt-0.5">
                {[
                  med.dose && `Dosis: ${med.dose}`,
                  med.frequency && `Frecuencia: ${med.frequency}`,
                  med.duration && `Duración: ${med.duration}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {med.notes && (
                <p className="text-xs text-sana-400 italic mt-1">{med.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Indicaciones */}
      {prescription.instructions && (
        <div className="pt-3 border-t border-sana-100">
          <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-1">
            Indicaciones
          </p>
          <p className="text-sm text-sana-600 whitespace-pre-line">
            {prescription.instructions}
          </p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;