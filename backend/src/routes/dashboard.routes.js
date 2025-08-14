const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getDashboardMetrics } = require('../controllers/dashboard.controller');

router.get('/metrics', authMiddleware, getDashboardMetrics);

module.exports = router;