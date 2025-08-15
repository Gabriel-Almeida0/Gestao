import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Wallet,
  Calendar,
  User,
  AlertCircle,
  StickyNote,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Pin,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { dashboardService, noteService, reminderService } from '../services/api';
import NoteReminderModal from './NoteReminderModal';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('note');
  const [editingItem, setEditingItem] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      variation: 0
    },
    topAttendants: [],
    latestPayments: [],
    latestExpenses: [],
    notes: [],
    reminders: []
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    
    checkDarkMode();
    
    // Observer for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getMetrics();
      setDashboardData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Dashboard error:', err);
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

  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getPriorityClass = (priority) => {
    const classes = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    return classes[priority] || '';
  };

  const handleAddNote = () => {
    setEditingItem(null);
    setModalType('note');
    setModalOpen(true);
  };

  const handleAddReminder = () => {
    setEditingItem(null);
    setModalType('reminder');
    setModalOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingItem(note);
    setModalType('note');
    setModalOpen(true);
  };

  const handleEditReminder = (reminder) => {
    setEditingItem(reminder);
    setModalType('reminder');
    setModalOpen(true);
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
      try {
        await noteService.delete(id);
        fetchDashboardData();
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  };

  const handleDeleteReminder = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este lembrete?')) {
      try {
        await reminderService.delete(id);
        fetchDashboardData();
      } catch (err) {
        console.error('Error deleting reminder:', err);
      }
    }
  };

  const getNoteBackgroundColor = (note) => {
    if (note.is_pinned) {
      return isDarkMode ? 'rgba(251, 191, 36, 0.1)' : (note.color || '#fef3c7');
    }
    if (isDarkMode) {
      return '#2d2d2d';
    }
    return note.color || '#f3f4f6';
  };

  const handleTogglePin = async (noteId) => {
    try {
      await noteService.update(noteId, { 
        is_pinned: !dashboardData.notes.find(n => n.id === noteId)?.is_pinned 
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleCompleteReminder = async (reminderId) => {
    try {
      await reminderService.update(reminderId, { status: 'completed' });
      fetchDashboardData();
    } catch (err) {
      console.error('Error completing reminder:', err);
    }
  };

  const handleModalSave = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Tentar novamente</button>
      </div>
    );
  }

  const { metrics, topAttendants, latestPayments, latestExpenses, notes, reminders } = dashboardData;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="refresh-button" onClick={fetchDashboardData}>
          Atualizar
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Faturamento Total</h3>
            <p className="metric-value">{formatCurrency(metrics.totalRevenue)}</p>
            {metrics.variation !== 0 && (
              <div className={`metric-variation ${metrics.variation > 0 ? 'positive' : 'negative'}`}>
                {metrics.variation > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{Math.abs(metrics.variation)}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">
            <Receipt size={24} />
          </div>
          <div className="metric-content">
            <h3>Total de Gastos</h3>
            <p className="metric-value">{formatCurrency(metrics.totalExpenses)}</p>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">
            <Wallet size={24} />
          </div>
          <div className="metric-content">
            <h3>Lucro Líquido</h3>
            <p className={`metric-value ${metrics.netProfit >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(metrics.netProfit)}
            </p>
          </div>
        </div>

        <div className="metric-card variation">
          <div className="metric-icon">
            {metrics.variation >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="metric-content">
            <h3>Variação do Período</h3>
            <p className={`metric-value ${metrics.variation >= 0 ? 'positive' : 'negative'}`}>
              {metrics.variation > 0 ? '+' : ''}{metrics.variation}%
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Notes and Reminders Section */}
        <div className="dashboard-section notes-reminders-section">
          <div className="section-header">
            <h2><StickyNote size={20} /> Notas e lembretes</h2>
            <div className="header-actions">
              <button className="add-button" onClick={handleAddNote} title="Adicionar nota">
                + Nota
              </button>
              <button className="add-button" onClick={handleAddReminder} title="Adicionar lembrete">
                + Lembrete
              </button>
            </div>
          </div>
          <div className="notes-reminders-list">
            {(notes.length > 0 || reminders.length > 0) ? (
              <>
                {notes.map(note => (
                  <div 
                    key={`note-${note.id}`} 
                    className={`note-item ${note.is_pinned ? 'pinned' : ''}`}
                    style={{ backgroundColor: getNoteBackgroundColor(note) }}
                  >
                    <div className="note-actions">
                      <button 
                        className="action-btn"
                        onClick={() => handleTogglePin(note.id)}
                        title={note.is_pinned ? 'Desafixar' : 'Fixar'}
                      >
                        <Pin size={14} className={note.is_pinned ? 'pinned' : ''} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleEditNote(note)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {note.title && <h4>{note.title}</h4>}
                    <p>{note.content}</p>
                    <span className="note-date">{formatDate(note.updated_at)}</span>
                  </div>
                ))}
                {reminders.map(reminder => (
                  <div key={`reminder-${reminder.id}`} className={`reminder-item ${getPriorityClass(reminder.priority)}`}>
                    <div className="reminder-content">
                      <h4>{reminder.title}</h4>
                      {reminder.description && <p>{reminder.description}</p>}
                      {reminder.due_date && (
                        <span className="reminder-date">
                          <Calendar size={14} /> {formatDate(reminder.due_date)}
                          {reminder.due_time && ` às ${reminder.due_time}`}
                        </span>
                      )}
                    </div>
                    <div className="reminder-actions">
                      <span className={`priority-badge ${reminder.priority}`}>
                        {reminder.priority === 'high' ? 'Alta' : 
                         reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                      <button 
                        className="action-btn"
                        onClick={() => handleCompleteReminder(reminder.id)}
                        title="Marcar como concluído"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleEditReminder(reminder)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteReminder(reminder.id)}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="empty-message">Nenhuma nota ou lembrete cadastrado</p>
            )}
          </div>
        </div>

        {/* Top Attendants Section */}
        <div className="dashboard-section attendants-section">
          <div className="section-header">
            <h2><User size={20} /> Top Atendentes</h2>
          </div>
          <div className="attendants-list">
            {topAttendants.length > 0 ? (
              topAttendants.map((attendant, index) => (
                <div key={attendant.id} className="attendant-item">
                  <div className="attendant-rank">{index + 1}º</div>
                  <div className="attendant-info">
                    <h4>{attendant.name}</h4>
                    <p>{attendant.total_sales} vendas</p>
                  </div>
                  <div className="attendant-commission">
                    {formatCurrency(attendant.total_commission)}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">Nenhum atendente cadastrado</p>
            )}
          </div>
        </div>

        {/* Latest Payments Section */}
        <div className="dashboard-section payments-section">
          <div className="section-header">
            <h2><DollarSign size={20} /> Últimos Pagamentos</h2>
            <button className="view-all-button" onClick={() => navigate('/payments')}>Ver todos</button>
          </div>
          <div className="table-container">
            {latestPayments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Atendente</th>
                    <th>Tripeiro</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {latestPayments.map(payment => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>{payment.description || '-'}</td>
                      <td>{payment.attendant_name || '-'}</td>
                      <td>{payment.tripeiro_name || '-'}</td>
                      <td className="amount positive">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">Nenhum pagamento registrado</p>
            )}
          </div>
        </div>

        {/* Latest Expenses Section */}
        <div className="dashboard-section expenses-section">
          <div className="section-header">
            <h2><Receipt size={20} /> Últimos Gastos</h2>
            <button className="view-all-button" onClick={() => navigate('/expenses')}>Ver todos</button>
          </div>
          <div className="table-container">
            {latestExpenses.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {latestExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expense_date)}</td>
                      <td>{expense.description}</td>
                      <td>{expense.category || '-'}</td>
                      <td className="amount negative">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">Nenhuma despesa registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Notes and Reminders */}
      <NoteReminderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        type={modalType}
        editItem={editingItem}
      />
    </div>
  );
};

export default Dashboard;