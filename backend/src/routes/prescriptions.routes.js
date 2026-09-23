const express = require('express');
const router = express.Router();
const {
  getAllPrescriptions,
  getPatientPrescriptions,
  createPrescription,
} = require('../controllers/prescriptions.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Todos autenticados pueden listar
router.get('/', authenticate, getAllPrescriptions);
router.get('/patient/:patientId', authenticate, getPatientPrescriptions);

// Solo médicos crean
router.post('/', authenticate, authorize('DOCTOR'), createPrescription);

module.exports = router;