import { useEffect, useRef } from 'react';
import { appointmentsApi } from '../api/appointments.api';
import { useBrowserNotifications } from './useBrowserNotifications';

/**
 * Monitorea las citas del día y envía notificaciones cuando faltan
 * 15 minutos o menos para su inicio.
 */
export const useUpcomingAppointments = (enabled = true) => {
  const { notify } = useBrowserNotifications();
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;

    const checkAppointments = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data } = await appointmentsApi.getAll({ date: today });

        const now = new Date();

        data.forEach((appt) => {
          if (
            notifiedRef.current.has(appt.id) ||
            ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status)
          ) {
            return;
          }

          const apptTime = new Date(appt.date_time);
          const minutesUntil = (apptTime - now) / 1000 / 60;

          if (minutesUntil > 0 && minutesUntil <= 15) {
            const timeStr = apptTime.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            notify(`⏰ Cita en ${Math.round(minutesUntil)} min`, {
              body: `${appt.patient_first_name} ${appt.patient_last_name} con Dr. ${appt.doctor_first_name} ${appt.doctor_last_name} a las ${timeStr}`,
              tag: `appointment-${appt.id}`,
              requireInteraction: true,
            });

            notifiedRef.current.add(appt.id);
          }
        });
      } catch (err) {
        // Silencioso
      }
    };

    const initialTimer = setTimeout(checkAppointments, 30000);
    const interval = setInterval(checkAppointments, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, notify]);
};