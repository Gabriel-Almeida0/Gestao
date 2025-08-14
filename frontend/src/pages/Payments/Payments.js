import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { paymentService, attendantService, tripeiroService } from '../../services/api';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [tripeiros, setTripeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_pagamento: format(new Date(), 'yyyy-MM-dd'),
    atendente_id: '',
    tripeiro_id: '',
    tipo_pagamento: 'entrada',
    status: 'pendente',
    observacoes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchAttendants();
    fetchTripeiros();
  }, [currentPage, filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = { 
        page: currentPage, 
        limit: 20 
      };
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await paymentService.getAll(params);
      setPayments(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError('Erro ao carregar pagamentos');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendants = async () => {
    try {
      const response = await attendantService.getAll();
      console.log('Attendants response:', response.data);
      const attendantsList = response.data?.data || response.data || [];
      setAttendants(Array.isArray(attendantsList) ? attendantsList : []);
    } catch (err) {
      console.error('Error fetching attendants:', err);
      setAttendants([]);
    }
  };

  const fetchTripeiros = async () => {
    try {
      const response = await tripeiroService.getAll();
      console.log('Tripeiros response:', response.data);
      const tripeirosList = response.data?.data || response.data || [];
      setTripeiros(Array.isArray(tripeirosList) ? tripeirosList : []);
    } catch (err) {
      console.error('Error fetching tripeiros:', err);
      setTripeiros([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare data, ensuring empty strings are converted to null
      const paymentData = {
        ...formData,
        atendente_id: formData.atendente_id || null,
        tripeiro_id: formData.tripeiro_id || null,
        valor: parseFloat(formData.valor) || 0
      };
      
      console.log('Submitting payment data:', paymentData);
      
      if (editingPayment) {
        await paymentService.update(editingPayment.id, paymentData);
      } else {
        await paymentService.create(paymentData);
      }
      
      setShowModal(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (err) {
      console.error('Error saving payment:', err);
      console.error('Response:', err.response?.data);
      alert('Erro ao salvar pagamento: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    // Format date properly - handle timezone issues
    const paymentDate = payment.data_pagamento ? 
      payment.data_pagamento.split('T')[0] : 
      format(new Date(), 'yyyy-MM-dd');
    
    setFormData({
      descricao: payment.descricao,
      valor: payment.valor,
      data_pagamento: paymentDate,
      atendente_id: payment.atendente_id || '',
      tripeiro_id: payment.tripeiro_id || '',
      tipo_pagamento: payment.tipo_pagamento,
      status: payment.status || 'pendente',
      observacoes: payment.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      try {
        await paymentService.delete(id);
        fetchPayments();
      } catch (err) {
        console.error('Error deleting payment:', err);
        alert('Erro ao excluir pagamento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      data_pagamento: format(new Date(), 'yyyy-MM-dd'),
      atendente_id: '',
      tripeiro_id: '',
      tipo_pagamento: 'entrada',
      status: 'pendente',
      observacoes: ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      // Handle different date formats
      let dateObj;
      if (typeof date === 'string' && date.includes('T')) {
        dateObj = new Date(date);
      } else if (typeof date === 'string') {
        dateObj = new Date(date + 'T00:00:00');
      } else {
        dateObj = new Date(date);
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

  // Ensure attendants and tripeiros are always arrays for safe rendering
  const safeAttendants = Array.isArray(attendants) ? attendants : [];
  const safeTripeiros = Array.isArray(tripeiros) ? tripeiros : [];
  
  const filteredPayments = payments.filter(payment =>
    payment.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.attendant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.tripeiro_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !payments.length) {
    return (
      <div className="payments-loading">
        <div className="spinner"></div>
        <p>Carregando pagamentos...</p>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>Pagamentos</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Novo Pagamento
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={20} />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendente">Pendentes</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Atendente</th>
              <th>Tripeiro</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Comissão</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map(payment => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.data_pagamento)}</td>
                  <td>{payment.descricao}</td>
                  <td>{payment.attendant_name || '-'}</td>
                  <td>{payment.tripeiro_name || '-'}</td>
                  <td>
                    <span className={`type-badge ${payment.tipo_pagamento}`}>
                      {payment.tipo_pagamento === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className={payment.tipo_pagamento === 'entrada' ? 'positive' : 'negative'}>
                    {formatCurrency(payment.valor)}
                  </td>
                  <td>{payment.valor_comissao ? formatCurrency(payment.valor_comissao) : '-'}</td>
                  <td>
                    <span className={`status-badge ${payment.status}`}>
                      {payment.status === 'confirmado' ? 'Confirmado' : 
                       payment.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon"
                        onClick={() => handleEdit(payment)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleDelete(payment.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="empty-message">
                  Nenhum pagamento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal for Add/Edit Payment */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPayment ? 'Editar Pagamento' : 'Novo Pagamento'}</h2>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setEditingPayment(null);
                resetForm();
              }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    value={formData.data_pagamento}
                    onChange={(e) => setFormData({...formData, data_pagamento: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Atendente</label>
                  <select
                    value={formData.atendente_id}
                    onChange={(e) => setFormData({...formData, atendente_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {safeAttendants.map(att => (
                      <option key={att.id} value={att.id}>{att.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tripeiro</label>
                  <select
                    value={formData.tripeiro_id}
                    onChange={(e) => setFormData({...formData, tripeiro_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {safeTripeiros.map(trip => (
                      <option key={trip.id} value={trip.id}>{trip.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Pagamento</label>
                  <select
                    value={formData.tipo_pagamento}
                    onChange={(e) => setFormData({...formData, tipo_pagamento: e.target.value})}
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => {
                  setShowModal(false);
                  setEditingPayment(null);
                  resetForm();
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingPayment ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;