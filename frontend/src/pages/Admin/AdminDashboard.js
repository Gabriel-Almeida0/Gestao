import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 0,
      totalTenants: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    },
    usersByRole: [],
    recentActivity: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAdminDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      'tripeiro': 'Tripeiro'
    };
    return labels[entity] || entity;
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando dashboard administrativo...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Dashboard Administrativo</h1>
        <div className="admin-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/users')}
          >
            Gerenciar Usuários
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="admin-overview-cards">
        <div className="admin-card">
          <div className="admin-card-icon users-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="admin-card-content">
            <h3>Total de Usuários</h3>
            <p className="admin-card-value">{dashboardData.overview.totalUsers}</p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-icon tenants-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l8-4v18"></path>
              <path d="M19 21V11l-6-4"></path>
              <rect x="9" y="9" width="4" height="4"></rect>
              <rect x="9" y="14" width="4" height="4"></rect>
            </svg>
          </div>
          <div className="admin-card-content">
            <h3>Empresas Ativas</h3>
            <p className="admin-card-value">{dashboardData.overview.totalTenants}</p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-icon revenue-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="admin-card-content">
            <h3>Receita Total</h3>
            <p className="admin-card-value revenue">
              {formatCurrency(dashboardData.overview.totalRevenue)}
            </p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-icon profit-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="admin-card-content">
            <h3>Lucro Líquido</h3>
            <p className={`admin-card-value ${dashboardData.overview.netProfit >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(dashboardData.overview.netProfit)}
            </p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        {/* Users by Role */}
        <div className="admin-section">
          <h2>Usuários por Função</h2>
          <div className="users-by-role">
            {dashboardData.usersByRole.map(role => (
              <div key={role.role} className="role-item">
                <span className="role-label">
                  {role.role === 'admin' ? 'Administradores' : 'Usuários'}
                </span>
                <span className="role-count">{role.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-section">
          <h2>Atividade Recente</h2>
          <div className="activity-list">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-user">{activity.user_name || 'Sistema'}</span>
                    <span className="activity-action">
                      {getActionLabel(activity.action)} {getEntityLabel(activity.entity_type)}
                    </span>
                  </div>
                  <span className="activity-time">{formatDate(activity.created_at)}</span>
                </div>
              ))
            ) : (
              <p className="no-activity">Nenhuma atividade recente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;