const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

// Get all payments
router.get('/', authMiddleware, paymentController.getAllPayments);

// Get payment stats
router.get('/stats', authMiddleware, paymentController.getPaymentStats);

// Get single payment
router.get('/:id', authMiddleware, paymentController.getPaymentById);

// Create payment
router.post('/', authMiddleware, paymentController.createPayment);

// Update payment
router.put('/:id', authMiddleware, paymentController.updatePayment);

// Delete payment
router.delete('/:id', authMiddleware, paymentController.deletePayment);

module.exports = router;