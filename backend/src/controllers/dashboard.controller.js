const { pool } = require('../config/database');

const getDashboardMetrics = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.tenantId || 1; // Get tenant from token or default
  const { startDate, endDate } = req.query;
  
  try {
    console.log('Fetching dashboard metrics for user:', userId, 'tenant:', tenantId);
    
    // Get total revenue (pagamentos tipo entrada)
    const [revenueResult] = await pool.execute(
      `SELECT COALESCE(SUM(valor), 0) as total_revenue 
       FROM pagamentos 
       WHERE tenant_id = ? AND tipo_pagamento = 'entrada' AND status = 'confirmado'
       ${startDate && endDate ? 'AND data_pagamento BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    // Get total expenses (despesas)
    const [expensesResult] = await pool.execute(
      `SELECT COALESCE(SUM(valor), 0) as total_expenses 
       FROM despesas 
       WHERE tenant_id = ? AND deleted_at IS NULL
       ${startDate && endDate ? 'AND data_despesa BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    // Get total receivables (recebimentos) - check if table exists first
    let totalReceivables = 0;
    try {
      const [receivablesResult] = await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) as total_receivables 
         FROM recebimentos 
         WHERE tenant_id = ? AND status = 'confirmado'
         ${startDate && endDate ? 'AND data_recebimento BETWEEN ? AND ?' : ''}`,
        startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
      );
      totalReceivables = parseFloat(receivablesResult[0].total_receivables || 0);
    } catch (err) {
      console.log('Recebimentos table might not have data:', err.message);
    }

    // Calculate net profit (lucro líquido)
    const totalRevenue = parseFloat(revenueResult[0].total_revenue || 0);
    const totalExpenses = parseFloat(expensesResult[0].total_expenses || 0);
    const netProfit = totalRevenue + totalReceivables - totalExpenses;

    // Get variation (simplified for now)
    let variation = 0;
    if (startDate && endDate) {
      // Calculate variation based on previous period
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - diffDays);
      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);

      const [prevRevenueResult] = await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) as total_revenue 
         FROM pagamentos 
         WHERE tenant_id = ? AND tipo_pagamento = 'entrada' AND status = 'confirmado'
         AND data_pagamento BETWEEN ? AND ?`,
        [tenantId, previousStart.toISOString().split('T')[0], previousEnd.toISOString().split('T')[0]]
      );

      const prevRevenue = parseFloat(prevRevenueResult[0].total_revenue || 0);
      if (prevRevenue > 0) {
        variation = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      } else if (totalRevenue > 0) {
        variation = 100;
      }
    }

    // Get top attendants with commissions
    let topAttendants = [];
    try {
      const [attendantsResult] = await pool.execute(
        `SELECT 
          a.id,
          a.nome as name,
          COUNT(p.id) as total_sales,
          COALESCE(SUM(p.valor_comissao), 0) as total_commission
         FROM atendentes a
         LEFT JOIN pagamentos p ON a.id = p.atendente_id AND p.status = 'confirmado'
         WHERE a.tenant_id = ? AND a.ativo = true AND a.deleted_at IS NULL
         GROUP BY a.id, a.nome
         ORDER BY total_commission DESC
         LIMIT 5`,
        [tenantId]
      );
      topAttendants = attendantsResult;
    } catch (err) {
      console.log('Error fetching top attendants:', err.message);
    }

    // Get latest payments
    let latestPayments = [];
    try {
      const [paymentsResult] = await pool.execute(
        `SELECT 
          p.id,
          p.valor as amount,
          p.data_pagamento as payment_date,
          p.tipo_pagamento as payment_type,
          p.descricao as description,
          a.nome as attendant_name,
          t.nome as tripeiro_name
         FROM pagamentos p
         LEFT JOIN atendentes a ON p.atendente_id = a.id
         LEFT JOIN tripeiros t ON p.tripeiro_id = t.id
         WHERE p.tenant_id = ? AND p.status = 'confirmado' AND p.deleted_at IS NULL
         ORDER BY p.data_pagamento DESC, p.created_at DESC
         LIMIT 10`,
        [tenantId]
      );
      latestPayments = paymentsResult;
    } catch (err) {
      console.log('Error fetching latest payments:', err.message);
    }

    // Get latest expenses
    let latestExpenses = [];
    try {
      const [expensesResult] = await pool.execute(
        `SELECT 
          d.id,
          d.descricao as description,
          d.valor as amount,
          COALESCE(d.categoria, 'Geral') as category,
          d.data_despesa as expense_date
         FROM despesas d
         WHERE d.tenant_id = ? AND d.deleted_at IS NULL
         ORDER BY d.data_despesa DESC, d.created_at DESC
         LIMIT 10`,
        [tenantId]
      );
      latestExpenses = expensesResult;
    } catch (err) {
      console.log('Error fetching latest expenses:', err.message);
    }

    // Get notes
    let notes = [];
    try {
      const [notesResult] = await pool.execute(
        `SELECT id, title, content, is_pinned, color, updated_at 
         FROM notes 
         WHERE tenant_id = ? AND user_id = ? AND deleted_at IS NULL
         ORDER BY is_pinned DESC, updated_at DESC
         LIMIT 5`,
        [tenantId, userId]
      );
      notes = notesResult;
    } catch (err) {
      console.log('Error fetching notes:', err.message);
    }

    // Get pending reminders
    let reminders = [];
    try {
      const [remindersResult] = await pool.execute(
        `SELECT id, title, description, due_date, due_time, priority, category
         FROM reminders 
         WHERE tenant_id = ? AND user_id = ? 
         AND deleted_at IS NULL AND status = 'pending'
         ORDER BY FIELD(priority, "high", "medium", "low"), due_date ASC
         LIMIT 5`,
        [tenantId, userId]
      );
      reminders = remindersResult;
    } catch (err) {
      console.log('Error fetching reminders:', err.message);
    }

    // Count active tripeiros
    let totalTripeiros = 0;
    try {
      const [tripeirosCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM tripeiros WHERE tenant_id = ? AND ativo = true AND deleted_at IS NULL`,
        [tenantId]
      );
      totalTripeiros = tripeirosCount[0].total;
    } catch (err) {
      console.log('Error counting tripeiros:', err.message);
    }

    // Count active atendentes
    let totalAtendentes = 0;
    try {
      const [atendentesCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM atendentes WHERE tenant_id = ? AND ativo = true AND deleted_at IS NULL`,
        [tenantId]
      );
      totalAtendentes = atendentesCount[0].total;
    } catch (err) {
      console.log('Error counting atendentes:', err.message);
    }

    res.json({
      metrics: {
        totalRevenue,
        totalExpenses,
        totalReceivables,
        netProfit,
        variation: variation.toFixed(2),
        totalTripeiros,
        totalAtendentes
      },
      topAttendants,
      latestPayments,
      latestExpenses,
      notes,
      reminders
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    console.error('Query error details:', error.sqlMessage || error.message);
    res.status(500).json({ 
      message: 'Error fetching dashboard metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardMetrics
};