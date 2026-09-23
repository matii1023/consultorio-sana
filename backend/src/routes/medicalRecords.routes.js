const express = require('express');
const router = express.Router();
const {
  getAllMedicalRecords,
  getMedicalRecordById,
  getPatientHistory,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecords.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Leer: cualquier usuario autenticado (secretaria ve, doctores ven, admin ve)
router.get('/', authenticate, getAllMedicalRecords);
router.get('/patient/:patientId/history', authenticate, getPatientHistory);
router.get('/:id', authenticate, getMedicalRecordById);

// Crear/editar: solo DOCTOR (validación interna verifica que sea el autor)
router.post('/', authenticate, authorize('DOCTOR'), createMedicalRecord);
router.put('/:id', authenticate, authorize('DOCTOR', 'ADMIN'), updateMedicalRecord);

// Eliminar: solo ADMIN (en la práctica, casi nunca se debe usar)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteMedicalRecord);

module.exports = router;