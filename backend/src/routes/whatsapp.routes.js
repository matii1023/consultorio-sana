const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/whatsapp.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Webhook: PÚBLICO
router.post('/webhook', receiveWebhook);

// Rutas protegidas
router.get('/messages', authenticate, getMessages);
router.post('/send', authenticate, sendManualMessage);

// Envío directo (sin preview)
router.post('/send-ticket/:appointmentId', authenticate, sendTicketByAppointment);
router.post('/send-reminder/:appointmentId', authenticate, sendReminderByAppointment);
router.post('/send-bulk-reminders', authenticate, authorize('ADMIN', 'SECRETARY'), sendBulkReminders);
router.post('/run-reminders-now', authenticate, authorize('ADMIN'), runRemindersNow);

// Preview y edición de mensajes
router.get('/preview-ticket/:appointmentId', authenticate, previewTicket);
router.get('/preview-reminder/:appointmentId', authenticate, previewReminder);
router.post('/send-edited', authenticate, sendEditedMessage);

module.exports = router;