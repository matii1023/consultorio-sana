import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      showToast('Configuración guardada correctamente', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Configuración"
        subtitle="Datos del consultorio que aparecen en los PDFs e informes"
      />

      <div className="p-8 max-w-3xl">
        <Card>
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-sana-800 mb-4">
              Datos del consultorio
            </h3>

            <Input
              label="Nombre del consultorio"
              name="clinic_name"
              value={form.clinic_name || ''}
              onChange={handleChange}
              placeholder="+sana Consultorio Médico"
            />

            <Input
              label="Dirección"
              name="clinic_address"
              value={form.clinic_address || ''}
              onChange={handleChange}
              placeholder="Av. Principal 123, Ciudad"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                name="clinic_phone"
                value={form.clinic_phone || ''}
                onChange={handleChange}
                placeholder="+5491123456789"
              />
              <Input
                label="Email"
                name="clinic_email"
                type="email"
                value={form.clinic_email || ''}
                onChange={handleChange}
                placeholder="contacto@consultorio.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sitio web"
                name="clinic_website"
                value={form.clinic_website || ''}
                onChange={handleChange}
                placeholder="www.consultorio.com"
              />
              <Input
                label="CUIT / RUT / RFC"
                name="clinic_tax_id"
                value={form.clinic_tax_id || ''}
                onChange={handleChange}
                placeholder="30-12345678-9"
              />
            </div>

            <Input
              label="URL del logo (opcional)"
              name="logo_url"
              value={form.logo_url || ''}
              onChange={handleChange}
              placeholder="https://tu-dominio.com/logo.png"
            />

            <div className="p-3 rounded-xl bg-sana-50 border border-sana-100 text-xs text-sana-600 mt-4">
              💡 Estos datos aparecen automáticamente en las recetas, comprobantes
              de cita, historias clínicas y reportes en PDF.
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-sana-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm(settings)}
              >
                Descartar cambios
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;