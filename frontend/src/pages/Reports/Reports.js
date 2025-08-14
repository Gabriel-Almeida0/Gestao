import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  MapPin,
  PieChart,
  BarChart,
  Filter,
  Printer,
  Share2,
  Eye
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('financial');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('thisMonth');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalCommissions: 0,
      pendingPayments: 0,
      confirmedPayments: 0,
      expenseCount: 0,
      attendantCount: 0,
      profitMargin: 0
    },
    byCategory: [],
    byAttendant: [],
    byTripeiro: [],
    monthlyTrend: [],
    topProducts: [],
    paymentMethods: []
  });

  const reportTypes = [
    { value: 'financial', label: 'Financeiro Geral', icon: DollarSign },
    { value: 'attendants', label: 'Por Atendentes', icon: Users },
    { value: 'tripeiros', label: 'Por Tripeiros', icon: MapPin },
    { value: 'expenses', label: 'Análise de Despesas', icon: TrendingDown },
    { value: 'commissions', label: 'Comissões', icon: TrendingUp },
    { value: 'custom', label: 'Personalizado', icon: Filter }
  ];

  const quickFilters = [
    { label: 'Este Mês', value: 'thisMonth' },
    { label: 'Mês Passado', value: 'lastMonth' },
    { label: 'Últimos 3 Meses', value: 'last3Months' },
    { label: 'Este Ano', value: 'thisYear' },
    { label: 'Personalizado', value: 'custom' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end
      };

      console.log('Fetching report with params:', params);
      const response = await api.get('/reports/generate', { params });
      console.log('Report data received:', response.data);
      
      if (response.data) {
        setReportData(response.data);
      } else {
        console.warn('No data received from API');
      }
    } catch (error) {
      console.error('Error fetching report data:', error.response || error);
      
      // Set empty data on error to avoid showing stale data
      setReportData({
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          totalCommissions: 0,
          pendingPayments: 0,
          confirmedPayments: 0,
          expenseCount: 0,
          attendantCount: 0,
          profitMargin: 0
        },
        byCategory: [],
        byAttendant: [],
        byTripeiro: [],
        monthlyTrend: [],
        topProducts: [],
        paymentMethods: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (filter) => {
    setSelectedQuickFilter(filter);
    
    if (filter === 'custom') {
      return;
    }
    
    const today = new Date();
    let start, end;

    switch (filter) {
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'last3Months':
        start = startOfMonth(subMonths(today, 2));
        end = endOfMonth(today);
        break;
      case 'thisYear':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      default:
        return;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const handleExport = async (formatType) => {
    try {
      const params = {
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        format: formatType
      };

      const response = await api.get('/reports/export', { 
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = formatType === 'excel' ? 'xlsx' : formatType;
      const filename = `relatorio_${reportType}_${dateRange.start}_${dateRange.end}.${extension}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Funcionalidade de exportação em desenvolvimento.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareData = {
      title: 'Relatório Financeiro',
      text: `Relatório ${reportType} - Período: ${formatDate(dateRange.start)} até ${formatDate(dateRange.end)}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.log('Error sharing:', err));
    } else {
      alert('Compartilhamento não suportado neste navegador.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const renderFinancialReport = () => (
    <>
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card revenue">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3>Receita Total</h3>
            <p className="value">{formatCurrency(reportData.summary.totalRevenue)}</p>
            <span className="label">{reportData.summary.confirmedPayments} pagamentos confirmados</span>
          </div>
        </div>

        <div className="summary-card expenses">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <h3>Despesas Total</h3>
            <p className="value">{formatCurrency(reportData.summary.totalExpenses)}</p>
            <span className="label">{reportData.summary.expenseCount || 0} despesas registradas</span>
          </div>
        </div>

        <div className="summary-card profit">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <h3>Lucro Líquido</h3>
            <p className="value">{formatCurrency(reportData.summary.netProfit)}</p>
            <span className={`label ${reportData.summary.profitMargin >= 0 ? 'positive' : 'negative'}`}>
              Margem: {formatPercent(reportData.summary.profitMargin)}
            </span>
          </div>
        </div>

        <div className="summary-card commissions">
          <div className="card-icon">
            <Users size={24} />
          </div>
          <div className="card-content">
            <h3>Comissões</h3>
            <p className="value">{formatCurrency(reportData.summary.totalCommissions)}</p>
            <span className="label">{reportData.summary.attendantCount || 0} atendentes ativos</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Monthly Trend Chart */}
        <div className="chart-container">
          <h3>Tendência Mensal</h3>
          <div className="trend-chart">
            {reportData.monthlyTrend.length > 0 ? (
              (() => {
                const maxValue = Math.max(
                  ...reportData.monthlyTrend.map(m => Math.max(m.revenue || 0, m.expenses || 0))
                );
                return reportData.monthlyTrend.map((month, index) => (
                  <div key={index} className="month-bar">
                    <div className="bars">
                      <div 
                        className="bar revenue-bar" 
                        style={{ 
                          height: `${maxValue > 0 ? ((month.revenue || 0) / maxValue) * 150 : 5}px` 
                        }}
                        title={`Receita: ${formatCurrency(month.revenue || 0)}`}
                      />
                      <div 
                        className="bar expense-bar" 
                        style={{ 
                          height: `${maxValue > 0 ? ((month.expenses || 0) / maxValue) * 150 : 5}px` 
                        }}
                        title={`Despesas: ${formatCurrency(month.expenses || 0)}`}
                      />
                    </div>
                    <span className="month-label">{month.month}</span>
                  </div>
                ));
              })()
            ) : (
              <p className="empty">Sem dados de tendência</p>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-container">
          <h3>Despesas por Categoria</h3>
          <div className="category-list">
            {reportData.byCategory.length > 0 ? (
              reportData.byCategory.map((cat, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{cat.name}</span>
                    <span className="category-value">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${cat.percentage}%`,
                        background: `hsl(${250 - index * 30}, 70%, 60%)`
                      }}
                    />
                  </div>
                  <span className="category-percent">{formatPercent(cat.percentage)}</span>
                </div>
              ))
            ) : (
              <p className="empty">Sem despesas categorizadas</p>
            )}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="tables-grid">
        {/* Top Attendants */}
        <div className="table-container">
          <div className="table-header">
            <h3><Users size={20} /> Top Atendentes</h3>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Vendas</th>
                <th>Total</th>
                <th>Comissão</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byAttendant.length > 0 ? (
                reportData.byAttendant.slice(0, 5).map((att, index) => (
                  <tr key={index}>
                    <td>{att.name}</td>
                    <td>{att.salesCount}</td>
                    <td>{formatCurrency(att.totalSales)}</td>
                    <td>{formatCurrency(att.totalCommission)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">Sem dados para exibir</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Tripeiros */}
        <div className="table-container">
          <div className="table-header">
            <h3><MapPin size={20} /> Top Tripeiros</h3>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Pagamentos</th>
                <th>Total Pago</th>
                <th>Pendente</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byTripeiro.length > 0 ? (
                reportData.byTripeiro.slice(0, 5).map((trip, index) => (
                  <tr key={index}>
                    <td>{trip.name}</td>
                    <td>{trip.paymentCount}</td>
                    <td>{formatCurrency(trip.totalPaid)}</td>
                    <td>{formatCurrency(trip.totalPending)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">Sem dados para exibir</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderAttendantsReport = () => (
    <div className="report-section">
      <h2>Relatório por Atendentes</h2>
      <div className="tables-grid">
        <div className="table-container" style={{ gridColumn: 'span 2' }}>
          <div className="table-header">
            <h3><Users size={20} /> Desempenho dos Atendentes</h3>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Atendente</th>
                <th>Total de Vendas</th>
                <th>Valor Total</th>
                <th>Comissão Total</th>
                <th>Média por Venda</th>
                <th>% Comissão</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byAttendant.length > 0 ? (
                reportData.byAttendant.map((att, index) => (
                  <tr key={index}>
                    <td>{att.name}</td>
                    <td>{att.salesCount}</td>
                    <td>{formatCurrency(att.totalSales)}</td>
                    <td>{formatCurrency(att.totalCommission)}</td>
                    <td>{formatCurrency(att.salesCount > 0 ? att.totalSales / att.salesCount : 0)}</td>
                    <td>{att.totalSales > 0 ? formatPercent((att.totalCommission / att.totalSales) * 100) : '0%'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty">Nenhum dado disponível para o período selecionado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTripeirosReport = () => (
    <div className="report-section">
      <h2>Relatório por Tripeiros</h2>
      <div className="tables-grid">
        <div className="table-container" style={{ gridColumn: 'span 2' }}>
          <div className="table-header">
            <h3><MapPin size={20} /> Análise de Tripeiros</h3>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Tripeiro</th>
                <th>Total de Pagamentos</th>
                <th>Valor Pago</th>
                <th>Valor Pendente</th>
                <th>Total Geral</th>
                <th>% Quitado</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byTripeiro.length > 0 ? (
                reportData.byTripeiro.map((trip, index) => {
                  const total = trip.totalPaid + trip.totalPending;
                  const paidPercent = total > 0 ? (trip.totalPaid / total) * 100 : 0;
                  return (
                    <tr key={index}>
                      <td>{trip.name}</td>
                      <td>{trip.paymentCount}</td>
                      <td>{formatCurrency(trip.totalPaid)}</td>
                      <td>{formatCurrency(trip.totalPending)}</td>
                      <td>{formatCurrency(total)}</td>
                      <td>{formatPercent(paidPercent)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty">Nenhum dado disponível para o período selecionado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpensesReport = () => (
    <div className="report-section">
      <h2>Análise de Despesas</h2>
      <div className="summary-grid">
        <div className="summary-card expenses">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <h3>Total de Despesas</h3>
            <p className="value">{formatCurrency(reportData.summary.totalExpenses)}</p>
            <span className="label">{reportData.summary.expenseCount || 0} despesas no período</span>
          </div>
        </div>
      </div>
      
      <div className="charts-grid">
        <div className="chart-container" style={{ gridColumn: 'span 2' }}>
          <h3>Distribuição por Categoria</h3>
          <div className="category-list">
            {reportData.byCategory.length > 0 ? (
              reportData.byCategory.map((cat, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{cat.name}</span>
                    <span className="category-value">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${cat.percentage}%`,
                        background: `hsl(${250 - index * 30}, 70%, 60%)`
                      }}
                    />
                  </div>
                  <span className="category-percent">{formatPercent(cat.percentage)}</span>
                </div>
              ))
            ) : (
              <p className="empty">Nenhuma despesa registrada no período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommissionsReport = () => (
    <div className="report-section">
      <h2>Relatório de Comissões</h2>
      <div className="summary-grid">
        <div className="summary-card commissions">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3>Total em Comissões</h3>
            <p className="value">{formatCurrency(reportData.summary.totalCommissions)}</p>
            <span className="label">{reportData.summary.attendantCount || 0} atendentes com comissões</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <h3>Média de Comissão</h3>
            <p className="value">
              {formatCurrency(
                reportData.summary.attendantCount > 0 
                  ? reportData.summary.totalCommissions / reportData.summary.attendantCount 
                  : 0
              )}
            </p>
            <span className="label">Por atendente</span>
          </div>
        </div>
      </div>
      
      <div className="tables-grid">
        <div className="table-container" style={{ gridColumn: 'span 2' }}>
          <div className="table-header">
            <h3><Users size={20} /> Detalhamento de Comissões</h3>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Atendente</th>
                <th>Vendas</th>
                <th>Total Vendas</th>
                <th>Comissão</th>
                <th>% Médio</th>
                <th>Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byAttendant.length > 0 ? (
                reportData.byAttendant.map((att, index) => (
                  <tr key={index}>
                    <td>{att.name}</td>
                    <td>{att.salesCount}</td>
                    <td>{formatCurrency(att.totalSales)}</td>
                    <td>{formatCurrency(att.totalCommission)}</td>
                    <td>{att.totalSales > 0 ? formatPercent((att.totalCommission / att.totalSales) * 100) : '0%'}</td>
                    <td>{formatCurrency(att.salesCount > 0 ? att.totalSales / att.salesCount : 0)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty">Nenhuma comissão registrada no período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCustomReport = () => (
    <div className="report-section">
      <h2>Relatório Personalizado</h2>
      <div className="custom-report-info">
        <p>Selecione o período desejado usando os filtros acima para gerar um relatório personalizado.</p>
        <p>Este relatório combina dados de todos os módulos disponíveis.</p>
      </div>
      {renderFinancialReport()}
    </div>
  );

  const renderReportContent = () => {
    switch (reportType) {
      case 'financial':
        return renderFinancialReport();
      case 'attendants':
        return renderAttendantsReport();
      case 'tripeiros':
        return renderTripeirosReport();
      case 'expenses':
        return renderExpensesReport();
      case 'commissions':
        return renderCommissionsReport();
      case 'custom':
        return renderCustomReport();
      default:
        return renderFinancialReport();
    }
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <div className="header-content">
          <h1><FileText size={28} /> Relatórios</h1>
          <div className="header-actions">

            <button className="btn-action primary" onClick={handlePrint}>
                <Printer size={20} /> Imprimir
              </button>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="report-types">
        {reportTypes.map(type => (
          <button
            key={type.value}
            className={`report-type-btn ${reportType === type.value ? 'active' : ''}`}
            onClick={() => setReportType(type.value)}
          >
            <type.icon size={20} />
            {type.label}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="quick-filters">
          {quickFilters.map(filter => (
            <button
              key={filter.value}
              className={`filter-btn ${selectedQuickFilter === filter.value ? 'active' : ''}`}
              onClick={() => handleQuickFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <div className="date-filters">
          <div className="date-input-group">
            <label>De:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange({ ...dateRange, start: e.target.value });
                setSelectedQuickFilter('custom');
              }}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>Até:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange({ ...dateRange, end: e.target.value });
                setSelectedQuickFilter('custom');
              }}
              className="date-input"
            />
          </div>
          <button className="btn-apply" onClick={fetchReportData}>
            <Filter size={16} /> Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Gerando relatório...</p>
          </div>
        ) : (
          renderReportContent()
        )}
      </div>

      {/* Report Footer */}
      <div className="report-footer">
        <p>Relatório gerado em {formatDate(new Date())} às {format(new Date(), 'HH:mm')}</p>
        <p>Período: {formatDate(dateRange.start)} até {formatDate(dateRange.end)}</p>
      </div>
    </div>
  );
};

export default Reports;