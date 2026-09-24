const pool = require('../config/db');

/**
 * Normaliza un número de teléfono quitando todo excepto dígitos.
 */
const normalizePhone = (phone) => {
  return (phone || '').replace(/\D/g, '');
};

/**
 * Detecta la intención del mensaje del paciente.
 */
const detectIntent = (body) => {
  const text = (body || '').trim().toUpperCase();

  if (/^(CONFIRMO|CONFIRMAR|SI|SÍ|OK|DALE|LISTO)\b/.test(text)) {
    return 'CONFIRM';
  }
  if (/^(CANCELO|CANCELAR|NO PUEDO|NO VOY|ANULAR)\b/.test(text)) {
    return 'CANCEL';
  }
  if (/^(REAGENDAR|REAGENDA|CAMBIAR|MOVER|REPROGRAMAR)\b/.test(text)) {
    return 'RESCHEDULE';
  }
  return 'OTHER';
};

/**
 * Busca la cita más próxima del paciente que aún no fue confirmada.
 */
const findPendingAppointment = async (patientId) => {
  const result = await pool.query(
    `SELECT id, date_time, status
     FROM appointments
     WHERE patient_id = $1
       AND status IN ('PENDING', 'CONFIRMED')
       AND date_time > NOW() - INTERVAL '2 hours'
     ORDER BY date_time ASC
     LIMIT 1`,
    [patientId]
  );
  return result.rows[0] || null;
};

/**
 * Procesa el webhook de UltraMsg.
 */
const processIncomingMessage = async (payload) => {
  const { from, body, ...rest } = payload;

  if (!from || !body) {
    return { ok: false, reason: 'Payload incompleto' };
  }

  const phoneClean = normalizePhone(from);

  // Buscar paciente por teléfono (comparando solo dígitos)
  const patientResult = await pool.query(
    `SELECT id, first_name, last_name, phone
     FROM patients
     WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') = $1
     LIMIT 1`,
    [phoneClean]
  );

  const patient = patientResult.rows[0] || null;
  const intent = detectIntent(body);

  // Buscar la cita pendiente si hay paciente
  let appointment = null;
  if (patient) {
    appointment = await findPendingAppointment(patient.id);
  }

  // Guardar mensaje en BD
  const messageResult = await pool.query(
    `INSERT INTO whatsapp_messages (from_number, body, intent, appointment_id, patient_id, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      phoneClean,
      body,
      intent,
      appointment?.id || null,
      patient?.id || null,
      JSON.stringify(rest),
    ]
  );

  // Procesar según intención
  if (appointment && patient) {
    if (intent === 'CONFIRM') {
      await pool.query(
        `UPDATE appointments SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [appointment.id]
      );
      await pool.query(
        `UPDATE whatsapp_messages SET processed = TRUE WHERE id = $1`,
        [messageResult.rows[0].id]
      );

      console.log(`✅ Cita ${appointment.id} confirmada por WhatsApp`);
    } else if (intent === 'CANCEL') {
      await pool.query(
        `UPDATE appointments SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [appointment.id]
      );
      await pool.query(
        `UPDATE whatsapp_messages SET processed = TRUE WHERE id = $1`,
        [messageResult.rows[0].id]
      );

      console.log(`❌ Cita ${appointment.id} cancelada por WhatsApp`);
    } else if (intent === 'RESCHEDULE') {
      // Enviar mensaje con el link de cancelación para reagendar
      const { sendRescheduleRequest } = require('./whatsapp.service');

      // Obtener tokens de la cita
      const fullAppt = await pool.query(
        `SELECT confirm_token, cancel_token FROM appointments WHERE id = $1`,
        [appointment.id]
      );

      if (fullAppt.rows.length > 0) {
        const tokens = fullAppt.rows[0];
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cancelLink = `${frontendUrl}/cancel/${tokens.cancel_token}`;

        await sendRescheduleRequest({
          patient: {
            first_name: patient.first_name,
            phone: patient.phone,
          },
          cancelLink,
        });

        await pool.query(
          `UPDATE whatsapp_messages SET processed = TRUE WHERE id = $1`,
          [messageResult.rows[0].id]
        );

        console.log(`🔄 Cita ${appointment.id} - paciente pidió reagendar`);
      }
    }
  }

  return {
    ok: true,
    intent,
    patient: patient ? `${patient.first_name} ${patient.last_name}` : null,
    appointmentId: appointment?.id || null,
  };
};

module.exports = { processIncomingMessage };