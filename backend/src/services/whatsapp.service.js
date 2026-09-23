const axios = require('axios');
require('dotenv').config();

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const BASE_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}`;

/**
 * Envía un mensaje de texto vía UltraMsg
 * @param {string} to - Número en formato internacional (ej: +5491123456789)
 * @param {string} body - Texto del mensaje
 */
const sendWhatsApp = async (to, body) => {
  try {
    // UltraMsg espera el número sin el "+"
    const cleanNumber = to.replace('+', '');

    const response = await axios.post(
      `${BASE_URL}/messages/chat`,
      {
        token: ULTRAMSG_TOKEN,
        to: cleanNumber,
        body,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log(`✅ WhatsApp enviado a ${to}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      `❌ Error enviando WhatsApp a ${to}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Formatea una fecha al estilo "Lunes 20 de Septiembre de 2026, 10:00 AM"
 */
const formatDate = (date) => {
  return new Date(date).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Mensaje de confirmación al agendar cita
 */
const sendAppointmentConfirmation = async ({ patient, doctor, specialty, dateTime }) => {
  const clinicName = process.env.CLINIC_NAME || '+sana';
  const clinicAddress = process.env.CLINIC_ADDRESS || '';

  const body = `¡Hola ${patient.first_name}! 👋

Tu cita en *${clinicName}* ha sido agendada:

📅 *Fecha:* ${formatDate(dateTime)}
👨‍⚕️ *Doctor:* Dr. ${doctor.first_name} ${doctor.last_name}
🩺 *Especialidad:* ${specialty}
📍 *Dirección:* ${clinicAddress}

Por favor responde *CONFIRMO* para confirmar tu asistencia, o *CANCELO* si no puedes asistir.

¡Te esperamos! 💜`;

  return sendWhatsApp(patient.phone, body);
};

/**
 * Recordatorio 24 horas antes
 */
const sendAppointmentReminder = async ({ patient, doctor, specialty, dateTime }) => {
  const clinicName = process.env.CLINIC_NAME || '+sana';
  const clinicAddress = process.env.CLINIC_ADDRESS || '';

  const body = `Hola ${patient.first_name} 👋

Te recordamos tu cita de mañana en *${clinicName}*:

📅 *Fecha:* ${formatDate(dateTime)}
👨‍⚕️ *Doctor:* Dr. ${doctor.first_name} ${doctor.last_name}
🩺 *Especialidad:* ${specialty}
📍 *Dirección:* ${clinicAddress}

Por favor llega 10 minutos antes. Si necesitas reprogramar, responde a este mensaje.

¡Gracias! 💜`;

  return sendWhatsApp(patient.phone, body);
};

/**
 * Aviso de cancelación
 */
const sendAppointmentCancellation = async ({ patient, dateTime, reason }) => {
  const clinicName = process.env.CLINIC_NAME || '+sana';

  const body = `Hola ${patient.first_name},

Tu cita del ${formatDate(dateTime)} en *${clinicName}* ha sido cancelada.

${reason ? `Motivo: ${reason}` : ''}

Por favor comunícate con nosotros para reprogramar. 💜`;

  return sendWhatsApp(patient.phone, body);
};

module.exports = {
  sendWhatsApp,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  formatDate,
};