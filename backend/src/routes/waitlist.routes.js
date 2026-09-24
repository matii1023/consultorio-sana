const express = require('express');
const router = express.Router();
const {
  getAllWaitlist,
  addToWaitlist,
  updateWaitlistStatus,
  deleteWaitlistEntry,
} = require('../controllers/waitlist.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', getAllWaitlist);
router.post('/', authorize('ADMIN', 'SECRETARY'), addToWaitlist);
router.patch('/:id/status', authorize('ADMIN', 'SECRETARY'), updateWaitlistStatus);
router.delete('/:id', authorize('ADMIN', 'SECRETARY'), deleteWaitlistEntry);

module.exports = router;