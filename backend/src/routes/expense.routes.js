const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expense.controller');

// Get all expenses
router.get('/', authMiddleware, getAllExpenses);

// Get expense statistics
router.get('/stats', authMiddleware, getExpenseStats);

// Get single expense
router.get('/:id', authMiddleware, getExpenseById);

// Create expense
router.post('/', authMiddleware, createExpense);

// Update expense
router.put('/:id', authMiddleware, updateExpense);

// Delete expense
router.delete('/:id', authMiddleware, deleteExpense);

module.exports = router;