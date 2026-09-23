import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { backupApi } from '../api/backup.api';
import { useToast } from '../context/ToastContext';

const BackupsPage = () => {
  const { showToast } = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const { data } = await backupApi.list();
      setBackups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const { data } = await backupApi.create();
      showToast(`Backup creado: ${data.filename}`, 'success');
      await loadBackups();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al crear backup', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      await backupApi.download(filename);
      showToast('Descargando backup...', 'info');
    } catch (err) {
      showToast('Error al descargar backup', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <Header
        title="Backups"
        subtitle="Respaldos de la base de datos del consultorio"
      />

      <div className="p-8">
        {/* Card informativa */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-sana-50 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🛡️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-sana-800 mb-1">
                Respaldos automáticos diarios
              </h3>
              <p className="text-sm text-sana-600">
                El sistema realiza un backup automático todos los días a las 3:00 AM.
                Los archivos mayores a 30 días se eliminan automáticamente para ahorrar espacio.
              </p>
            </div>
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-sana-500">
            {backups.length} backup{backups.length !== 1 ? 's' : ''} disponible{backups.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={handleCreateBackup} disabled={creating}>
            {creating ? '⏳ Creando...' : '💾 Crear backup ahora'}
          </Button>
        </div>

        {/* Lista */}
        {loading ? (
          <Card><Loader text="Cargando backups..." /></Card>
        ) : backups.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                No hay backups
              </h3>
              <p className="text-sm text-sana-400 mb-6">
                Crea el primero ahora o espera al backup automático de las 3:00 AM
              </p>
              <Button onClick={handleCreateBackup}>+ Crear backup</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <Card key={backup.filename} className="border border-sana-100 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sana-100 text-sana-600 
                                    flex items-center justify-center text-lg flex-shrink-0">
                      💾
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-sana-800 truncate">
                        {backup.filename}
                      </p>
                      <p className="text-xs text-sana-400">
                        {formatDate(backup.createdAt)} · {formatSize(backup.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(backup.filename)}
                    className="text-xs font-medium text-sana-600 hover:bg-sana-50 
                               px-3 py-2 rounded-lg transition flex-shrink-0"
                  >
                    📥 Descargar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BackupsPage;