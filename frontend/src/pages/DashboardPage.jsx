import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../api/appointments.api';
import { patientsApi } from '../api/patients.api';
import { doctorsApi } from '../api/doctors.api';
import { specialtiesApi } from '../api/specialties.api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: [],
    yesterdayCount: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalSpecialties: 0,
    weekData: [],       // [{ date, label, count }]
    specialtiesData: [], // [{ name, count, percentage }]
    topSpecialties: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        // Cargar catálogos y citas del día en paralelo
        const [todayRes, yesterdayRes, patRes, docRes, specRes] = await Promise.all([
          appointmentsApi.getAll({ date: todayStr }),
          appointmentsApi.getAll({ date: yesterdayStr }),
          patientsApi.getAll(),
          doctorsApi.getAll(),
          specialtiesApi.getAll(),
        ]);

        // Cargar citas de los últimos 7 días (una consulta por día)
        const weekPromises = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          weekPromises.push(
            appointmentsApi.getAll({ date: d.toISOString().slice(0, 10) })
          );
        }
        const weekResults = await Promise.all(weekPromises);

        const weekData = weekResults.map((res, index) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - index));
          const dayLabel = d.toLocaleDateString('es-AR', { weekday: 'short' });
          return {
            date: d.toISOString().slice(0, 10),
            label: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
            count: res.data.length,
          };
        });

        // Calcular especialidades más solicitadas (semana)
        const specialtyCount = {};
        weekResults.forEach((res) => {
          res.data.forEach((appt) => {
            const name = appt.specialty_name || 'Sin especialidad';
            specialtyCount[name] = (specialtyCount[name] || 0) + 1;
          });
        });

        const totalWeek = Object.values(specialtyCount).reduce((a, b) => a + b, 0);
        const specialtiesData = Object.entries(specialtyCount)
          .map(([name, count]) => ({
            name,
            count,
            percentage: totalWeek > 0 ? Math.round((count / totalWeek) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);

        setStats({
          todayAppointments: todayRes.data,
          yesterdayCount: yesterdayRes.data.length,
          totalPatients: patRes.data.length,
          totalDoctors: docRes.data.length,
          totalSpecialties: specRes.data.length,
          weekData,
          specialtiesData,
          topSpecialties: specialtiesData.slice(0, 5),
        });
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN';
  const isSecretary = user?.role === 'SECRETARY';

  // Calcular diferencia vs ayer
  const todayCount = stats.todayAppointments.length;
  const diff = todayCount - stats.yesterdayCount;
  const diffLabel =
    diff === 0
      ? 'Igual que ayer'
      : diff > 0
      ? `+${diff} vs ayer`
      : `${diff} vs ayer`;
  const diffColor =
    diff === 0
      ? 'text-sana-400'
      : diff > 0
      ? 'text-emerald-600'
      : 'text-red-500';

  // Stats principales según rol
  const mainStats = isDoctor
    ? [
        { label: 'Citas hoy', value: todayCount, icon: '📅', color: 'from-sana-500 to-sana-700' },
        { label: 'Total pacientes', value: stats.totalPatients, icon: '👥', color: 'from-blue-500 to-blue-700' },
      ]
    : [
        { label: 'Citas hoy', value: todayCount, icon: '📅', color: 'from-sana-500 to-sana-700' },
        { label: 'Pacientes', value: stats.totalPatients, icon: '👥', color: 'from-blue-500 to-blue-700' },
        { label: 'Médicos', value: stats.totalDoctors, icon: '👨‍⚕️', color: 'from-emerald-500 to-emerald-700' },
        { label: 'Especialidades', value: stats.totalSpecialties, icon: '🩺', color: 'from-amber-500 to-amber-700' },
      ];

  // Altura máxima del gráfico semanal
  const maxWeekCount = Math.max(...stats.weekData.map((d) => d.count), 1);

  return (
    <DashboardLayout>
      <Header
        title="Inicio"
        subtitle={`Hola ${user?.first_name}, este es el resumen de hoy`}
      />

      <div className="p-8">
        {/* Bienvenida */}
        <Card className="mb-6 bg-gradient-to-r from-sana-500 to-sana-700 text-white border-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-light mb-1">
                Bienvenido, {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-sana-100 text-sm">
                {isDoctor
                  ? 'Este es tu panel de consultas del día'
                  : isAdmin
                  ? 'Panel de administración de +sana'
                  : 'Panel de recepción del consultorio'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-sana-100 uppercase tracking-widest">
                Hoy
              </p>
              <p className="text-lg font-light capitalize">
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats principales */}
        {loading ? (
          <Card className="mb-6"><Loader text="Cargando estadísticas..." /></Card>
        ) : (
          <>
            <div
              className={`grid grid-cols-2 ${
                isDoctor ? 'lg:grid-cols-2' : 'lg:grid-cols-4'
              } gap-4 mb-6`}
            >
              {mainStats.map((stat) => (
                <div
                  key={stat.label}
                  className="card hover:shadow-soft transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} 
                                  flex items-center justify-center text-white text-xl flex-shrink-0`}
                    >
                      {stat.icon}
                    </div>
                    {stat.label === 'Citas hoy' && (
                      <span className={`text-xs font-medium ${diffColor}`}>
                        {diffLabel}
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-semibold text-sana-800">
                      {stat.value}
                    </p>
                    <p className="text-xs text-sana-400 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Gráfico semanal */}
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-sana-800">
                      Citas de la semana
                    </h3>
                    <p className="text-xs text-sana-400">
                      Últimos 7 días
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-sana-700">
                      {stats.weekData.reduce((a, d) => a + d.count, 0)}
                    </p>
                    <p className="text-xs text-sana-400">total</p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 h-40">
                  {stats.weekData.map((day) => {
                    const height = maxWeekCount > 0 
                      ? Math.max((day.count / maxWeekCount) * 100, 4)
                      : 4;
                    const isToday =
                      day.date === new Date().toISOString().slice(0, 10);

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <span className="text-xs font-medium text-sana-600">
                          {day.count}
                        </span>
                        <div className="w-full h-full flex items-end">
                          <div
                            className={`w-full rounded-t-xl transition-all 
                              ${isToday 
                                ? 'bg-gradient-to-t from-sana-500 to-sana-400' 
                                : 'bg-gradient-to-t from-sana-300 to-sana-200'
                              }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs capitalize ${
                            isToday ? 'text-sana-700 font-semibold' : 'text-sana-400'
                          }`}
                        >
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Top especialidades */}
              <Card>
                <h3 className="text-lg font-semibold text-sana-800 mb-1">
                  Top especialidades
                </h3>
                <p className="text-xs text-sana-400 mb-4">
                  Últimos 7 días
                </p>

                {stats.topSpecialties.length === 0 ? (
                  <p className="text-sm text-sana-400 text-center py-8">
                    Sin datos aún
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.topSpecialties.map((spec) => (
                      <div key={spec.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-sana-700 truncate">
                            {spec.name}
                          </span>
                          <span className="text-xs font-medium text-sana-600 ml-2">
                            {spec.count} ({spec.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-sana-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sana-400 to-sana-600 rounded-full transition-all"
                            style={{ width: `${spec.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Citas del día */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-sana-800">
                    Citas de hoy
                  </h3>
                  <p className="text-xs text-sana-400">
                    {todayCount} cita{todayCount !== 1 ? 's' : ''} agendada{todayCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/appointments')}
                  className="text-sm text-sana-600 hover:text-sana-800 font-medium"
                >
                  Ver agenda completa →
                </button>
              </div>

              {todayCount === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-sm text-sana-400 mb-4">
                    No hay citas agendadas para hoy
                  </p>
                  {!isDoctor && (
                    <button
                      onClick={() => navigate('/appointments')}
                      className="btn-primary text-sm"
                    >
                      + Agendar cita
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.todayAppointments.slice(0, 8).map((appt) => {
                    const time = new Date(appt.date_time).toLocaleTimeString(
                      'es-AR',
                      { hour: '2-digit', minute: '2-digit' }
                    );
                    return (
                      <div
                        key={appt.id}
                        onClick={() => navigate('/appointments')}
                        className="flex items-center justify-between p-3 rounded-xl 
                                   hover:bg-sana-50 transition cursor-pointer border border-transparent
                                   hover:border-sana-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-sana-100 text-sana-700 rounded-lg px-3 py-1.5 
                                          font-semibold text-sm flex-shrink-0">
                            {time}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-sana-800 truncate">
                              {appt.patient_first_name} {appt.patient_last_name}
                            </p>
                            <p className="text-xs text-sana-400 truncate">
                              Dr. {appt.doctor_first_name} {appt.doctor_last_name} · {appt.specialty_name}
                            </p>
                          </div>
                        </div>
                        <Badge status={appt.status} />
                      </div>
                    );
                  })}
                  {todayCount > 8 && (
                    <button
                      onClick={() => navigate('/appointments')}
                      className="w-full text-xs text-sana-500 hover:text-sana-700 
                                 pt-3 border-t border-sana-100"
                    >
                      +{todayCount - 8} cita{todayCount - 8 !== 1 ? 's' : ''} más →
                    </button>
                  )}
                </div>
              )}
            </Card>

            {/* Accesos rápidos para secretaria */}
            {(isSecretary || isAdmin) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <button
                  onClick={() => navigate('/appointments')}
                  className="card hover:shadow-soft hover:border-sana-200 border border-transparent 
                             transition-all text-left group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform inline-block">
                    📅
                  </div>
                  <p className="text-sm font-semibold text-sana-800">Agendar cita</p>
                  <p className="text-xs text-sana-400 mt-0.5">Crear nueva cita</p>
                </button>

                <button
                  onClick={() => navigate('/patients')}
                  className="card hover:shadow-soft hover:border-sana-200 border border-transparent 
                             transition-all text-left group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform inline-block">
                    👥
                  </div>
                  <p className="text-sm font-semibold text-sana-800">Nuevo paciente</p>
                  <p className="text-xs text-sana-400 mt-0.5">Registrar paciente</p>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => navigate('/doctors')}
                    className="card hover:shadow-soft hover:border-sana-200 border border-transparent 
                               transition-all text-left group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform inline-block">
                      👨‍⚕️
                    </div>
                    <p className="text-sm font-semibold text-sana-800">Gestionar médicos</p>
                    <p className="text-xs text-sana-400 mt-0.5">Administrar equipo</p>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;