import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  Edit2,
  Trash2
} from 'lucide-react';
import { adminService } from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    tenant_id: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await adminService.getTenants();
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await adminService.createUser(formData);
      setSuccess('Usuário criado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        tenant_id: 1
      });
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await adminService.updateUser(selectedUser.id, updateData);
      setSuccess('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Tem certeza que deseja desativar este usuário?')) {
      try {
        await adminService.deleteUser(userId);
        setSuccess('Usuário desativado com sucesso!');
        fetchUsers();
      } catch (error) {
        setError(error.response?.data?.message || 'Erro ao desativar usuário');
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      tenant_id: user.tenant_id || 1
    });
    setShowEditModal(true);
  };

  const viewUserMetrics = (userId) => {
    navigate(`/admin/users/${userId}/metrics`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>Gerenciamento de Usuários</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/dashboard')}
          >
            Voltar ao Dashboard
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Novo Usuário
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
              <th>Empresa</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </td>
                <td>{user.tenant_name || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action btn-metrics"
                      onClick={() => viewUserMetrics(user.id)}
                      title="Ver Métricas"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => openEditModal(user)}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Desativar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar Novo Usuário</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>Empresa</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                >
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Usuário</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nova Senha (deixe em branco para manter a atual)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Digite apenas se quiser alterar"
                />
              </div>
              <div className="form-group">
                <label>Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>Empresa</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                >
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;