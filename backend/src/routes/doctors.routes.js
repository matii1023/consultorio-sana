const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctors.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Listar/ver: cualquier usuario autenticado
router.get('/', authenticate, getAllDoctors);
router.get('/:id', authenticate, getDoctorById);

// Crear/editar/eliminar: solo ADMIN
router.post('/', authenticate, authorize('ADMIN'), createDoctor);
router.put('/:id', authenticate, authorize('ADMIN'), updateDoctor);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteDoctor);

module.exports = router;