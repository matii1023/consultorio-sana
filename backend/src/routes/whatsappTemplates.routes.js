const express = require('express');
const router = express.Router();
const {
  getAllTemplates,
  getTemplateByKey,
  updateTemplate,
} = require('../controllers/whatsappTemplates.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, getAllTemplates);
router.get('/:key', authenticate, getTemplateByKey);
router.put('/:key', authenticate, authorize('ADMIN'), updateTemplate);

module.exports = router;