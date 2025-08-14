const { pool } = require('../config/database');

// Get all expenses
const getAllExpenses = async (req, res) => {
  const tenantId = req.tenantId;
  const { startDate, endDate, categoria, page = 1, limit = 20 } = req.query;
  
  try {
    let query = `
      SELECT * FROM despesas 
      WHERE tenant_id = ? AND deleted_at IS NULL
    `;
    const params = [tenantId];
    
    if (startDate && endDate) {
      query += ' AND data_despesa BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    // Count total records
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY data_despesa DESC, created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [expenses] = await pool.execute(query, params);
    
    res.json({
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
};

// Get single expense
const getExpenseById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    const [expenses] = await pool.execute(
      'SELECT * FROM despesas WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (expenses.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expenses[0]);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Error fetching expense' });
  }
};

// Create expense
const createExpense = async (req, res) => {
  const { 
    descricao, 
    valor, 
    data_despesa, 
    categoria,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    if (!descricao || !valor || !data_despesa || !categoria) {
      return res.status(400).json({ message: 'Description, value, date and category are required' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO despesas (
        descricao, valor, data_despesa, categoria, observacoes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        descricao, 
        valor, 
        data_despesa, 
        categoria,
        observacoes || null,
        tenantId
      ]
    );
    
    const [newExpense] = await pool.execute(
      'SELECT * FROM despesas WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newExpense[0]);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Error creating expense' });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { 
    descricao, 
    valor, 
    data_despesa, 
    categoria,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    // Check if expense exists
    const [existing] = await pool.execute(
      'SELECT * FROM despesas WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Update expense
    await pool.execute(
      `UPDATE despesas 
       SET descricao = ?, valor = ?, data_despesa = ?, categoria = ?, 
           observacoes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
        descricao !== undefined ? descricao : existing[0].descricao,
        valor !== undefined ? valor : existing[0].valor,
        data_despesa !== undefined ? data_despesa : existing[0].data_despesa,
        categoria !== undefined ? categoria : existing[0].categoria,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        id, tenantId
      ]
    );
    
    const [updatedExpense] = await pool.execute(
      'SELECT * FROM despesas WHERE id = ?',
      [id]
    );
    
    res.json(updatedExpense[0]);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Error updating expense' });
  }
};

// Delete expense (soft delete)
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    // Check if expense exists
    const [existing] = await pool.execute(
      'SELECT * FROM despesas WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Soft delete
    await pool.execute(
      'UPDATE despesas SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
};

// Get expense stats by category
const getExpenseStats = async (req, res) => {
  const tenantId = req.tenantId;
  const { startDate, endDate } = req.query;
  
  try {
    let dateCondition = '';
    const params = [tenantId];
    
    if (startDate && endDate) {
      dateCondition = ' AND data_despesa BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    const [stats] = await pool.execute(
      `SELECT 
        categoria,
        COUNT(*) as total_count,
        SUM(valor) as total_value
      FROM despesas 
      WHERE tenant_id = ? AND deleted_at IS NULL ${dateCondition}
      GROUP BY categoria
      ORDER BY total_value DESC`,
      params
    );
    
    const [total] = await pool.execute(
      `SELECT 
        COUNT(*) as total_expenses,
        SUM(valor) as total_amount
      FROM despesas 
      WHERE tenant_id = ? AND deleted_at IS NULL ${dateCondition}`,
      params
    );
    
    res.json({
      byCategory: stats,
      total: total[0]
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Error fetching expense stats' });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
};