import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  DollarSign, 
  Database,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Moon,
  Sun,
  Globe,
  Mail,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: ''
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System preferences
  const [preferences, setPreferences] = useState({
    currency: 'BRL',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'America/Sao_Paulo',
    fiscalYearStart: '01',
    defaultPaymentStatus: 'pendente'
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    paymentReminders: true,
    expenseAlerts: true,
    reportSummary: false,
    newsletterSubscription: false
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipRestriction: false,
    allowedIPs: ''
  });

  // Backup settings
  const [backup, setBackup] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30
  });

  useEffect(() => {
    fetchSettings();
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      if (response.data) {
        const { profile, preferences, notifications, security, backup } = response.data;
        if (profile) setProfileData(prev => ({ ...prev, ...profile }));
        if (preferences) setPreferences(prev => ({ ...prev, ...preferences }));
        if (notifications) setNotifications(prev => ({ ...prev, ...notifications }));
        if (security) setSecurity(prev => ({ ...prev, ...security }));
        if (backup) setBackup(prev => ({ ...prev, ...backup }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/settings/profile', profileData);
      if (response.data.user) {
        updateUser(response.data.user);
      }
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/settings/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erro ao alterar senha' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/settings/preferences', preferences);
      setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar preferências' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/settings/notifications', notifications);
      setMessage({ type: 'success', text: 'Configurações de notificação salvas!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/settings/security', security);
      setMessage({ type: 'success', text: 'Configurações de segurança atualizadas!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar segurança' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupUpdate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/settings/backup', backup);
      setMessage({ type: 'success', text: 'Configurações de backup salvas!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/settings/backup/manual');
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup realizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao realizar backup' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'password', label: 'Senha', icon: Lock },
    { id: 'preferences', label: 'Preferências', icon: SettingsIcon }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1><SettingsIcon size={28} /> Configurações</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-main">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Informações do Perfil</h2>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Empresa</label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                  />
                </div>
                
                <button type="submit" className="btn-save" disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="tab-content">
              <h2>Alterar Senha</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Senha Atual</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Nova Senha</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                
                <button type="submit" className="btn-save" disabled={loading}>
                  <Lock size={20} />
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h2>Preferências do Sistema</h2>
              
              <div className="preference-section">
                <h3>Aparência</h3>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>Modo Escuro</label>
                    <p>Ativar tema escuro para reduzir o cansaço visual</p>
                  </div>
                  <button 
                    className={`toggle-switch ${darkMode ? 'active' : ''}`}
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                  </button>
                </div>
              </div>
              
              <button className="btn-save" onClick={handlePreferencesUpdate} disabled={loading}>
                <Save size={20} />
                {loading ? 'Salvando...' : 'Salvar Preferências'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h2>Configurações de Notificação</h2>
              
              <div className="notification-settings">
                <div className="notification-item">
                  <div className="notification-info">
                    <label>Notificações por Email</label>
                    <p>Receber atualizações importantes por email</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                  />
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <label>Lembretes de Pagamento</label>
                    <p>Alertas sobre pagamentos pendentes</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={notifications.paymentReminders}
                    onChange={(e) => setNotifications({...notifications, paymentReminders: e.target.checked})}
                  />
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <label>Alertas de Despesas</label>
                    <p>Notificações quando despesas ultrapassam limites</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={notifications.expenseAlerts}
                    onChange={(e) => setNotifications({...notifications, expenseAlerts: e.target.checked})}
                  />
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <label>Resumo de Relatórios</label>
                    <p>Receber resumos semanais/mensais</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={notifications.reportSummary}
                    onChange={(e) => setNotifications({...notifications, reportSummary: e.target.checked})}
                  />
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <label>Newsletter</label>
                    <p>Novidades e atualizações do sistema</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={notifications.newsletterSubscription}
                    onChange={(e) => setNotifications({...notifications, newsletterSubscription: e.target.checked})}
                  />
                </div>
              </div>
              
              <button className="btn-save" onClick={handleNotificationsUpdate} disabled={loading}>
                <Bell size={20} />
                {loading ? 'Salvando...' : 'Salvar Notificações'}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Configurações de Segurança</h2>
              
              <div className="security-settings">
                <div className="security-item">
                  <div className="security-info">
                    <label>Autenticação de Dois Fatores</label>
                    <p>Adicionar uma camada extra de segurança</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={security.twoFactorAuth}
                    onChange={(e) => setSecurity({...security, twoFactorAuth: e.target.checked})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Tempo de Sessão (minutos)</label>
                  <input
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
                    min="5"
                    max="120"
                  />
                </div>
                
                <div className="security-item">
                  <div className="security-info">
                    <label>Restrição por IP</label>
                    <p>Limitar acesso a IPs específicos</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={security.ipRestriction}
                    onChange={(e) => setSecurity({...security, ipRestriction: e.target.checked})}
                  />
                </div>
                
                {security.ipRestriction && (
                  <div className="form-group">
                    <label>IPs Permitidos (separados por vírgula)</label>
                    <textarea
                      value={security.allowedIPs}
                      onChange={(e) => setSecurity({...security, allowedIPs: e.target.value})}
                      placeholder="192.168.1.1, 10.0.0.1"
                      rows={3}
                    />
                  </div>
                )}
              </div>
              
              <button className="btn-save" onClick={handleSecurityUpdate} disabled={loading}>
                <Shield size={20} />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="tab-content">
              <h2>Configurações de Backup</h2>
              
              <div className="backup-settings">
                <div className="backup-item">
                  <div className="backup-info">
                    <label>Backup Automático</label>
                    <p>Realizar backup automaticamente</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={backup.autoBackup}
                    onChange={(e) => setBackup({...backup, autoBackup: e.target.checked})}
                  />
                </div>
                
                {backup.autoBackup && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Frequência</label>
                        <select
                          value={backup.backupFrequency}
                          onChange={(e) => setBackup({...backup, backupFrequency: e.target.value})}
                        >
                          <option value="daily">Diário</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Horário</label>
                        <input
                          type="time"
                          value={backup.backupTime}
                          onChange={(e) => setBackup({...backup, backupTime: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Retenção (dias)</label>
                      <input
                        type="number"
                        value={backup.retentionDays}
                        onChange={(e) => setBackup({...backup, retentionDays: e.target.value})}
                        min="7"
                        max="365"
                      />
                    </div>
                  </>
                )}
                
                <div className="backup-actions">
                  <button className="btn-secondary" onClick={handleManualBackup} disabled={loading}>
                    <Database size={20} />
                    Fazer Backup Manual
                  </button>
                </div>
              </div>
              
              <button className="btn-save" onClick={handleBackupUpdate} disabled={loading}>
                <Save size={20} />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;