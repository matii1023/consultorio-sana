import { useState, useEffect } from 'react';
import Card from '../common/Card';
import Loader from '../common/Loader';
import { appointmentsApi } from '../../api/appointments.api';

const AttendanceStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // días

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const to = new Date().toISOString().slice(0, 10);
        const from = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const { data } = await appointmentsApi.getStats(from, to);
        setStats(data);
      } catch (err) {
        console.error('Error cargando stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [period]);

  if (loading) {
    return (
      <Card>
        <Loader text="Cargando estadísticas..." />
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <p className="text-center text-sana-400 py-4">Sin datos</p>
      </Card>
    );
  }

  // Datos para el gráfico de barras horizontal
  const statusBreakdown = [
    { label: 'Completadas', value: stats.completed, color: 'bg-emerald-500' },
    { label: 'Confirmadas', value: stats.confirmed, color: 'bg-sana-500' },
    { label: 'Pendientes', value: stats.pending, color: 'bg-amber-500' },
    { label: 'Canceladas', value: stats.cancelled, color: 'bg-red-500' },
    { label: 'No asistió', value: stats.noShow, color: 'bg-gray-500' },
  ].filter((item) => item.value > 0);

  const maxValue = Math.max(...statusBreakdown.map((s) => s.value), 1);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-sana-800">
            Tasa de asistencia
          </h3>
          <p className="text-xs text-sana-400 mt-0.5">
            Últimos {period} días
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs border border-sana-200 rounded-lg px-3 py-1.5 
                     bg-white text-sana-700 focus:outline-none focus:border-sana-500"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
      </div>

      {/* Cards de KPIs principales */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-3xl font-semibold text-emerald-700">
            {stats.attendanceRate}%
          </p>
          <p className="text-xs text-emerald-600 mt-1">Asistencia</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-sana-50 border border-sana-100">
          <p className="text-3xl font-semibold text-sana-700">
            {stats.confirmationRate}%
          </p>
          <p className="text-xs text-sana-600 mt-1">Confirmación</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-red-50 border border-red-100">
          <p className="text-3xl font-semibold text-red-700">
            {stats.noShowRate}%
          </p>
          <p className="text-xs text-red-600 mt-1">No-shows</p>
        </div>
      </div>

      {/* Gráfico de estados */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-sana-500 uppercase tracking-wide">
          Distribución de estados
        </p>
        {statusBreakdown.map((item) => {
          const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
          const width = (item.value / maxValue) * 100;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-sana-700">{item.label}</span>
                <span className="text-xs text-sana-500 font-medium">
                  {item.value} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-sana-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-sana-100 flex items-center justify-between">
        <span className="text-sm text-sana-500">Total en el período</span>
        <span className="text-lg font-semibold text-sana-800">
          {stats.total} citas
        </span>
      </div>
    </Card>
  );
};

export default AttendanceStats;