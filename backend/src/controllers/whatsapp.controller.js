const pool = require('../config/db');
const { processIncomingMessage } = require('../services/whatsappWebhook.service');
const {
  sendWhatsApp,
  sendAppointmentTicket,
  sendCustomMessage,
  sendAppointmentReminder,
} = require('../services/whatsapp.service');
const { logAudit } = require('../services/audit.service');

/**
 * POST /api/whatsapp/webhook
 */
const receiveWebhook = async (req, res, next) => {
  try {
    const payload = req.body?.data || req.body;
    console.log('📩 Webhook recibido:', JSON.stringify(payload).substring(0, 200));

    if (!payload) {
      return res.status(400).json({ ok: false, message: 'Payload vacío' });
    }

    const result = await processIncomingMessage(payload);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('❌ Error en webhook:', error.message);
    res.json({ ok: false, error: error.message });
  }
};

/**
 * GET /api/whatsapp/messages
 */
const getMessages = async (req, res, next) => {
  try {
    const { processed, limit = 50 } = req.query;

    let query = `
      SELECT
        wm.id, wm.from_number, wm.body, wm.intent, wm.processed, wm.created_at,
        wm.appointment_id,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        a.date_time AS appointment_date,
        a.status AS appointment_status
      FROM whatsapp_messages wm
      LEFT JOIN patients p ON p.id = wm.patient_id
      LEFT JOIN appointments a ON a.id = wm.appointment_id
      WHERE 1 = 1
    `;
    const params = [];
    let i = 1;

    if (processed !== undefined) {
      query += ` AND wm.processed = $${i++}`;
      params.push(processed === 'true');
    }

    query += ` ORDER BY wm.created_at DESC LIMIT $${i++}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/send
 * Envía un mensaje personalizado a un paciente
 */
const sendManualMessage = async (req, res, next) => {
  try {
    const { to, body, patient_id } = req.body;

    if (!to || !body) {
      return res.status(400).json({ message: 'Número y mensaje son obligatorios' });
    }

    const result = await sendWhatsApp(to, body);

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'whatsapp',
      description: `Envió mensaje manual a ${to}`,
      newData: { to, body: body.substring(0, 100) },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/send-ticket/:appointmentId
 * Envía el comprobante del turno al paciente
 */
const sendTicketByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    // Obtener datos completos de la cita
    const result = await pool.query(
      `SELECT
         a.id, a.date_time, a.duration, a.reason,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appt = result.rows[0];

    if (!appt.patient_phone) {
      return res.status(400).json({ message: 'El paciente no tiene teléfono registrado' });
    }

    const sendResult = await sendAppointmentTicket({
      patient: {
        first_name: appt.patient_first_name,
        last_name: appt.patient_last_name,
        phone: appt.patient_phone,
      },
      doctor: {
        first_name: appt.doctor_first_name,
        last_name: appt.doctor_last_name,
      },
      specialty: appt.specialty_name,
      dateTime: appt.date_time,
      duration: appt.duration,
      reason: appt.reason,
    });

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'whatsapp',
      entityId: appointmentId,
      description: `Envió comprobante de turno a ${appt.patient_first_name} ${appt.patient_last_name}`,
    });

    res.json({ success: sendResult.success, ...sendResult });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/send-reminder/:appointmentId
 * Envía un recordatorio manual
 */
const sendReminderByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const result = await pool.query(
      `SELECT
         a.id, a.date_time, a.duration,
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
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appt = result.rows[0];

    const sendResult = await sendAppointmentReminder({
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

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'whatsapp',
      entityId: appointmentId,
      description: `Envió recordatorio a ${appt.patient_first_name}`,
    });

    res.json({ success: sendResult.success, ...sendResult });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/send-bulk-reminders
 * Envía recordatorios masivos para las citas del día siguiente
 */
const sendBulkReminders = async (req, res, next) => {
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

    let sent = 0;
    let failed = 0;

    for (const appt of result.rows) {
      if (!appt.patient_phone) continue;

      const sendResult = await sendAppointmentReminder({
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

      // Pausa entre mensajes para no saturar UltraMsg
      await new Promise((r) => setTimeout(r, 1500));
    }

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'whatsapp',
      description: `Envió ${sent} recordatorios masivos (${failed} fallidos)`,
    });

    res.json({
      total: result.rows.length,
      sent,
      failed,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * POST /api/whatsapp/run-reminders-now
 * Ejecuta los recordatorios manualmente (solo para testing)
 */
const runRemindersNow = async (req, res, next) => {
  try {
    const { send24hReminders, send2hReminders } = require('../jobs/reminders.job');
    const { type = '24h' } = req.body;

    if (type === '24h') {
      await send24hReminders();
    } else if (type === '2h') {
      await send2hReminders();
    } else {
      await send24hReminders();
      await send2hReminders();
    }

    res.json({ success: true, message: 'Recordatorios ejecutados' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/preview-ticket/:appointmentId
 * Devuelve el mensaje renderizado SIN enviarlo.
 */
const previewTicket = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const result = await pool.query(
      `SELECT
         a.id, a.date_time, a.duration, a.reason,
         a.confirm_token, a.cancel_token,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appt = result.rows[0];

    const { getRenderedTemplate } = require('../services/templateRenderer.service');
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    const formatDateOnly = (date) =>
      new Date(date).toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });

    const formatTimeOnly = (date) =>
      new Date(date).toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit',
      });

    const confirmLink = appt.confirm_token
      ? `${FRONTEND_URL}/confirm/${appt.confirm_token}`
      : '';
    const cancelLink = appt.cancel_token
      ? `${FRONTEND_URL}/cancel/${appt.cancel_token}`
      : '';

    const values = {
      clinic_name: process.env.CLINIC_NAME || '+sana',
      clinic_address: process.env.CLINIC_ADDRESS || '',
      clinic_phone: process.env.CLINIC_PHONE || '',
      patient_name: `${appt.patient_first_name} ${appt.patient_last_name}`,
      doctor_name: `${appt.doctor_first_name} ${appt.doctor_last_name}`,
      specialty: appt.specialty_name || '—',
      date: formatDateOnly(appt.date_time),
      time: formatTimeOnly(appt.date_time),
      duration: appt.duration || 30,
      reason: appt.reason || '',
      confirm_link: '',
      cancel_link: '',
    };

    const body = await getRenderedTemplate('appointment_ticket', values);

    res.json({
      body,
      phone: appt.patient_phone,
      patient_name: `${appt.patient_first_name} ${appt.patient_last_name}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/preview-reminder/:appointmentId
 */
const previewReminder = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const result = await pool.query(
      `SELECT
         a.id, a.date_time,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appt = result.rows[0];

    const { getRenderedTemplate } = require('../services/templateRenderer.service');

    const formatDate = (date) =>
      new Date(date).toLocaleString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      });

    const values = {
      clinic_name: process.env.CLINIC_NAME || '+sana',
      clinic_address: process.env.CLINIC_ADDRESS || '',
      clinic_phone: process.env.CLINIC_PHONE || '',
      patient_name: appt.patient_first_name,
      doctor_name: `${appt.doctor_first_name} ${appt.doctor_last_name}`,
      specialty: appt.specialty_name || '—',
      date: formatDate(appt.date_time),
      confirm_link: '',
      cancel_link: '',
    };

    const body = await getRenderedTemplate('reminder_24h', values);

    res.json({
      body,
      phone: appt.patient_phone,
      patient_name: `${appt.patient_first_name} ${appt.patient_last_name}`,
    });
  } catch (error) {
    next(error);
  }
};

const sendEditedMessage = async (req, res, next) => {
  try {
    const { phone, body, appointment_id } = req.body;

    if (!phone || !body) {
      return res.status(400).json({ message: 'Número y mensaje son obligatorios' });
    }

    const { sendWhatsApp } = require('../services/whatsapp.service');
    const result = await sendWhatsApp(phone, body);

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'whatsapp',
      entityId: appointment_id || null,
      description: `Envió mensaje editado a ${phone}`,
      newData: { phone, body: body.substring(0, 100) },
    });

    res.json({ success: result.success, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  receiveWebhook,
  getMessages,
  sendManualMessage,
  sendTicketByAppointment,
  sendReminderByAppointment,
  sendBulkReminders,
  runRemindersNow,
  previewTicket,       
  previewReminder,        
  sendEditedMessage,      
};