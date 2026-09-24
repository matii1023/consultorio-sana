import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Loader from '../common/Loader';

const MessagePreviewModal = ({
  previewData,
  loading,
  onConfirm,
  onCancel,
  sending,
}) => {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (previewData) {
      setBody(previewData.body);
    }
  }, [previewData]);

  const handleSubmit = async () => {
    setError('');
    if (!body.trim()) {
      setError('El mensaje no puede estar vacío');
      return;
    }
    try {
      await onConfirm(body);
    } catch (err) {
      setError(err.message || 'Error al enviar');
    }
  };

  if (loading || !previewData) {
    return <Loader text="Cargando mensaje..." />;
  }

  return (
    <div className="space-y-4">
      {/* Destinatario */}
      <div className="p-3 rounded-xl bg-sana-50 border border-sana-100">
        <p className="text-xs text-sana-500 uppercase tracking-wide mb-1">
          Para
        </p>
        <p className="font-semibold text-sana-800">
          {previewData.patient_name}
        </p>
        <p className="text-xs text-sana-400 mt-0.5">
          📱 {previewData.phone}
        </p>
      </div>

      {/* Editor del mensaje */}
      <div>
        <label className="label">
          Mensaje (podés editarlo antes de enviar)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className="input-field resize-none font-mono text-sm leading-relaxed"
        />
        <p className="text-xs text-sana-400 mt-1">
          {body.length} caracteres
        </p>
      </div>

      {/* Vista previa de WhatsApp */}
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
          👀 Vista previa
        </p>
        <div className="p-3 rounded-xl bg-white border border-emerald-100 max-w-md">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 
                            flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              +s
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-emerald-50 rounded-2xl rounded-tl-sm px-3 py-2">
                <pre className="text-xs text-sana-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {body}
                </pre>
              </div>
              <p className="text-[10px] text-sana-400 mt-1 text-right">
                Ahora ✓✓
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-sana-100">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={sending}>
          {sending ? 'Enviando...' : '📤 Enviar mensaje'}
        </Button>
      </div>
    </div>
  );
};

export default MessagePreviewModal;