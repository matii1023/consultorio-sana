const cron = require('node-cron');
const pool = require('../config/db');
const {
  sendAppointmentReminder,
  sendAppointmentReminder2h,
} = require('../services/whatsapp.service');

/**
 * Envía recordatorios 24 horas antes de la cita.
 */
const send24hReminders = async () => {
  console.log('⏰ [24h] Ejecutando recordatorios...');

  try {
    const result = await pool.query(
      `SELECT
         a.id, a.date_time, a.confirm_token, a.cancel_token,
         p.first_name AS patient_first_name,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
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

    console.log(`📅 ${result.rows.length} citas para recordar (24h)`);

    let sent = 0;
    let failed = 0;

    for (const appt of result.rows) {
      if (!appt.patient_phone) {
        failed++;
        continue;
      }

      const sendResult = await sendAppointmentReminder({
        appointment: appt,
        patient: {
          first_name: appt.patient_first_name,
          phone: appt.patient_phone,
        },
        doctor: {
          first_name: appt.doctor_first_name,
          last_name: appt.doctor_last_name,
        },
        specialty: appt.specialty_name,
        dateTime: appt.date_time,
      });

      if (sendResult.success) sent++;
      else failed++;

      // Pausa de 1.5s entre mensajes
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log(`✅ [24h] Recordatorios: ${sent} enviados, ${failed} fallidos`);
  } catch (error) {
    console.error('❌ Error en recordatorios 24h:', error.message);
  }
};

/**
 * Envía recordatorios 2 horas antes de la cita.
 */
const send2hReminders = async () => {
  console.log('⏰ [2h] Ejecutando recordatorios...');

  try {
    const result = await pool.query(
      `SELECT
         a.id, a.date_time,
         p.first_name AS patient_first_name,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       WHERE a.status IN ('PENDING', 'CONFIRMED')
         AND a.date_time BETWEEN NOW() + INTERVAL '1 hour 45 minutes'
                             AND NOW() + INTERVAL '2 hours 15 minutes'`
    );

    console.log(`📅 ${result.rows.length} citas para recordar (2h)`);

    let sent = 0;
    let failed = 0;

    for (const appt of result.rows) {
      if (!appt.patient_phone) {
        failed++;
        continue;
      }

      const sendResult = await sendAppointmentReminder2h({
        patient: {
          first_name: appt.patient_first_name,
          phone: appt.patient_phone,
        },
        doctor: {
          first_name: appt.doctor_first_name,
          last_name: appt.doctor_last_name,
        },
        dateTime: appt.date_time,
      });

      if (sendResult.success) sent++;
      else failed++;

      // Pausa de 1.5s entre mensajes
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log(`✅ [2h] Recordatorios: ${sent} enviados, ${failed} fallidos`);
  } catch (error) {
    console.error('❌ Error en recordatorios 2h:', error.message);
  }
};

/**
 * Inicia todos los cron jobs.
 */
const startJobs = () => {
  // Recordatorios 24h antes - todos los días a las 10 AM
  cron.schedule('0 10 * * *', send24hReminders, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  // Recordatorios 2h antes - cada 30 min entre 8 AM y 8 PM
  cron.schedule('*/30 8-20 * * *', send2hReminders, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  console.log('⏰ Cron jobs programados:');
  console.log('   - Recordatorios 24h: todos los días a las 10:00 AM');
  console.log('   - Recordatorios 2h: cada 30 min entre 8 AM y 8 PM');
};

module.exports = {
  startJobs,
  send24hReminders,
  send2hReminders,
};