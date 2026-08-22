const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);
router.post('/analyze-manual', reviewController.analyzeManualDiff);
router.post('/replay-sample', reviewController.replaySampleScan);

module.exports = router;
