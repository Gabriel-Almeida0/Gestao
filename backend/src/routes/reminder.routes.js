const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const reminderController = require('../controllers/reminder.controller');

// Get all reminders
router.get('/', authMiddleware, reminderController.getAllReminders);

// Get upcoming reminders (next 7 days)
router.get('/upcoming', authMiddleware, reminderController.getUpcomingReminders);

// Get single reminder
router.get('/:id', authMiddleware, reminderController.getReminderById);

// Create reminder
router.post('/', authMiddleware, reminderController.createReminder);

// Update reminder
router.put('/:id', authMiddleware, reminderController.updateReminder);

// Mark as completed
router.patch('/:id/complete', authMiddleware, reminderController.markCompleted);

// Delete reminder
router.delete('/:id', authMiddleware, reminderController.deleteReminder);

module.exports = router;