import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { whatsappTemplatesApi } from '../api/whatsappTemplates.api';
import { useToast } from '../context/ToastContext';

const WhatsappTemplatesPage = () => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await whatsappTemplatesApi.getAll();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenEdit = (template) => {
    setEditing(template);
    setBody(template.body);
  };

  const handleSave = async () => {
    if (!body.trim()) {
      showToast('El mensaje no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await whatsappTemplatesApi.update(editing.key, { body });
      setEditing(null);
      await loadTemplates();
      showToast('Plantilla actualizada', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInsertVariable = (variable) => {
    setBody((prev) => prev + `{{${variable}}}`);
  };

  return (
    <DashboardLayout>
      <Header
        title="Plantillas de WhatsApp"
        subtitle="Editá los mensajes automáticos que envía el consultorio"
      />

      <div className="p-8">
        {loading ? (
          <Card><Loader text="Cargando plantillas..." /></Card>
        ) : (
          <div className="space-y-4">
            {templates.map((t) => (
              <Card key={t.id} className="border border-sana-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sana-800">{t.name}</h3>
                      <code className="text-[10px] px-2 py-0.5 rounded-full bg-sana-50 text-sana-500 font-mono">
                        {t.key}
                      </code>
                    </div>
                    {t.description && (
                      <p className="text-xs text-sana-400 mt-1">{t.description}</p>
                    )}
                    <div className="mt-3 p-3 rounded-xl bg-sana-50/50 border border-sana-100">
                      <pre className="text-xs text-sana-700 whitespace-pre-wrap font-sans line-clamp-4">
                        {t.body}
                      </pre>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="text-xs font-medium text-sana-600 hover:bg-sana-50 
                               px-3 py-1.5 rounded-lg border border-sana-200 transition flex-shrink-0"
                  >
                    ✏️ Editar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Editar: ${editing.name}` : ''}
        size="lg"
      >
        {editing && (
          <div className="space-y-4">
            {/* Variables disponibles */}
            {editing.variables && editing.variables.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide mb-2">
                  Variables disponibles (click para insertar)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {editing.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-sana-100 text-sana-700 
                                 hover:bg-sana-200 transition font-mono"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editor */}
            <div>
              <label className="label">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={18}
                className="input-field resize-none font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-sana-400 mt-1">
                {body.length} caracteres
              </p>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                👀 Vista previa (con datos de ejemplo)
              </p>
              <div className="p-3 rounded-lg bg-white border border-emerald-100">
                <pre className="text-xs text-sana-700 whitespace-pre-wrap font-sans">
                  {body
                    .replace(/\{\{patient_name\}\}/g, 'Juan')
                    .replace(/\{\{clinic_name\}\}/g, '+sana Consultorio')
                    .replace(/\{\{clinic_phone\}\}/g, '+54 9 263 458-9236')
                    .replace(/\{\{clinic_address\}\}/g, 'Av. Principal 123')
                    .replace(/\{\{doctor_name\}\}/g, 'Carlos García')
                    .replace(/\{\{specialty\}\}/g, 'Cardiología')
                    .replace(/\{\{date\}\}/g, 'Lunes 30 de Septiembre de 2026, 10:00')
                    .replace(/\{\{time\}\}/g, '10:00')
                    .replace(/\{\{duration\}\}/g, '30')
                    .replace(/\{\{reason\}\}/g, 'Chequeo general')
                    .replace(/\{\{confirm_link\}\}/g, 'https://sana.app/confirm/abc123')
                    .replace(/\{\{cancel_link\}\}/g, 'https://sana.app/cancel/def456')}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-sana-100">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default WhatsappTemplatesPage;