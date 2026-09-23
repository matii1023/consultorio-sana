const express = require('express');
const router = express.Router();
const {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} = require('../controllers/specialties.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Cualquier usuario autenticado puede listar y ver
router.get('/', authenticate, getAllSpecialties);
router.get('/:id', authenticate, getSpecialtyById);

// Solo ADMIN puede crear, editar y eliminar
router.post('/', authenticate, authorize('ADMIN'), createSpecialty);
router.put('/:id', authenticate, authorize('ADMIN'), updateSpecialty);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSpecialty);

module.exports = router;