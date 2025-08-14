const { pool } = require('../config/database');

// Get all tripeiros
const getAllTripeiros = async (req, res) => {
  const tenantId = req.tenantId;
  const { ativo, page = 1, limit = 20, search } = req.query;
  
  try {
    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT c.id) as total_accounts,
        SUM(c.saldo_devedor) as total_debt,
        COUNT(DISTINCT p.id) as total_payments
      FROM tripeiros t
      LEFT JOIN contas_tripeiro c ON t.id = c.tripeiro_id AND c.deleted_at IS NULL
      LEFT JOIN pagamentos p ON t.id = p.tripeiro_id AND p.deleted_at IS NULL
      WHERE t.tenant_id = ? AND t.deleted_at IS NULL
    `;
    const params = [tenantId];
    
    if (search) {
      query += ' AND (t.nome LIKE ? OR t.email LIKE ? OR t.telefone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (ativo !== undefined) {
      query += ' AND t.ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    query += ' GROUP BY t.id';
    
    // Count total records
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tripeiros t
      WHERE t.tenant_id = ? AND t.deleted_at IS NULL
    `;
    const countParams = [tenantId];
    
    if (search) {
      countQuery += ' AND (t.nome LIKE ? OR t.email LIKE ? OR t.telefone LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (ativo !== undefined) {
      countQuery += ' AND t.ativo = ?';
      countParams.push(ativo === 'true' ? 1 : 0);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY t.nome ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [tripeiros] = await pool.execute(query, params);
    
    res.json({
      data: tripeiros,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tripeiros error:', error);
    res.status(500).json({ message: 'Error fetching tripeiros' });
  }
};

// Get single tripeiro
const getTripeiroById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    const [tripeiros] = await pool.execute(
      `SELECT 
        t.*,
        COUNT(DISTINCT c.id) as total_accounts,
        SUM(c.saldo_devedor) as total_debt,
        COUNT(DISTINCT p.id) as total_payments
      FROM tripeiros t
      LEFT JOIN contas_tripeiro c ON t.id = c.tripeiro_id AND c.deleted_at IS NULL
      LEFT JOIN pagamentos p ON t.id = p.tripeiro_id AND p.deleted_at IS NULL
      WHERE t.id = ? AND t.tenant_id = ? AND t.deleted_at IS NULL
      GROUP BY t.id`,
      [id, tenantId]
    );
    
    if (tripeiros.length === 0) {
      return res.status(404).json({ message: 'Tripeiro not found' });
    }
    
    // Get accounts for this tripeiro
    const [accounts] = await pool.execute(
      `SELECT * FROM contas_tripeiro 
       WHERE tripeiro_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [id]
    );
    
    res.json({
      ...tripeiros[0],
      accounts
    });
  } catch (error) {
    console.error('Get tripeiro error:', error);
    res.status(500).json({ message: 'Error fetching tripeiro' });
  }
};

// Create tripeiro
const createTripeiro = async (req, res) => {
  const { 
    nome, 
    telefone, 
    email,
    endereco,
    cidade,
    estado,
    cep,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    if (!nome) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    // Check if email already exists
    if (email) {
      const [existing] = await pool.execute(
        'SELECT id FROM tripeiros WHERE email = ? AND tenant_id = ? AND deleted_at IS NULL',
        [email, tenantId]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const [result] = await pool.execute(
      `INSERT INTO tripeiros (
        nome, telefone, email, endereco, cidade, estado, cep, 
        ativo, observacoes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        nome, 
        telefone || null,
        email || null,
        endereco || null,
        cidade || null,
        estado || null,
        cep || null,
        observacoes || null,
        tenantId
      ]
    );
    
    const [newTripeiro] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newTripeiro[0]);
  } catch (error) {
    console.error('Create tripeiro error:', error);
    res.status(500).json({ message: 'Error creating tripeiro' });
  }
};

