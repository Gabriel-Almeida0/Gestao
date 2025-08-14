const { pool } = require('../config/database');

// Get all attendants
const getAllAttendants = async (req, res) => {
  const tenantId = req.tenantId;
  const { ativo, page = 1, limit = 20 } = req.query;
  
  try {
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT p.id) as total_payments,
        SUM(p.valor_comissao) as total_commissions
      FROM atendentes a
      LEFT JOIN pagamentos p ON a.id = p.atendente_id AND p.deleted_at IS NULL
      WHERE a.tenant_id = ? AND a.deleted_at IS NULL
    `;
    const params = [tenantId];
    
    if (ativo !== undefined) {
      query += ' AND a.ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    query += ' GROUP BY a.id';
    
    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM atendentes
      WHERE tenant_id = ? AND deleted_at IS NULL
      ${ativo !== undefined ? 'AND ativo = ?' : ''}
    `;
    const countParams = ativo !== undefined ? [tenantId, ativo === 'true' ? 1 : 0] : [tenantId];
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY a.nome ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [attendants] = await pool.execute(query, params);
    
    res.json({
      data: attendants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get attendants error:', error);
    res.status(500).json({ message: 'Error fetching attendants' });
  }
};

// Get single attendant
const getAttendantById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    const [attendants] = await pool.execute(
      `SELECT 
        a.*,
        COUNT(DISTINCT p.id) as total_payments,
        SUM(p.valor_comissao) as total_commissions
      FROM atendentes a
      LEFT JOIN pagamentos p ON a.id = p.atendente_id AND p.deleted_at IS NULL
      WHERE a.id = ? AND a.tenant_id = ? AND a.deleted_at IS NULL
      GROUP BY a.id`,
      [id, tenantId]
    );
    
    if (attendants.length === 0) {
      return res.status(404).json({ message: 'Attendant not found' });
    }
    
    res.json(attendants[0]);
  } catch (error) {
    console.error('Get attendant error:', error);
    res.status(500).json({ message: 'Error fetching attendant' });
  }
};

// Create attendant
const createAttendant = async (req, res) => {
  const { 
    nome, 
    telefone, 
    email,
    comissao_percentual,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    if (!nome || !comissao_percentual) {
      return res.status(400).json({ message: 'Name and commission percentage are required' });
    }
    
    // Check if email already exists
    if (email) {
      const [existing] = await pool.execute(
        'SELECT id FROM atendentes WHERE email = ? AND tenant_id = ? AND deleted_at IS NULL',
        [email, tenantId]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const [result] = await pool.execute(
      `INSERT INTO atendentes (
        nome, telefone, email, comissao_percentual, ativo, observacoes, tenant_id
      ) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [
        nome, 
        telefone || null,
        email || null,
        comissao_percentual,
        observacoes || null,
        tenantId
      ]
    );
    
    const [newAttendant] = await pool.execute(
      'SELECT * FROM atendentes WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newAttendant[0]);
  } catch (error) {
    console.error('Create attendant error:', error);
    res.status(500).json({ message: 'Error creating attendant' });
  }
};

// Update attendant
const updateAttendant = async (req, res) => {
  const { id } = req.params;
  const { 
    nome, 
    telefone, 
    email,
    comissao_percentual,
    ativo,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    // Check if attendant exists
    const [existing] = await pool.execute(
      'SELECT * FROM atendentes WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Attendant not found' });
    }
    
    // Check if email already exists (if email is being updated)
    if (email && email !== existing[0].email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM atendentes WHERE email = ? AND tenant_id = ? AND id != ? AND deleted_at IS NULL',
        [email, tenantId, id]
      );
      
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update attendant
    await pool.execute(
      `UPDATE atendentes 
       SET nome = ?, telefone = ?, email = ?, comissao_percentual = ?, 
           ativo = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
        nome !== undefined ? nome : existing[0].nome,
        telefone !== undefined ? telefone : existing[0].telefone,
        email !== undefined ? email : existing[0].email,
        comissao_percentual !== undefined ? comissao_percentual : existing[0].comissao_percentual,
        ativo !== undefined ? ativo : existing[0].ativo,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        id, tenantId
      ]
    );
    
    const [updatedAttendant] = await pool.execute(
      'SELECT * FROM atendentes WHERE id = ?',
      [id]
    );
    
    res.json(updatedAttendant[0]);
  } catch (error) {
    console.error('Update attendant error:', error);
    res.status(500).json({ message: 'Error updating attendant' });
  }
};

// Delete attendant (soft delete)
const deleteAttendant = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    // Check if attendant exists
    const [existing] = await pool.execute(
      'SELECT * FROM atendentes WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Attendant not found' });
    }
    
    // Check if attendant has associated payments
    const [payments] = await pool.execute(
      'SELECT COUNT(*) as count FROM pagamentos WHERE atendente_id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (payments[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete attendant with associated payments. Deactivate instead.' 
      });
    }
    
    // Soft delete
    await pool.execute(
      'UPDATE atendentes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ message: 'Attendant deleted successfully' });
  } catch (error) {
    console.error('Delete attendant error:', error);
    res.status(500).json({ message: 'Error deleting attendant' });
  }
};

// Get attendant commissions
const getAttendantCommissions = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  
  try {
    // Check if attendant exists
    const [existing] = await pool.execute(
      'SELECT * FROM atendentes WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Attendant not found' });
    }
    
    let query = `
      SELECT 
        p.id,
        p.descricao,
        p.valor,
        p.valor_comissao,
        p.data_pagamento,
        p.status,
        t.nome as tripeiro_name
      FROM pagamentos p
      LEFT JOIN tripeiros t ON p.tripeiro_id = t.id
      WHERE p.atendente_id = ? AND p.tenant_id = ? AND p.deleted_at IS NULL
    `;
    const params = [id, tenantId];
    
    if (startDate && endDate) {
      query += ' AND p.data_pagamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    // Count total records
    const countQuery = query.replace(
      'SELECT p.id, p.descricao, p.valor, p.valor_comissao, p.data_pagamento, p.status, t.nome as tripeiro_name', 
      'SELECT COUNT(*) as total, SUM(p.valor_comissao) as total_commission'
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    const totalCommission = countResult[0].total_commission || 0;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY p.data_pagamento DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [commissions] = await pool.execute(query, params);
    
    res.json({
      data: commissions,
      summary: {
        totalCommission
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get attendant commissions error:', error);
    res.status(500).json({ message: 'Error fetching attendant commissions' });
  }
};

module.exports = {
  getAllAttendants,
  getAttendantById,
  createAttendant,
  updateAttendant,
  deleteAttendant,
  getAttendantCommissions
};