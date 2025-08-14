const { pool } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Generate comprehensive report
const generateReport = async (req, res) => {
  const tenantId = req.tenantId || 1;
  const { type = 'financial', startDate, endDate } = req.query;
  
  try {
    console.log('Generating report:', { type, startDate, endDate, tenantId });
    
    const reportData = {
      summary: {},
      byCategory: [],
      byAttendant: [],
      byTripeiro: [],
      monthlyTrend: [],
      topProducts: [],
      paymentMethods: []
    };

    // Get summary data - usando nomes de colunas em português
    console.log('Fetching data for tenantId:', tenantId, 'Date range:', startDate, '-', endDate);
    
    const [revenueResult] = await pool.execute(
      `SELECT 
        COUNT(*) as confirmedPayments,
        COALESCE(SUM(valor), 0) as totalRevenue
       FROM pagamentos 
       WHERE tenant_id = ? 
       AND status = 'confirmado'
       AND deleted_at IS NULL
       ${startDate && endDate ? 'AND data_pagamento BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );
    
    console.log('Revenue result:', revenueResult[0]);

    const [expensesResult] = await pool.execute(
      `SELECT 
        COUNT(*) as expenseCount,
        COALESCE(SUM(valor), 0) as totalExpenses
       FROM despesas 
       WHERE tenant_id = ? 
       AND deleted_at IS NULL
       ${startDate && endDate ? 'AND data_despesa BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    const [commissionsResult] = await pool.execute(
      `SELECT 
        COALESCE(SUM(valor_comissao), 0) as totalCommissions,
        COUNT(DISTINCT atendente_id) as attendantCount
       FROM pagamentos 
       WHERE tenant_id = ? 
       AND status = 'confirmado'
       AND deleted_at IS NULL
       ${startDate && endDate ? 'AND data_pagamento BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    // Calcular pendentes
    const [pendingResult] = await pool.execute(
      `SELECT 
        COUNT(*) as pendingPayments,
        COALESCE(SUM(valor), 0) as totalPending
       FROM pagamentos 
       WHERE tenant_id = ? 
       AND status = 'pendente'
       AND deleted_at IS NULL
       ${startDate && endDate ? 'AND data_pagamento BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
    );

    const totalRevenue = parseFloat(revenueResult[0].totalRevenue);
    const totalExpenses = parseFloat(expensesResult[0].totalExpenses);
    const totalCommissions = parseFloat(commissionsResult[0].totalCommissions);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    reportData.summary = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalCommissions,
      confirmedPayments: parseInt(revenueResult[0].confirmedPayments),
      expenseCount: parseInt(expensesResult[0].expenseCount),
      attendantCount: parseInt(commissionsResult[0].attendantCount),
      pendingPayments: parseInt(pendingResult[0].pendingPayments)
    };

    // Get expenses by category
    try {
      const [categoryData] = await pool.execute(
        `SELECT 
          COALESCE(categoria, 'Outros') as name,
          SUM(valor) as value,
          COUNT(*) as count
         FROM despesas 
         WHERE tenant_id = ? 
         AND deleted_at IS NULL
         ${startDate && endDate ? 'AND data_despesa BETWEEN ? AND ?' : ''}
         GROUP BY categoria
         ORDER BY value DESC`,
        startDate && endDate ? [tenantId, startDate, endDate] : [tenantId]
      );

      const totalExpensesForPercentage = categoryData.reduce((sum, cat) => sum + parseFloat(cat.value), 0);
      reportData.byCategory = categoryData.map(cat => ({
        name: cat.name,
        value: parseFloat(cat.value),
        count: parseInt(cat.count),
        percentage: totalExpensesForPercentage > 0 ? (parseFloat(cat.value) / totalExpensesForPercentage) * 100 : 0
      }));
    } catch (err) {
      console.log('Error fetching category data:', err.message);
      reportData.byCategory = [];
    }

    // Get top attendants
    try {
      const [attendantData] = await pool.execute(
        `SELECT 
          a.nome as name,
          COUNT(p.id) as salesCount,
          COALESCE(SUM(p.valor), 0) as totalSales,
          COALESCE(SUM(p.valor_comissao), 0) as totalCommission
         FROM atendentes a
         LEFT JOIN pagamentos p ON a.id = p.atendente_id 
          AND p.status = 'confirmado' 
          AND p.deleted_at IS NULL
          ${startDate && endDate ? 'AND p.data_pagamento BETWEEN ? AND ?' : ''}
         WHERE a.tenant_id = ? 
         AND a.deleted_at IS NULL
         GROUP BY a.id, a.nome
         ORDER BY totalCommission DESC
         LIMIT 10`,
        startDate && endDate ? [startDate, endDate, tenantId] : [tenantId]
      );

      reportData.byAttendant = attendantData.map(att => ({
        name: att.name,
        salesCount: parseInt(att.salesCount),
        totalSales: parseFloat(att.totalSales),
        totalCommission: parseFloat(att.totalCommission)
      }));
    } catch (err) {
      console.log('Error fetching attendant data:', err.message);
      reportData.byAttendant = [];
    }

    // Get top tripeiros
    try {
      const [tripeiroData] = await pool.execute(
        `SELECT 
          t.nome as name,
          COUNT(p.id) as paymentCount,
          COALESCE(SUM(CASE WHEN p.status = 'confirmado' THEN p.valor ELSE 0 END), 0) as totalPaid,
          COALESCE(SUM(CASE WHEN p.status = 'pendente' THEN p.valor ELSE 0 END), 0) as totalPending
         FROM tripeiros t
         LEFT JOIN pagamentos p ON t.id = p.tripeiro_id 
          AND p.deleted_at IS NULL
          ${startDate && endDate ? 'AND p.data_pagamento BETWEEN ? AND ?' : ''}
         WHERE t.tenant_id = ? 
         AND t.deleted_at IS NULL
         GROUP BY t.id, t.nome
         ORDER BY totalPaid DESC
         LIMIT 10`,
        startDate && endDate ? [startDate, endDate, tenantId] : [tenantId]
      );

      reportData.byTripeiro = tripeiroData.map(trip => ({
        name: trip.name,
        paymentCount: parseInt(trip.paymentCount),
        totalPaid: parseFloat(trip.totalPaid),
        totalPending: parseFloat(trip.totalPending)
      }));
    } catch (err) {
      console.log('Error fetching tripeiro data:', err.message);
      reportData.byTripeiro = [];
    }

    // Get monthly trend (last 6 months)
    try {
      const [trendData] = await pool.execute(
        `SELECT 
          DATE_FORMAT(data_pagamento, '%Y-%m') as month,
          SUM(CASE WHEN status = 'confirmado' THEN valor ELSE 0 END) as revenue,
          0 as expenses
         FROM pagamentos
         WHERE tenant_id = ? 
         AND deleted_at IS NULL
         AND data_pagamento >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(data_pagamento, '%Y-%m')
         ORDER BY month DESC
         LIMIT 6`,
        [tenantId]
      );

      // Get expenses for the same months
      const [expenseTrend] = await pool.execute(
        `SELECT 
          DATE_FORMAT(data_despesa, '%Y-%m') as month,
          SUM(valor) as expenses
         FROM despesas
         WHERE tenant_id = ? 
         AND deleted_at IS NULL
         AND data_despesa >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(data_despesa, '%Y-%m')`,
        [tenantId]
      );

      // Merge revenue and expenses data
      const trendMap = {};
      trendData.forEach(item => {
        trendMap[item.month] = { 
          month: item.month, 
          revenue: parseFloat(item.revenue), 
          expenses: 0 
        };
      });
      
      expenseTrend.forEach(item => {
        if (trendMap[item.month]) {
          trendMap[item.month].expenses = parseFloat(item.expenses);
        } else {
          trendMap[item.month] = { 
            month: item.month, 
            revenue: 0, 
            expenses: parseFloat(item.expenses) 
          };
        }
      });

      reportData.monthlyTrend = Object.values(trendMap)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(item => ({
          ...item,
          month: formatMonth(item.month)
        }));
    } catch (err) {
      console.log('Error fetching trend data:', err.message);
      reportData.monthlyTrend = [];
    }

    console.log('Report generated successfully:', {
      revenue: reportData.summary.totalRevenue,
      expenses: reportData.summary.totalExpenses,
      categories: reportData.byCategory.length,
      attendants: reportData.byAttendant.length,
      tripeiros: reportData.byTripeiro.length,
      trends: reportData.monthlyTrend.length
    });

    res.json(reportData);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ 
      message: 'Error generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export report to different formats
const exportReport = async (req, res) => {
  const tenantId = req.tenantId || 1;
  const { type = 'financial', startDate, endDate, format = 'pdf' } = req.query;
  
  try {
    // First get the report data
    const reportData = await getReportData(tenantId, type, startDate, endDate);
    
    if (format === 'excel') {
      await exportToExcel(res, reportData, startDate, endDate);
    } else if (format === 'pdf') {
      await exportToPDF(res, reportData, startDate, endDate);
    } else {
      res.status(400).json({ message: 'Invalid export format' });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ 
      message: 'Error exporting report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get report data
async function getReportData(tenantId, type, startDate, endDate) {
  // Similar logic to generateReport but returning raw data
  const reportData = {
    summary: {},
    details: []
  };
  
  // Implementation would be similar to generateReport
  // but structured for export
  
  return reportData;
}

// Export to Excel
async function exportToExcel(res, reportData, startDate, endDate) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório Financeiro');
  
  // Add headers
  worksheet.columns = [
    { header: 'Data', key: 'date', width: 15 },
    { header: 'Descrição', key: 'description', width: 30 },
    { header: 'Tipo', key: 'type', width: 15 },
    { header: 'Valor', key: 'value', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];
  
  // Add data rows
  // This would be populated with actual data
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=relatorio_${startDate}_${endDate}.xlsx`);
  
  // Write to response
  await workbook.xlsx.write(res);
  res.end();
}

// Export to PDF
async function exportToPDF(res, reportData, startDate, endDate) {
  const doc = new PDFDocument();
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=relatorio_${startDate}_${endDate}.pdf`);
  
  // Pipe to response
  doc.pipe(res);
  
  // Add content
  doc.fontSize(20).text('Relatório Financeiro', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Período: ${startDate} até ${endDate}`);
  doc.moveDown();
  
  // Add summary
  doc.fontSize(14).text('Resumo', { underline: true });
  doc.fontSize(12);
  doc.text(`Receita Total: R$ ${reportData.summary.totalRevenue || 0}`);
  doc.text(`Despesas Total: R$ ${reportData.summary.totalExpenses || 0}`);
  doc.text(`Lucro Líquido: R$ ${reportData.summary.netProfit || 0}`);
  
  // Finalize PDF
  doc.end();
}

// Helper function to format month
function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]}/${year.substr(2)}`;
}

module.exports = {
  generateReport,
  exportReport
};