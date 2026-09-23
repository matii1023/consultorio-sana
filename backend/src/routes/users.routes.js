const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Todas las rutas de usuarios: solo ADMIN
router.use(authenticate, authorize('ADMIN'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/password', resetPassword);
router.delete('/:id', deleteUser);

module.exports = router;