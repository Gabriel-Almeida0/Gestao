import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import './Attendants.css';

const Attendants = () => {
  const navigate = useNavigate();
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommissionsModal, setShowCommissionsModal] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [editingAttendant, setEditingAttendant] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    comissao_percentual: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchAttendants();
  }, [currentPage, filterActive]);

  const fetchAttendants = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };

      if (filterActive !== '') {
        params.ativo = filterActive;
      }

      const response = await api.get('/attendants', { params });
      setAttendants(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar atendentes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async (attendantId) => {
    try {
      const response = await api.get(`/attendants/${attendantId}/commissions`);
      setCommissions(response.data.data);
      setSelectedAttendant(attendants.find(a => a.id === attendantId));
      setShowCommissionsModal(true);
    } catch (err) {
      alert('Erro ao carregar comissões');
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAttendant) {
        await api.put(`/attendants/${editingAttendant.id}`, formData);
      } else {
        await api.post('/attendants', formData);
      }
      
      setShowAddModal(false);
      setEditingAttendant(null);
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        comissao_percentual: '',
        observacoes: ''
      });
      fetchAttendants();
    } catch (err) {
      alert('Erro ao salvar atendente');
      console.error(err);
    }
  };

  const handleEdit = (attendant) => {
    setEditingAttendant(attendant);
    setFormData({
      nome: attendant.nome,
      telefone: attendant.telefone || '',
      email: attendant.email || '',
      comissao_percentual: attendant.comissao_percentual,
      observacoes: attendant.observacoes || ''
    });
    setShowAddModal(true);
  };

  const handleToggleActive = async (attendant) => {
    try {
      await api.put(`/attendants/${attendant.id}`, {
        ativo: attendant.ativo ? 0 : 1
      });
      fetchAttendants();
    } catch (err) {
      alert('Erro ao atualizar status');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este atendente?')) {
      try {
        await api.delete(`/attendants/${id}`);
        fetchAttendants();
      } catch (err) {
        alert(err.response?.data?.message || 'Erro ao excluir atendente');
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
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
      return dateObj.toLocaleDateString('pt-BR');
    } catch (err) {
      console.error('Error formatting date:', date, err);
      return '-';
    }
  };

  const filteredAttendants = attendants.filter(attendant => {
    const matchesSearch = attendant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (attendant.email && attendant.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (attendant.telefone && attendant.telefone.includes(searchTerm));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando atendentes...</p>
      </div>
    );
  }

  return (
    <div className="attendants-container">
      <div className="page-header">
        <div className="header-content">
          <h1><Users size={28} /> Atendentes</h1>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Novo Atendente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar atendente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="filter-select"
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      {/* Attendants Grid */}
      <div className="attendants-grid">
        {filteredAttendants.length > 0 ? (
          filteredAttendants.map(attendant => (
            <div key={attendant.id} className={`attendant-card ${!attendant.ativo ? 'inactive' : ''}`}>
              <div className="card-header">
                <div className="attendant-avatar">
                  {attendant.nome.charAt(0).toUpperCase()}
                </div>
                <div className="attendant-info">
                  <h3>{attendant.nome}</h3>
                  <p className="email">{attendant.email || 'Sem email'}</p>
                  <p className="phone">{attendant.telefone || 'Sem telefone'}</p>
                </div>
              </div>

              <div className="card-stats">
                <div className="stat">
                  <Award size={16} />
                  <span className="stat-label">Comissão</span>
                  <span className="stat-value">{attendant.comissao_percentual}%</span>
                </div>
                <div className="stat">
                  <TrendingUp size={16} />
                  <span className="stat-label">Vendas</span>
                  <span className="stat-value">{attendant.total_payments || 0}</span>
                </div>
                <div className="stat">
                  <DollarSign size={16} />
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{formatCurrency(attendant.total_commissions)}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-action view"
                  onClick={() => fetchCommissions(attendant.id)}
                  title="Ver comissões"
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="btn-action edit"
                  onClick={() => handleEdit(attendant)}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className={`btn-action toggle ${attendant.ativo ? 'active' : ''}`}
                  onClick={() => handleToggleActive(attendant)}
                  title={attendant.ativo ? 'Desativar' : 'Ativar'}
                >
                  {attendant.ativo ? '✓' : '✗'}
                </button>
                <button 
                  className="btn-action delete"
                  onClick={() => handleDelete(attendant.id)}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>Nenhum atendente encontrado</h3>
            <p>Comece adicionando um novo atendente</p>
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
              <h2>{editingAttendant ? 'Editar Atendente' : 'Novo Atendente'}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAttendant(null);
                  setFormData({
                    nome: '',
                    telefone: '',
                    email: '',
                    comissao_percentual: '',
                    observacoes: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Percentual de Comissão *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.comissao_percentual}
                  onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
                  required
                />
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
                    setEditingAttendant(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingAttendant ? 'Salvar Alterações' : 'Adicionar Atendente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commissions Modal */}
      {showCommissionsModal && selectedAttendant && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>Comissões de {selectedAttendant.nome}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowCommissionsModal(false);
                  setSelectedAttendant(null);
                  setCommissions([]);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {commissions.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Tripeiro</th>
                      <th>Valor Venda</th>
                      <th>Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(commission => (
                      <tr key={commission.id}>
                        <td>{formatDate(commission.data_pagamento)}</td>
                        <td>{commission.descricao}</td>
                        <td>{commission.tripeiro_name || '-'}</td>
                        <td>{formatCurrency(commission.valor)}</td>
                        <td className="commission-value">{formatCurrency(commission.valor_comissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>Nenhuma comissão encontrada para este atendente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendants;