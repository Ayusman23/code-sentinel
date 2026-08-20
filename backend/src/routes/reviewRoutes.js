const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getReviews, getReviewById, analyzeManualDiff } = require('../controllers/reviewController');

router.get('/', authenticate, getReviews);
router.get('/:id', authenticate, getReviewById);
router.post('/analyze-manual', authenticate, analyzeManualDiff);

module.exports = router;
