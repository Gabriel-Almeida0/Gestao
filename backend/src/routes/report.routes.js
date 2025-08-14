const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { generateReport, exportReport } = require('../controllers/report.controller');

// Generate report
router.get('/generate', authMiddleware, generateReport);

// Export report
router.get('/export', authMiddleware, exportReport);

module.exports = router;