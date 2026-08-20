const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboardMetrics } = require('../controllers/metricsController');

router.get('/', authenticate, getDashboardMetrics);

module.exports = router;
