const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllTripeiros,
  getTripeiroById,
  createTripeiro,
  updateTripeiro,
  deleteTripeiro,
  getTripeiroAccounts,
  createTripeiroAccount,
  getTripeiroPayments
} = require('../controllers/tripeiro.controller');

// Get all tripeiros
router.get('/', authMiddleware, getAllTripeiros);

// Get single tripeiro
router.get('/:id', authMiddleware, getTripeiroById);

// Get tripeiro accounts
router.get('/:id/accounts', authMiddleware, getTripeiroAccounts);

// Create tripeiro account
router.post('/:id/accounts', authMiddleware, createTripeiroAccount);

// Get tripeiro payments
router.get('/:id/payments', authMiddleware, getTripeiroPayments);

// Create tripeiro
router.post('/', authMiddleware, createTripeiro);

// Update tripeiro
router.put('/:id', authMiddleware, updateTripeiro);

// Delete tripeiro
router.delete('/:id', authMiddleware, deleteTripeiro);

module.exports = router;