// Update tripeiro
const updateTripeiro = async (req, res) => {
  const { id } = req.params;
  const { 
    nome, 
    telefone, 
    email,
    endereco,
    cidade,
    estado,
    cep,
    ativo,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    // Check if tripeiro exists
    const [existing] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tripeiro not found' });
    }
    
    // Check if email already exists (if email is being updated)
    if (email && email !== existing[0].email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM tripeiros WHERE email = ? AND tenant_id = ? AND id != ? AND deleted_at IS NULL',
        [email, tenantId, id]
      );
      
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update tripeiro
    await pool.execute(
      `UPDATE tripeiros 
       SET nome = ?, telefone = ?, email = ?, endereco = ?, cidade = ?, 
           estado = ?, cep = ?, ativo = ?, observacoes = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
        nome !== undefined ? nome : existing[0].nome,
        telefone !== undefined ? telefone : existing[0].telefone,
        email !== undefined ? email : existing[0].email,
        endereco !== undefined ? endereco : existing[0].endereco,
        cidade !== undefined ? cidade : existing[0].cidade,
        estado !== undefined ? estado : existing[0].estado,
        cep !== undefined ? cep : existing[0].cep,
        ativo !== undefined ? ativo : existing[0].ativo,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        id, tenantId
      ]
    );
    
    const [updatedTripeiro] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ?',
      [id]
    );
    
    res.json(updatedTripeiro[0]);
  } catch (error) {
    console.error('Update tripeiro error:', error);
    res.status(500).json({ message: 'Error updating tripeiro' });
  }
};

// Delete tripeiro (soft delete)
const deleteTripeiro = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    // Check if tripeiro exists
    const [existing] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tripeiro not found' });
    }
    
    // Check if tripeiro has associated payments or accounts
    const [payments] = await pool.execute(
      'SELECT COUNT(*) as count FROM pagamentos WHERE tripeiro_id = ? AND deleted_at IS NULL',
      [id]
    );
    
    const [accounts] = await pool.execute(
      'SELECT COUNT(*) as count FROM contas_tripeiro WHERE tripeiro_id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (payments[0].count > 0 || accounts[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tripeiro with associated records. Deactivate instead.' 
      });
    }
    
    // Soft delete
    await pool.execute(
      'UPDATE tripeiros SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ message: 'Tripeiro deleted successfully' });
  } catch (error) {
    console.error('Delete tripeiro error:', error);
    res.status(500).json({ message: 'Error deleting tripeiro' });
  }
};

// Get tripeiro accounts
const getTripeiroAccounts = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { page = 1, limit = 20 } = req.query;
  
  try {
    // Check if tripeiro exists
    const [existing] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tripeiro not found' });
    }
    
    const offset = (page - 1) * limit;
    
    const [accounts] = await pool.execute(
      `SELECT * FROM contas_tripeiro 
       WHERE tripeiro_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM contas_tripeiro WHERE tripeiro_id = ? AND deleted_at IS NULL',
      [id]
    );
    const total = countResult[0].total;
    
    res.json({
      data: accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tripeiro accounts error:', error);
    res.status(500).json({ message: 'Error fetching tripeiro accounts' });
  }
};

// Create tripeiro account
const createTripeiroAccount = async (req, res) => {
  const { id } = req.params;
  const { 
    numero_conta,
    descricao,
    limite_credito,
    saldo_devedor,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    // Check if tripeiro exists
    const [existing] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tripeiro not found' });
    }
    
    if (!numero_conta) {
      return res.status(400).json({ message: 'Account number is required' });
    }
    
    // Check if account number already exists
    const [existingAccount] = await pool.execute(
      'SELECT id FROM contas_tripeiro WHERE numero_conta = ? AND deleted_at IS NULL',
      [numero_conta]
    );
    
    if (existingAccount.length > 0) {
      return res.status(400).json({ message: 'Account number already exists' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO contas_tripeiro (
        tripeiro_id, numero_conta, descricao, limite_credito, 
        saldo_devedor, ativa, observacoes
      ) VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        numero_conta,
        descricao || null,
        limite_credito || 0,
        saldo_devedor || 0,
        observacoes || null
      ]
    );
    
    const [newAccount] = await pool.execute(
      'SELECT * FROM contas_tripeiro WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newAccount[0]);
  } catch (error) {
    console.error('Create tripeiro account error:', error);
    res.status(500).json({ message: 'Error creating tripeiro account' });
  }
};

// Get tripeiro payments
const getTripeiroPayments = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  
  try {
    // Check if tripeiro exists
    const [existing] = await pool.execute(
      'SELECT * FROM tripeiros WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tripeiro not found' });
    }
    
    let query = `
      SELECT 
        p.*,
        a.nome as attendant_name
      FROM pagamentos p
      LEFT JOIN atendentes a ON p.atendente_id = a.id
      WHERE p.tripeiro_id = ? AND p.tenant_id = ? AND p.deleted_at IS NULL
    `;
    const params = [id, tenantId];
    
    if (startDate && endDate) {
      query += ' AND p.data_pagamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    // Count total records
    const countQuery = query.replace(
      'SELECT p.*, a.nome as attendant_name', 
      'SELECT COUNT(*) as total, SUM(p.valor) as total_value'
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    const totalValue = countResult[0].total_value || 0;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY p.data_pagamento DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [payments] = await pool.execute(query, params);
    
    res.json({
      data: payments,
      summary: {
        totalValue
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tripeiro payments error:', error);
    res.status(500).json({ message: 'Error fetching tripeiro payments' });
  }
};

module.exports = {
  getAllTripeiros,
  getTripeiroById,
  createTripeiro,
  updateTripeiro,
  deleteTripeiro,
  getTripeiroAccounts,
  createTripeiroAccount,
  getTripeiroPayments
};