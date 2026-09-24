const axios = require('axios');
const { getRenderedTemplate } = require('./templateRenderer.service');
require('dotenv').config();

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const BASE_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Normaliza un número de teléfono argentino al formato internacional.
 */
const normalizeArgentinePhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.startsWith('54')) {
    if (!digits.startsWith('549')) digits = '549' + digits.substring(2);
    return digits;
  }
  return '549' + digits;
};

/**
 * Envía un mensaje de texto vía UltraMsg.
 */
const sendWhatsApp = async (to, body) => {
  try {
    if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
      console.warn('⚠️ UltraMsg no configurado.');
      return { success: false, error: 'UltraMsg no configurado' };
    }

    const cleanNumber = normalizeArgentinePhone(to);
    console.log(`📱 Enviando WhatsApp a ${cleanNumber} (original: ${to})`);

    const response = await axios.post(
      `${BASE_URL}/messages/chat`,
      { token: ULTRAMSG_TOKEN, to: cleanNumber, body },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data?.error) {
      console.error(`❌ UltraMsg error:`, response.data.error);
      return { success: false, error: response.data.error, reason: 'ULTRAMSG_ERROR' };
    }

    console.log(`✅ WhatsApp enviado a ${cleanNumber}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.error(`❌ Error enviando WhatsApp a ${to}:`, errorMsg);
    return { success: false, error: errorMsg, reason: 'REQUEST_FAILED' };
  }
};

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

const formatDateOnly = (date) => {
  return new Date(date).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTimeOnly = (date) => {
  return new Date(date).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Construye los links de confirmación/cancelación.
 */
const buildActionLinks = (appointment) => {
  if (!appointment?.confirm_token || !appointment?.cancel_token) {
    return { confirmLink: '', cancelLink: '' };
  }
  return {
    confirmLink: `${FRONTEND_URL}/confirm/${appointment.confirm_token}`,
    cancelLink: `${FRONTEND_URL}/cancel/${appointment.cancel_token}`,
  };
};

const buildCommonValues = () => ({
  clinic_name: process.env.CLINIC_NAME || '+sana',
  clinic_address: process.env.CLINIC_ADDRESS || '',
  clinic_phone: process.env.CLINIC_PHONE || '',
});

/**
 * Confirmación al agendar cita (CON links de confirmar/cancelar).
 */
const sendAppointmentConfirmation = async ({ appointment, patient, doctor, specialty, dateTime }) => {
  const { confirmLink, cancelLink } = buildActionLinks(appointment);

  const values = {
    ...buildCommonValues(),
    patient_name: patient.first_name,
    doctor_name: `${doctor.first_name} ${doctor.last_name}`,
    specialty: specialty || '—',
    date: formatDate(dateTime),
    confirm_link: confirmLink,
    cancel_link: cancelLink,
  };

  const body = await getRenderedTemplate('appointment_confirmation', values);
  return sendWhatsApp(patient.phone, body);
};

/**
 * Recordatorio 24h antes (SIN links).
 */
const sendAppointmentReminder = async ({ appointment, patient, doctor, specialty, dateTime }) => {
  // ✅ Ya no construimos los links, así no se insertan en el template
  const values = {
    ...buildCommonValues(),
    patient_name: patient.first_name,
    doctor_name: `${doctor.first_name} ${doctor.last_name}`,
    specialty: specialty || '—',
    date: formatDate(dateTime),
    confirm_link: '',   // vacío
    cancel_link: '',    // vacío
  };

  const body = await getRenderedTemplate('reminder_24h', values);
  return sendWhatsApp(patient.phone, body);
};

/**
 * Recordatorio 2h antes (SIN links).
 */
const sendAppointmentReminder2h = async ({ patient, doctor, dateTime }) => {
  const values = {
    ...buildCommonValues(),
    patient_name: patient.first_name,
    doctor_name: `${doctor.first_name} ${doctor.last_name}`,
    time: formatTimeOnly(dateTime),
  };

  const body = await getRenderedTemplate('reminder_2h', values);
  return sendWhatsApp(patient.phone, body);
};

/**
 * Aviso de cancelación.
 */
const sendAppointmentCancellation = async ({ patient, dateTime, reason }) => {
  const values = {
    ...buildCommonValues(),
    patient_name: patient.first_name,
    date: formatDate(dateTime),
    reason: reason || '',
  };

  const body = await getRenderedTemplate('appointment_cancellation', values);
  return sendWhatsApp(patient.phone, body);
};

/**
 * Comprobante de turno (SIN links).
 */
const sendAppointmentTicket = async ({ appointment, patient, doctor, specialty, dateTime, duration, reason }) => {
  // ✅ Ya no construimos los links, así no se insertan en el template
  const values = {
    ...buildCommonValues(),
    patient_name: `${patient.first_name} ${patient.last_name}`,
    doctor_name: `${doctor.first_name} ${doctor.last_name}`,
    specialty: specialty || '—',
    date: formatDateOnly(dateTime),
    time: formatTimeOnly(dateTime),
    duration: duration || 30,
    reason: reason || '',
    confirm_link: '',   // vacío
    cancel_link: '',    // vacío
  };

  const body = await getRenderedTemplate('appointment_ticket', values);
  return sendWhatsApp(patient.phone, body);
};

/**
 * Solicitud de reagendado.
 */
const sendRescheduleRequest = async ({ patient, cancelLink }) => {
  const values = {
    ...buildCommonValues(),
    patient_name: patient.first_name,
    cancel_link: cancelLink,
  };

  const body = await getRenderedTemplate('reschedule_request', values);
  return sendWhatsApp(patient.phone, body);
};

const sendCustomMessage = async ({ patient, message }) => {
  const clinicName = process.env.CLINIC_NAME || '+sana';
  const body = `Hola ${patient.first_name}, te escribimos de *${clinicName}*:\n\n${message}`;
  return sendWhatsApp(patient.phone, body);
};

module.exports = {
  sendWhatsApp,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentReminder2h,
  sendAppointmentCancellation,
  sendAppointmentTicket,
  sendRescheduleRequest,
  sendCustomMessage,
  normalizeArgentinePhone,
  buildActionLinks,
  formatDate,
  formatDateOnly,
  formatTimeOnly,
};