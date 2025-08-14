import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  DollarSign,
  CreditCard,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  Map
} from 'lucide-react';
import api from '../../services/api';
import './Tripeiros.css';

const Tripeiros = () => {
  const navigate = useNavigate();
  const [tripeiros, setTripeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTripeiro, setSelectedTripeiro] = useState(null);
  const [tripeiroDetails, setTripeiroDetails] = useState(null);
  const [editingTripeiro, setEditingTripeiro] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchTripeiros();
  }, [currentPage, filterActive, searchTerm]);

  const fetchTripeiros = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };

      if (filterActive !== '') {
        params.ativo = filterActive;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/tripeiros', { params });
      setTripeiros(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar tripeiros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripeiroDetails = async (id) => {
    try {
      const response = await api.get(`/tripeiros/${id}`);
      setTripeiroDetails(response.data);
      setSelectedTripeiro(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      alert('Erro ao carregar detalhes do tripeiro');
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTripeiro) {
        await api.put(`/tripeiros/${editingTripeiro.id}`, formData);
      } else {
        await api.post('/tripeiros', formData);
      }
      
      setShowAddModal(false);
      setEditingTripeiro(null);
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: ''
      });
      fetchTripeiros();
    } catch (err) {
      alert('Erro ao salvar tripeiro');
      console.error(err);
    }
  };

  const handleEdit = (tripeiro) => {
    setEditingTripeiro(tripeiro);
    setFormData({
      nome: tripeiro.nome,
      telefone: tripeiro.telefone || '',
      email: tripeiro.email || '',
      endereco: tripeiro.endereco || '',
      cidade: tripeiro.cidade || '',
      estado: tripeiro.estado || '',
      cep: tripeiro.cep || '',
      observacoes: tripeiro.observacoes || ''
    });
    setShowAddModal(true);
  };

  const handleToggleActive = async (tripeiro) => {
    try {
      await api.put(`/tripeiros/${tripeiro.id}`, {
        ativo: tripeiro.ativo ? 0 : 1
      });
      fetchTripeiros();
    } catch (err) {
      alert('Erro ao atualizar status');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este tripeiro?')) {
      try {
        await api.delete(`/tripeiros/${id}`);
        fetchTripeiros();
      } catch (err) {
        alert(err.response?.data?.message || 'Erro ao excluir tripeiro');
        console.error(err);
      }
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.post(`/tripeiros/${selectedTripeiro.id}/accounts`, {
        numero_conta: formData.get('numero_conta'),
        descricao: formData.get('descricao'),
        limite_credito: formData.get('limite_credito'),
        saldo_devedor: formData.get('saldo_devedor'),
        observacoes: formData.get('observacoes')
      });
      alert('Conta adicionada com sucesso!');
      fetchTripeiroDetails(selectedTripeiro.id);
      e.target.reset();
    } catch (err) {
      alert('Erro ao adicionar conta');
      console.error(err);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando tripeiros...</p>
      </div>
    );
  }

  return (
    <div className="tripeiros-container">
      <div className="page-header">
        <div className="header-content">
          <h1><MapPin size={28} /> Tripeiros</h1>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Novo Tripeiro
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar tripeiro..."
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

      {/* Tripeiros Grid */}
      <div className="tripeiros-grid">
        {tripeiros.length > 0 ? (
          tripeiros.map(tripeiro => (
            <div key={tripeiro.id} className={`tripeiro-card ${!tripeiro.ativo ? 'inactive' : ''}`}>
              <div className="card-header">
                <div className="tripeiro-avatar">
                  {tripeiro.nome.charAt(0).toUpperCase()}
                </div>
                <div className="tripeiro-info">
                  <h3>{tripeiro.nome}</h3>
                  <div className="contact-info">
                    {tripeiro.email && (
                      <span className="info-item">
                        <Mail size={14} /> {tripeiro.email}
                      </span>
                    )}
                    {tripeiro.telefone && (
                      <span className="info-item">
                        <Phone size={14} /> {tripeiro.telefone}
                      </span>
                    )}
                    {tripeiro.cidade && tripeiro.estado && (
                      <span className="info-item">
                        <Map size={14} /> {tripeiro.cidade}, {tripeiro.estado}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-stats">
                <div className="stat">
                  <CreditCard size={16} />
                  <span className="stat-label">Contas</span>
                  <span className="stat-value">{tripeiro.total_accounts || 0}</span>
                </div>
                <div className="stat">
                  <DollarSign size={16} />
                  <span className="stat-label">Saldo Devedor</span>
                  <span className="stat-value negative">{formatCurrency(tripeiro.total_debt)}</span>
                </div>
                <div className="stat">
                  <DollarSign size={16} />
                  <span className="stat-label">Pagamentos</span>
                  <span className="stat-value">{tripeiro.total_payments || 0}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-action view"
                  onClick={() => fetchTripeiroDetails(tripeiro.id)}
                  title="Ver detalhes"
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="btn-action edit"
                  onClick={() => handleEdit(tripeiro)}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className={`btn-action toggle ${tripeiro.ativo ? 'active' : ''}`}
                  onClick={() => handleToggleActive(tripeiro)}
                  title={tripeiro.ativo ? 'Desativar' : 'Ativar'}
                >
                  {tripeiro.ativo ? '✓' : '✗'}
                </button>
                <button 
                  className="btn-action delete"
                  onClick={() => handleDelete(tripeiro.id)}
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
            <h3>Nenhum tripeiro encontrado</h3>
            <p>Comece adicionando um novo tripeiro</p>
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
              <h2>{editingTripeiro ? 'Editar Tripeiro' : 'Novo Tripeiro'}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTripeiro(null);
                  setFormData({
                    nome: '',
                    telefone: '',
                    email: '',
                    endereco: '',
                    cidade: '',
                    estado: '',
                    cep: '',
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
                <label>Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    maxLength="2"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
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
                    setEditingTripeiro(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingTripeiro ? 'Salvar Alterações' : 'Adicionar Tripeiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && tripeiroDetails && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>Detalhes de {tripeiroDetails.nome}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setTripeiroDetails(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>Informações de Contato</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{tripeiroDetails.email || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Telefone:</span>
                    <span className="detail-value">{tripeiroDetails.telefone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Endereço:</span>
                    <span className="detail-value">{tripeiroDetails.endereco || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cidade/Estado:</span>
                    <span className="detail-value">
                      {tripeiroDetails.cidade && tripeiroDetails.estado 
                        ? `${tripeiroDetails.cidade}, ${tripeiroDetails.estado}` 
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Contas</h3>
                {tripeiroDetails.accounts && tripeiroDetails.accounts.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Número da Conta</th>
                        <th>Descrição</th>
                        <th>Limite</th>
                        <th>Saldo Devedor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tripeiroDetails.accounts.map(account => (
                        <tr key={account.id}>
                          <td>{account.numero_conta}</td>
                          <td>{account.descricao || '-'}</td>
                          <td>{formatCurrency(account.limite_credito)}</td>
                          <td className="negative">{formatCurrency(account.saldo_devedor)}</td>
                          <td>
                            <span className={`status-badge ${account.ativa ? 'active' : 'inactive'}`}>
                              {account.ativa ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-message">Nenhuma conta cadastrada</p>
                )}
              </div>

              <div className="details-section">
                <h3>Adicionar Nova Conta</h3>
                <form onSubmit={handleAddAccount} className="account-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Número da Conta *</label>
                      <input type="text" name="numero_conta" required />
                    </div>
                    <div className="form-group">
                      <label>Descrição</label>
                      <input type="text" name="descricao" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Limite de Crédito</label>
                      <input type="number" step="0.01" name="limite_credito" defaultValue="0" />
                    </div>
                    <div className="form-group">
                      <label>Saldo Devedor</label>
                      <input type="number" step="0.01" name="saldo_devedor" defaultValue="0" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Observações</label>
                    <textarea name="observacoes" rows="2"></textarea>
                  </div>
                  <button type="submit" className="btn-primary">
                    <Plus size={16} /> Adicionar Conta
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tripeiros;