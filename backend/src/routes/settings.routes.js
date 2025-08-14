const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getSettings,
  updateProfile,
  updatePassword,
  updatePreferences,
  updateNotifications,
  updateSecurity,
  updateBackup,
  createManualBackup
} = require('../controllers/settings.controller');

// All routes require authentication
router.use(authMiddleware);

// Get all settings
router.get('/', getSettings);

// Update profile
router.put('/profile', updateProfile);

// Update password
router.put('/password', updatePassword);

// Update preferences
router.put('/preferences', updatePreferences);

// Update notifications
router.put('/notifications', updateNotifications);

// Update security
router.put('/security', updateSecurity);

// Update backup settings
router.put('/backup', updateBackup);

// Manual backup
router.post('/backup/manual', createManualBackup);

module.exports = router;