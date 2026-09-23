const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditStats,
  getEntityHistory,
} = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/entity/:entity/:entityId', authenticate, getEntityHistory);
module.exports = router;