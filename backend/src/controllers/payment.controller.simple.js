const { pool } = require('../config/database');

// Get all payments - simplified version
const getAllPayments = async (req, res) => {
  const tenantId = req.tenantId || 1;
  const { page = 1, limit = 20 } = req.query;
  
  try {
    console.log('Fetching payments for tenant:', tenantId);
    
    // First check if table exists and has data
    let payments = [];
    let total = 0;
    
    try {
      // Simple count query
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM pagamentos WHERE tenant_id = ? AND deleted_at IS NULL',
        [tenantId]
      );
      total = countResult[0]?.total || 0;
      
      // Simple select query
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const [paymentsResult] = await pool.execute(
        `SELECT 
          p.id,
          p.descricao,
          p.valor,
          p.data_pagamento,
          p.tipo_pagamento,
          p.status,
          p.valor_comissao,
          p.observacoes,
          p.atendente_id,
          p.tripeiro_id,
          p.created_at,
          p.updated_at
        FROM pagamentos p
        WHERE p.tenant_id = ? AND p.deleted_at IS NULL
        ORDER BY p.data_pagamento DESC, p.created_at DESC
        LIMIT ? OFFSET ?`,
        [tenantId, parseInt(limit), offset]
      );
      
      // Now try to get names with separate queries
      for (let payment of paymentsResult) {
        payment.attendant_name = null;
        payment.tripeiro_name = null;
        
        if (payment.atendente_id) {
          try {
            const [attendant] = await pool.execute(
              'SELECT nome FROM atendentes WHERE id = ?',
              [payment.atendente_id]
            );
            if (attendant.length > 0) {
              payment.attendant_name = attendant[0].nome;
            }
          } catch (err) {
            console.log('Could not fetch attendant name');
          }
        }
        
        if (payment.tripeiro_id) {
          try {
            const [tripeiro] = await pool.execute(
              'SELECT nome FROM tripeiros WHERE id = ?',
              [payment.tripeiro_id]
            );
            if (tripeiro.length > 0) {
              payment.tripeiro_name = tripeiro[0].nome;
            }
          } catch (err) {
            console.log('Could not fetch tripeiro name');
          }
        }
      }
      
      payments = paymentsResult;
    } catch (err) {
      console.error('Error in payments query:', err);
      // Return empty data if query fails
    }
    
    res.json({
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      message: 'Error fetching payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { getAllPayments };