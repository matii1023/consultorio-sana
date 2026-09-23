const express = require('express');
const router = express.Router();
const {
  createBackup,
  listBackups,
  downloadBackup,
} = require('../controllers/backup.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Solo ADMIN puede gestionar backups
router.use(authenticate, authorize('ADMIN'));

router.post('/', createBackup);
router.get('/', listBackups);
router.get('/:filename', downloadBackup);

module.exports = router;