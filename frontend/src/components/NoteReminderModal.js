import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag } from 'lucide-react';
import { noteService, reminderService } from '../services/api';
import './NoteReminderModal.css';

const NoteReminderModal = ({ isOpen, onClose, onSave, type = 'note', editItem = null }) => {
  const [activeTab, setActiveTab] = useState(type);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Note state
  const [noteData, setNoteData] = useState({
    title: '',
    content: '',
    color: '#f3f4f6',
    is_pinned: false
  });
  
  // Reminder state
  const [reminderData, setReminderData] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    priority: 'medium',
    category: ''
  });

  useEffect(() => {
    if (editItem) {
      if (type === 'note') {
        setNoteData({
          title: editItem.title || '',
          content: editItem.content || '',
          color: editItem.color || '#f3f4f6',
          is_pinned: editItem.is_pinned || false
        });
        setActiveTab('note');
      } else {
        setReminderData({
          title: editItem.title || '',
          description: editItem.description || '',
          due_date: editItem.due_date ? editItem.due_date.split('T')[0] : '',
          due_time: editItem.due_time || '',
          priority: editItem.priority || 'medium',
          category: editItem.category || ''
        });
        setActiveTab('reminder');
      }
    } else {
      // Reset forms
      setNoteData({
        title: '',
        content: '',
        color: '#f3f4f6',
        is_pinned: false
      });
      setReminderData({
        title: '',
        description: '',
        due_date: '',
        due_time: '',
        priority: 'medium',
        category: ''
      });
      setActiveTab(type);
    }
  }, [editItem, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (activeTab === 'note') {
        if (!noteData.content.trim()) {
          setError('O conteúdo da nota é obrigatório');
          setLoading(false);
          return;
        }
        
        if (editItem && editItem.id) {
          response = await noteService.update(editItem.id, noteData);
        } else {
          response = await noteService.create(noteData);
        }
      } else {
        if (!reminderData.title.trim()) {
          setError('O título do lembrete é obrigatório');
          setLoading(false);
          return;
        }
        
        if (editItem && editItem.id) {
          response = await reminderService.update(editItem.id, reminderData);
        } else {
          response = await reminderService.create(reminderData);
        }
      }
      
      if (onSave) {
        onSave(response.data, activeTab);
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    '#f3f4f6', // gray
    '#fef3c7', // yellow
    '#dbeafe', // blue
    '#fce7f3', // pink
    '#dcfce7', // green
    '#e9d5ff', // purple
    '#fed7aa', // orange
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editItem ? 'Editar' : 'Adicionar'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'note' ? 'active' : ''}`}
            onClick={() => setActiveTab('note')}
          >
            Nota
          </button>
          <button
            className={`tab-button ${activeTab === 'reminder' ? 'active' : ''}`}
            onClick={() => setActiveTab('reminder')}
          >
            Lembrete
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 'note' ? (
            <div className="form-content">
              <div className="form-group">
                <label>Título (opcional)</label>
                <input
                  type="text"
                  value={noteData.title}
                  onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                  placeholder="Digite o título da nota"
                />
              </div>

              <div className="form-group">
                <label>Conteúdo *</label>
                <textarea
                  value={noteData.content}
                  onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                  placeholder="Digite o conteúdo da nota"
                  rows={6}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cor</label>
                  <div className="color-picker">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${noteData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNoteData({ ...noteData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={noteData.is_pinned}
                      onChange={(e) => setNoteData({ ...noteData, is_pinned: e.target.checked })}
                    />
                    <span>Fixar nota</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="form-content">
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={reminderData.title}
                  onChange={(e) => setReminderData({ ...reminderData, title: e.target.value })}
                  placeholder="Digite o título do lembrete"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={reminderData.description}
                  onChange={(e) => setReminderData({ ...reminderData, description: e.target.value })}
                  placeholder="Digite a descrição do lembrete"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Calendar size={16} /> Data
                  </label>
                  <input
                    type="date"
                    value={reminderData.due_date}
                    onChange={(e) => setReminderData({ ...reminderData, due_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Clock size={16} /> Hora
                  </label>
                  <input
                    type="time"
                    value={reminderData.due_time}
                    onChange={(e) => setReminderData({ ...reminderData, due_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Flag size={16} /> Prioridade
                  </label>
                  <select
                    value={reminderData.priority}
                    onChange={(e) => setReminderData({ ...reminderData, priority: e.target.value })}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <input
                    type="text"
                    value={reminderData.category}
                    onChange={(e) => setReminderData({ ...reminderData, category: e.target.value })}
                    placeholder="Ex: Financeiro, Pessoal"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Salvando...' : (editItem ? 'Atualizar' : 'Adicionar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteReminderModal;