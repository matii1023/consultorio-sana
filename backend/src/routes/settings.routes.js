const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('ADMIN'), updateSettings);

module.exports = router;