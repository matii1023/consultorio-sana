const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} = require('../controllers/appointments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Todos autenticados pueden ver/listar
router.get('/', authenticate, getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);

// Secretaria y Admin pueden agendar y editar
router.post('/', authenticate, authorize('ADMIN', 'SECRETARY'), createAppointment);
router.put('/:id', authenticate, authorize('ADMIN', 'SECRETARY'), updateAppointment);

// Cambio de estado: todos los roles (médico puede marcar IN_PROGRESS/COMPLETED)
router.patch('/:id/status', authenticate, updateAppointmentStatus);

// Cancelar: secretaria y admin
router.delete('/:id', authenticate, authorize('ADMIN', 'SECRETARY'), cancelAppointment);

module.exports = router;