const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const noteController = require('../controllers/note.controller');

// Get all notes
router.get('/', authMiddleware, noteController.getAllNotes);

// Get single note
router.get('/:id', authMiddleware, noteController.getNoteById);

// Create note
router.post('/', authMiddleware, noteController.createNote);

// Update note
router.put('/:id', authMiddleware, noteController.updateNote);

// Delete note
router.delete('/:id', authMiddleware, noteController.deleteNote);

// Toggle pin status
router.patch('/:id/pin', authMiddleware, noteController.togglePin);

module.exports = router;