const express = require('express');
const router = express.Router();
const {
  getAppointmentByToken,
  confirmAppointment,
  cancelAppointmentByToken,
} = require('../controllers/publicActions.controller');

// PÚBLICAS (sin autenticación)
router.get('/appointment/:token', getAppointmentByToken);
router.post('/appointment/:token/confirm', confirmAppointment);
router.post('/appointment/:token/cancel', cancelAppointmentByToken);

module.exports = router;