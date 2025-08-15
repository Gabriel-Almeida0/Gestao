const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getAdminDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserMetrics,
  getTenants
} = require('../controllers/admin.controller');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard overview
router.get('/dashboard', getAdminDashboard);

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/metrics', getUserMetrics);

// Tenant management
router.get('/tenants', getTenants);

module.exports = router;