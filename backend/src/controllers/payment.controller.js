const { pool } = require('../config/database');

// Get all payments
const getAllPayments = async (req, res) => {
  const tenantId = req.tenantId || 1;
  const { startDate, endDate, status, attendantId, tripeiroId, page = 1, limit = 20 } = req.query;
  
  try {
    console.log('Fetching payments for tenant:', tenantId, 'Page:', page, 'Limit:', limit);
    
    // Start with simpler query without JOINs to avoid issues
    let baseQuery = `
      SELECT p.*
      FROM pagamentos p
      WHERE p.tenant_id = ? AND p.deleted_at IS NULL
    `;
    const params = [tenantId];
    
    if (startDate && endDate) {
      baseQuery += ' AND p.data_pagamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (status) {
      baseQuery += ' AND p.status = ?';
      params.push(status);
    }
    
    if (attendantId) {
      baseQuery += ' AND p.atendente_id = ?';
      params.push(attendantId);
    }
    
    if (tripeiroId) {
      baseQuery += ' AND p.tripeiro_id = ?';
      params.push(tripeiroId);
    }
    
    // Count total records
    let total = 0;
    try {
      const countQuery = baseQuery.replace('SELECT p.*', 'SELECT COUNT(*) as total');
      const [countResult] = await pool.execute(countQuery, params);
      total = countResult[0]?.total || 0;
    } catch (countError) {
      console.error('Error counting payments:', countError);
      // Continue with default total
    }
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    baseQuery += ' ORDER BY p.data_pagamento DESC, p.created_at DESC';
    baseQuery += ' LIMIT ? OFFSET ?';
    
    // Create new params array for paginated query
    const paginatedParams = [...params, parseInt(limit), offset];
    
    let payments = [];
    try {
      const [paymentsResult] = await pool.execute(baseQuery, paginatedParams);
      
      // Now enrich with attendant and tripeiro names
      for (let payment of paymentsResult) {
        payment.attendant_name = null;
        payment.tripeiro_name = null;
        
        if (payment.atendente_id) {
          try {
            const [attendant] = await pool.execute(
              'SELECT nome FROM atendentes WHERE id = ? AND deleted_at IS NULL',
              [payment.atendente_id]
            );
            if (attendant.length > 0) {
              payment.attendant_name = attendant[0].nome;
            }
          } catch (err) {
            // Ignore error for individual name fetch
          }
        }
        
        if (payment.tripeiro_id) {
          try {
            const [tripeiro] = await pool.execute(
              'SELECT nome FROM tripeiros WHERE id = ? AND deleted_at IS NULL',
              [payment.tripeiro_id]
            );
            if (tripeiro.length > 0) {
              payment.tripeiro_name = tripeiro[0].nome;
            }
          } catch (err) {
            // Ignore error for individual name fetch
          }
        }
      }
      
      payments = paymentsResult;
    } catch (queryError) {
      console.error('Error fetching payments data:', queryError);
      console.error('SQL:', baseQuery);
      console.error('Params:', paginatedParams);
      // Return empty array if query fails
    }
    
    res.json({
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    console.error('SQL Error:', error.sqlMessage || error.message);
    res.status(500).json({ 
      message: 'Error fetching payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      sqlMessage: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined
    });
  }
};

// Get single payment
const getPaymentById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    const [payments] = await pool.execute(
      `SELECT 
        p.*,
        a.nome as attendant_name,
        t.nome as tripeiro_name
      FROM pagamentos p
      LEFT JOIN atendentes a ON p.atendente_id = a.id
      LEFT JOIN tripeiros t ON p.tripeiro_id = t.id
      WHERE p.id = ? AND p.tenant_id = ? AND p.deleted_at IS NULL`,
      [id, tenantId]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payments[0]);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Error fetching payment' });
  }
};

