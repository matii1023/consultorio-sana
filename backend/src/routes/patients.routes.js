const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patients.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Todos los roles autenticados pueden ver/listar/buscar pacientes
router.get('/', authenticate, getAllPatients);
router.get('/:id', authenticate, getPatientById);

// Secretaria y Admin pueden crear y editar pacientes
router.post('/', authenticate, authorize('ADMIN', 'SECRETARY'), createPatient);
router.put('/:id', authenticate, authorize('ADMIN', 'SECRETARY'), updatePatient);

// Solo ADMIN puede "eliminar" (desactivar) pacientes
router.delete('/:id', authenticate, authorize('ADMIN'), deletePatient);

module.exports = router;