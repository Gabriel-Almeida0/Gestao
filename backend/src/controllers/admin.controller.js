const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Get admin dashboard overview
const getAdminDashboard = async (req, res) => {
  try {
    // Get total users count
    const [usersCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE is_active = true'
    );

    // Get users by role
    const [usersByRole] = await pool.execute(
      'SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role'
    );

    // Get total revenue across all tenants
    const [totalRevenue] = await pool.execute(
      `SELECT COALESCE(SUM(valor), 0) as total 
       FROM pagamentos 
       WHERE tipo_pagamento = 'entrada' AND status = 'confirmado'`
    );

    // Get total expenses across all tenants
    const [totalExpenses] = await pool.execute(
      `SELECT COALESCE(SUM(valor), 0) as total 
       FROM despesas 
       WHERE deleted_at IS NULL`
    );

    // Get active tenants count
    const [tenantsCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM tenants WHERE active = true'
    );

    // Get recent activity
    const [recentActivity] = await pool.execute(
      `SELECT 
        al.action,
        al.entity_type,
        al.created_at,
        u.name as user_name,
        u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 10`
    );

    res.json({
      overview: {
        totalUsers: usersCount[0].total,
        totalTenants: tenantsCount[0].total,
        totalRevenue: parseFloat(totalRevenue[0].total),
        totalExpenses: parseFloat(totalExpenses[0].total),
        netProfit: parseFloat(totalRevenue[0].total) - parseFloat(totalExpenses[0].total)
      },
      usersByRole,
      recentActivity
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Error fetching admin dashboard data' });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        t.name as tenant_name
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       ORDER BY u.created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Create new user
const createUser = async (req, res) => {
  const { name, email, password, role = 'user', tenant_id = 1 } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, tenant_id, is_active) VALUES (?, ?, ?, ?, ?, true)',
      [name, email, hashedPassword, role, tenant_id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) VALUES (?, ?, ?, ?, ?)',
      [req.userId, 'CREATE', 'user', result.insertId, JSON.stringify({ name, email, role, tenant_id })]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role,
      tenant_id,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, is_active, tenant_id, password } = req.body;

  try {
    // Get current user data for audit log
    const [currentUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    if (tenant_id !== undefined) {
      updateFields.push('tenant_id = ?');
      updateValues.push(tenant_id);
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, 'UPDATE', 'user', id, JSON.stringify(currentUser[0]), JSON.stringify(req.body)]
    );

    res.json({ message: 'User updated successfully' });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete (deactivate) user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent self-deletion
    if (parseInt(id) === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Soft delete by deactivating
    await pool.execute(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.userId, 'DELETE', 'user', id]
    );

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Get user metrics
const getUserMetrics = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Get user info
    const [userInfo] = await pool.execute(
      'SELECT id, name, email, role, tenant_id FROM users WHERE id = ?',
      [id]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userInfo[0];
    const tenantId = user.tenant_id;

    // Get payments created by this user (if we track created_by)
    const [payments] = await pool.execute(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(valor), 0) as total_value,
        COALESCE(SUM(valor_comissao), 0) as total_commission
       FROM pagamentos 
       WHERE tenant_id = ? AND status = 'confirmado'
       ${startDate && endDate ? 'AND data_pagamento BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    // Get expenses
    const [expenses] = await pool.execute(
      `SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(valor), 0) as total_value
       FROM despesas 
       WHERE tenant_id = ? AND deleted_at IS NULL
       ${startDate && endDate ? 'AND data_despesa BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    // Get receivables
    const [receivables] = await pool.execute(
      `SELECT 
        COUNT(*) as total_receivables,
        COALESCE(SUM(valor), 0) as total_value
       FROM recebimentos 
       WHERE tenant_id = ? AND status = 'confirmado'
       ${startDate && endDate ? 'AND data_recebimento BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    // Get activity logs for this user
    const [activityLogs] = await pool.execute(
      `SELECT 
        action,
        entity_type,
        entity_id,
        created_at
       FROM audit_logs 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [id]
    );

    // Calculate net result
    const totalRevenue = parseFloat(payments[0].total_value) + parseFloat(receivables[0].total_value);
    const totalExpenses = parseFloat(expenses[0].total_value);
    const netResult = totalRevenue - totalExpenses;

    res.json({
      user,
      metrics: {
        payments: {
          count: payments[0].total_payments,
          totalValue: parseFloat(payments[0].total_value),
          totalCommission: parseFloat(payments[0].total_commission)
        },
        expenses: {
          count: expenses[0].total_expenses,
          totalValue: parseFloat(expenses[0].total_value)
        },
        receivables: {
          count: receivables[0].total_receivables,
          totalValue: parseFloat(receivables[0].total_value)
        },
        summary: {
          totalRevenue,
          totalExpenses,
          netResult,
          profitMargin: totalRevenue > 0 ? ((netResult / totalRevenue) * 100).toFixed(2) : 0
        }
      },
      recentActivity: activityLogs
    });

  } catch (error) {
    console.error('Get user metrics error:', error);
    res.status(500).json({ message: 'Error fetching user metrics' });
  }
};

// Get all tenants
const getTenants = async (req, res) => {
  try {
    const [tenants] = await pool.execute(
      'SELECT id, name, slug, active, created_at FROM tenants ORDER BY name'
    );
    res.json(tenants);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Error fetching tenants' });
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserMetrics,
  getTenants
};