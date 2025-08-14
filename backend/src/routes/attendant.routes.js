const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllAttendants,
  getAttendantById,
  createAttendant,
  updateAttendant,
  deleteAttendant,
  getAttendantCommissions
} = require('../controllers/attendant.controller');

// Get all attendants
router.get('/', authMiddleware, getAllAttendants);

// Get single attendant
router.get('/:id', authMiddleware, getAttendantById);

// Get attendant commissions
router.get('/:id/commissions', authMiddleware, getAttendantCommissions);

// Create attendant
router.post('/', authMiddleware, createAttendant);

// Update attendant
router.put('/:id', authMiddleware, updateAttendant);

// Delete attendant
router.delete('/:id', authMiddleware, deleteAttendant);

module.exports = router;