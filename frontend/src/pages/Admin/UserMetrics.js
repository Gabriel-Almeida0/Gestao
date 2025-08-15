import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import './UserMetrics.css';

const UserMetrics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [metricsData, setMetricsData] = useState({
    user: null,
    metrics: {
      payments: { count: 0, totalValue: 0, totalCommission: 0 },
      expenses: { count: 0, totalValue: 0 },
      receivables: { count: 0, totalValue: 0 },
      summary: { totalRevenue: 0, totalExpenses: 0, netResult: 0, profitMargin: 0 }
    },
    recentActivity: []
  });

  useEffect(() => {
    fetchUserMetrics();
  }, [id, dateRange]);

  const fetchUserMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserMetrics(id, dateRange);
      setMetricsData(response.data);
    } catch (error) {
      console.error('Error fetching user metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionLabel = (action) => {
    const labels = {
      'CREATE': 'Criou',
      'UPDATE': 'Atualizou',
      'DELETE': 'Removeu',
      'LOGIN': 'Fez login',
      'LOGOUT': 'Fez logout'
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity) => {
    const labels = {
      'user': 'Usuário',
      'payment': 'Pagamento',
      'expense': 'Despesa',
      'attendant': 'Atendente',
      'tripeiro': 'Tripeiro',
      'note': 'Nota',
      'reminder': 'Lembrete'
    };
    return labels[entity] || entity;
  };

  if (loading) {
    return (
      <div className="user-metrics-loading">
        <div className="spinner"></div>
        <p>Carregando métricas do usuário...</p>
      </div>
    );
  }

  if (!metricsData.user) {
    return (
      <div className="user-metrics-error">
        <p>Usuário não encontrado</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="user-metrics">
      <div className="user-metrics-header">
        <div>
          <h1>Métricas do Usuário</h1>
          <div className="user-info">
            <h2>{metricsData.user.name}</h2>
            <span className="user-email">{metricsData.user.email}</span>
            <span className={`role-badge ${metricsData.user.role}`}>
              {metricsData.user.role === 'admin' ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/admin/users')}
        >
          Voltar
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="date-filter">
        <div className="date-input-group">
          <label>Data Inicial:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>
        <div className="date-input-group">
          <label>Data Final:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-cards">
        <div className="metric-card">
          <div className="metric-icon payments-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Pagamentos</h3>
            <p className="metric-value">{metricsData.metrics.payments.count}</p>
            <p className="metric-total">{formatCurrency(metricsData.metrics.payments.totalValue)}</p>
            <p className="metric-detail">
              Comissões: {formatCurrency(metricsData.metrics.payments.totalCommission)}
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon expenses-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Despesas</h3>
            <p className="metric-value">{metricsData.metrics.expenses.count}</p>
            <p className="metric-total expense">{formatCurrency(metricsData.metrics.expenses.totalValue)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon receivables-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Recebimentos</h3>
            <p className="metric-value">{metricsData.metrics.receivables.count}</p>
            <p className="metric-total">{formatCurrency(metricsData.metrics.receivables.totalValue)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Resumo Financeiro</h3>
            <p className="metric-label">Receita Total:</p>
            <p className="metric-total revenue">{formatCurrency(metricsData.metrics.summary.totalRevenue)}</p>
            <p className="metric-label">Despesas Total:</p>
            <p className="metric-total expense">{formatCurrency(metricsData.metrics.summary.totalExpenses)}</p>
            <p className="metric-label">Resultado Líquido:</p>
            <p className={`metric-total ${metricsData.metrics.summary.netResult >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(metricsData.metrics.summary.netResult)}
            </p>
            <p className="metric-label">Margem de Lucro:</p>
            <p className="metric-percentage">{metricsData.metrics.summary.profitMargin}%</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>Atividade Recente</h2>
        <div className="activity-table">
          {metricsData.recentActivity.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Ação</th>
                  <th>Tipo</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {metricsData.recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td>{formatDate(activity.created_at)}</td>
                    <td>{getActionLabel(activity.action)}</td>
                    <td>{getEntityLabel(activity.entity_type)}</td>
                    <td>#{activity.entity_id || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-activity">Nenhuma atividade registrada para este usuário</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMetrics;