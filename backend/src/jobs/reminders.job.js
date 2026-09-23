const cron = require('node-cron');
const pool = require('../config/db');
const { sendAppointmentReminder } = require('../services/whatsapp.service');

/**
 * Busca todas las citas que ocurrirán mañana en el mismo horario
 * y envía recordatorios de WhatsApp.
 */
const sendDailyReminders = async () => {
  console.log('⏰ Ejecutando job de recordatorios...');

  try {
    // Citas que ocurren entre mañana y dentro de 24 horas
    const result = await pool.query(
      `SELECT
         a.id, a.date_time,
         p.first_name AS patient_first_name, p.phone AS patient_phone,
         u.first_name AS doctor_first_name, u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.status IN ('PENDING', 'CONFIRMED')
         AND a.date_time BETWEEN NOW() + INTERVAL '23 hours'
                             AND NOW() + INTERVAL '25 hours'`
    );

    console.log(`📅 ${result.rows.length} citas para recordar`);

    for (const appointment of result.rows) {
      await sendAppointmentReminder({
        patient: {
          first_name: appointment.patient_first_name,
          phone: appointment.patient_phone,
        },
        doctor: {
          first_name: appointment.doctor_first_name,
          last_name: appointment.doctor_last_name,
        },
        specialty: appointment.specialty_name,
        dateTime: appointment.date_time,
      });

      // Pequeña pausa para no saturar la API de UltraMsg
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log('✅ Recordatorios enviados');
  } catch (error) {
    console.error('❌ Error en job de recordatorios:', error.message);
  }
};

/**
 * Inicia todos los cron jobs
 */
const startJobs = () => {
  // Todos los días a las 9:00 AM
  cron.schedule('0 9 * * *', sendDailyReminders, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  console.log('⏰ Cron jobs iniciados');
};

module.exports = { startJobs, sendDailyReminders };