// Create payment
const createPayment = async (req, res) => {
  const { 
    descricao, 
    valor, 
    data_pagamento, 
    atendente_id, 
    tripeiro_id, 
    tipo_pagamento,
    status,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    if (!descricao || !valor || !data_pagamento) {
      return res.status(400).json({ message: 'Description, value and payment date are required' });
    }
    
    // Calculate commission if attendant is selected
    let valorComissao = 0;
    if (atendente_id && tipo_pagamento === 'entrada') {
      const [attendant] = await pool.execute(
        'SELECT comissao_percentual FROM atendentes WHERE id = ? AND tenant_id = ?',
        [atendente_id, tenantId]
      );
      
      if (attendant.length > 0) {
        valorComissao = (valor * attendant[0].comissao_percentual) / 100;
      }
    }
    
    const [result] = await pool.execute(
      `INSERT INTO pagamentos (
        descricao, valor, data_pagamento, atendente_id, tripeiro_id, 
        tipo_pagamento, status, valor_comissao, observacoes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        descricao, 
        valor, 
        data_pagamento, 
        atendente_id || null, 
        tripeiro_id || null,
        tipo_pagamento || 'entrada',
        status || 'pendente',
        valorComissao,
        observacoes || null,
        tenantId
      ]
    );
    
    const [newPayment] = await pool.execute(
      `SELECT 
        p.*,
        a.nome as attendant_name,
        t.nome as tripeiro_name
      FROM pagamentos p
      LEFT JOIN atendentes a ON p.atendente_id = a.id
      LEFT JOIN tripeiros t ON p.tripeiro_id = t.id
      WHERE p.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newPayment[0]);
  } catch (error) {
    console.error('Create payment error:', error);
    console.error('SQL Error:', error.sqlMessage || error.message);
    res.status(500).json({ 
      message: 'Error creating payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      sqlMessage: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { 
    descricao, 
    valor, 
    data_pagamento, 
    atendente_id, 
    tripeiro_id, 
    tipo_pagamento,
    status,
    observacoes 
  } = req.body;
  const tenantId = req.tenantId;
  
  try {
    // Check if payment exists
    const [existing] = await pool.execute(
      'SELECT * FROM pagamentos WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Recalculate commission if needed
    let valorComissao = existing[0].valor_comissao;
    const newValor = valor !== undefined ? valor : existing[0].valor;
    const newAtendente = atendente_id !== undefined ? atendente_id : existing[0].atendente_id;
    const newTipo = tipo_pagamento !== undefined ? tipo_pagamento : existing[0].tipo_pagamento;
    
    if (newAtendente && newTipo === 'entrada') {
      const [attendant] = await pool.execute(
        'SELECT comissao_percentual FROM atendentes WHERE id = ? AND tenant_id = ?',
        [newAtendente, tenantId]
      );
      
      if (attendant.length > 0) {
        valorComissao = (newValor * attendant[0].comissao_percentual) / 100;
      }
    } else if (newTipo === 'saida') {
      valorComissao = 0;
    }
    
    // Update payment
    await pool.execute(
      `UPDATE pagamentos 
       SET descricao = ?, valor = ?, data_pagamento = ?, atendente_id = ?, 
           tripeiro_id = ?, tipo_pagamento = ?, status = ?, valor_comissao = ?, 
           observacoes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
        descricao !== undefined ? descricao : existing[0].descricao,
        newValor,
        data_pagamento !== undefined ? data_pagamento : existing[0].data_pagamento,
        newAtendente,
        tripeiro_id !== undefined ? tripeiro_id : existing[0].tripeiro_id,
        newTipo,
        status !== undefined ? status : existing[0].status,
        valorComissao,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        id, tenantId
      ]
    );
    
    const [updatedPayment] = await pool.execute(
      `SELECT 
        p.*,
        a.nome as attendant_name,
        t.nome as tripeiro_name
      FROM pagamentos p
      LEFT JOIN atendentes a ON p.atendente_id = a.id
      LEFT JOIN tripeiros t ON p.tripeiro_id = t.id
      WHERE p.id = ?`,
      [id]
    );
    
    res.json(updatedPayment[0]);
  } catch (error) {
    console.error('Update payment error:', error);
    console.error('SQL Error:', error.sqlMessage || error.message);
    res.status(500).json({ 
      message: 'Error updating payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      sqlMessage: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined
    });
  }
};

// Delete payment (soft delete)
const deletePayment = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  try {
    // Check if payment exists
    const [existing] = await pool.execute(
      'SELECT * FROM pagamentos WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Soft delete
    await pool.execute(
      'UPDATE pagamentos SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Error deleting payment' });
  }
};

// Get payment stats
const getPaymentStats = async (req, res) => {
  const tenantId = req.tenantId;
  const { startDate, endDate } = req.query;
  
  try {
    let dateCondition = '';
    const params = [tenantId];
    
    if (startDate && endDate) {
      dateCondition = ' AND data_pagamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN tipo_pagamento = 'entrada' THEN valor ELSE 0 END) as total_income,
        SUM(CASE WHEN tipo_pagamento = 'saida' THEN valor ELSE 0 END) as total_outcome,
        SUM(valor_comissao) as total_commissions,
        COUNT(DISTINCT atendente_id) as active_attendants,
        COUNT(DISTINCT tripeiro_id) as active_tripeiros
      FROM pagamentos 
      WHERE tenant_id = ? AND deleted_at IS NULL AND status = 'confirmado' ${dateCondition}`,
      params
    );
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Error fetching payment stats' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats
};