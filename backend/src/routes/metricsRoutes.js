const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getPublicStats } = require('../controllers/metricsController');

router.get('/', getDashboardMetrics);
router.get('/public', getPublicStats);
router.get('/stats/public', getPublicStats);

module.exports = router;
