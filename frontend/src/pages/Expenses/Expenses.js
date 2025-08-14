import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Edit2,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import './Expenses.css';

const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: { total_expenses: 0, total_amount: 0 },
    byCategory: []
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_despesa: format(new Date(), 'yyyy-MM-dd'),
    categoria: '',
    observacoes: ''
  });

  const categories = [
    'Alimentação',
    'Transporte',
    'Hospedagem',
    'Material de Escritório',
    'Marketing',
    'Salários',
    'Impostos',
    'Manutenção',
    'Outros'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [currentPage, selectedCategory, dateRange]);

  const fetchExpenses = async () => {
    try {
      // Only set loading if we don't have data yet
      if (expenses.length === 0) {
        setLoading(true);
      }
      
      const params = {
        page: currentPage,
        limit: 20
      };

      if (selectedCategory) params.categoria = selectedCategory;
      if (dateRange.start && dateRange.end) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }

      const response = await api.get('/expenses', { params });
      setExpenses(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar despesas');
      console.error(err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (dateRange.start && dateRange.end) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }

      const response = await api.get('/expenses/stats', { params });
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData);
      } else {
        await api.post('/expenses', formData);
      }
      
      setShowAddModal(false);
      setEditingExpense(null);
      setFormData({
        descricao: '',
        valor: '',
        data_despesa: format(new Date(), 'yyyy-MM-dd'),
        categoria: '',
        observacoes: ''
      });
      fetchExpenses();
      fetchStats();
    } catch (err) {
      alert('Erro ao salvar despesa');
      console.error(err);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      descricao: expense.descricao,
      valor: expense.valor,
      data_despesa: expense.data_despesa.split('T')[0],
      categoria: expense.categoria,
      observacoes: expense.observacoes || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
        fetchStats();
      } catch (err) {
        alert('Erro ao excluir despesa');
        console.error(err);
      }
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
      // Handle different date formats
      let dateObj;
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        dateObj = new Date(date + 'T00:00:00');
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
      
      return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch (err) {
      console.error('Error formatting date:', date, err);
      return '-';
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && expenses.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando despesas...</p>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      <div className="page-header">
        <div className="header-content">
          <h1><Receipt size={28} /> Despesas</h1>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Nova Despesa
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total de Despesas</h3>
            <p className="stat-value negative">{formatCurrency(stats.total.total_amount)}</p>
            <span className="stat-label">{stats.total.total_expenses} registros</span>
          </div>
        </div>

        {stats.byCategory.slice(0, 3).map((cat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon category">
              <Receipt size={24} />
            </div>
            <div className="stat-content">
              <h3>{cat.categoria}</h3>
              <p className="stat-value">{formatCurrency(cat.total_value)}</p>
              <span className="stat-label">{cat.total_count} despesas</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar despesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="date-filters">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
          />
          <span>até</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="table-container">
        {filteredExpenses.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.data_despesa)}</td>
                  <td>{expense.descricao}</td>
                  <td>
                    <span className="category-badge">{expense.categoria}</span>
                  </td>
                  <td className="amount negative">{formatCurrency(expense.valor)}</td>
                  <td>{expense.observacoes || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon"
                        onClick={() => handleEdit(expense)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleDelete(expense.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>Nenhuma despesa encontrada</h3>
            <p>Comece adicionando uma nova despesa</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingExpense(null);
                  setFormData({
                    descricao: '',
                    valor: '',
                    data_despesa: format(new Date(), 'yyyy-MM-dd'),
                    categoria: '',
                    observacoes: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    value={formData.data_despesa}
                    onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoria *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExpense(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingExpense ? 'Salvar Alterações' : 'Adicionar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;