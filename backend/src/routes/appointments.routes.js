const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getWeekAppointments,
  getAppointmentStats,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
} = require('../controllers/appointments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Rutas especiales (DEBEN ir antes de /:id)
router.get('/week', authenticate, getWeekAppointments);
router.get('/stats', authenticate, getAppointmentStats);

// Rutas generales
router.get('/', authenticate, getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);

router.post('/', authenticate, authorize('ADMIN', 'SECRETARY'), createAppointment);
router.put('/:id', authenticate, authorize('ADMIN', 'SECRETARY'), updateAppointment);
router.patch('/:id/status', authenticate, updateAppointmentStatus);
router.patch('/:id/reschedule', authenticate, authorize('ADMIN', 'SECRETARY'), rescheduleAppointment);
router.delete('/:id', authenticate, authorize('ADMIN', 'SECRETARY'), cancelAppointment);

module.exports = router;