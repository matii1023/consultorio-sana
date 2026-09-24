import { useMemo } from 'react';

const WeekCalendar = ({ appointments, selectedDate, onSelectDate, onSelectAppointment }) => {
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = current.getDay();
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const appointmentsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach((day) => {
      const key = day.toISOString().slice(0, 10);
      grouped[key] = [];
    });

    appointments.forEach((appt) => {
      const key = new Date(appt.date_time).toISOString().slice(0, 10);
      if (grouped[key]) grouped[key].push(appt);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    });

    return grouped;
  }, [appointments, weekDays]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-sana-100 text-sana-800 border-sana-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200 line-through',
    NO_SHOW: 'bg-gray-200 text-gray-600 border-gray-300',
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, index) => {
        const dayStr = day.toISOString().slice(0, 10);
        const isToday = dayStr === todayStr;
        const isSelected = dayStr === selectedDate;
        const dayAppointments = appointmentsByDay[dayStr] || [];

        return (
          <div
            key={dayStr}
            className={`rounded-2xl border transition-all overflow-hidden
              ${isSelected
                ? 'border-sana-500 bg-sana-50/50 shadow-soft'
                : 'border-sana-100 bg-white hover:border-sana-300'
              }`}
          >
            <button
              onClick={() => onSelectDate(dayStr)}
              className={`w-full px-2 py-3 text-center transition
                ${isSelected
                  ? 'bg-sana-500 text-white'
                  : isToday
                  ? 'bg-sana-100 text-sana-800'
                  : 'bg-white text-sana-700 hover:bg-sana-50'
                }`}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-75">
                {dayNames[index]}
              </p>
              <p className="text-lg font-semibold">{day.getDate()}</p>
              {isToday && !isSelected && (
                <p className="text-[9px] font-medium">HOY</p>
              )}
            </button>

            <div className="p-1.5 space-y-1 max-h-[400px] overflow-y-auto">
              {dayAppointments.length === 0 ? (
                <p className="text-[10px] text-sana-300 text-center py-4">
                  Sin citas
                </p>
              ) : (
                dayAppointments.map((appt) => {
                  const time = new Date(appt.date_time).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const colorClass = statusColors[appt.status] || statusColors.PENDING;

                  return (
                    <button
                      key={appt.id}
                      onClick={() => onSelectAppointment(appt)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg border 
                                  transition hover:shadow-sm ${colorClass}`}
                      title={`${appt.patient_first_name} ${appt.patient_last_name}`}
                    >
                      <p className="text-[10px] font-semibold opacity-80">{time}</p>
                      <p className="text-[10px] font-medium truncate">
                        {appt.patient_last_name}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekCalendar;