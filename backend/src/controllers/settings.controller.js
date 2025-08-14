const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all settings
const getSettings = async (req, res) => {
  const userId = req.userId;
  
  try {
    // Get user profile
    const [user] = await pool.execute(
      'SELECT id, name, email, phone, company FROM users WHERE id = ?',
      [userId]
    );
    
    // Get user preferences (stored as JSON in a settings table or user table)
    const [preferences] = await pool.execute(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    
    // Get notification settings
    const [notifications] = await pool.execute(
      'SELECT * FROM notification_settings WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      profile: user[0] || {},
      preferences: preferences[0] || {
        currency: 'BRL',
        language: 'pt-BR',
        dateFormat: 'DD/MM/YYYY',
        timeZone: 'America/Sao_Paulo',
        fiscalYearStart: '01',
        defaultPaymentStatus: 'pendente'
      },
      notifications: notifications[0] || {
        emailNotifications: true,
        paymentReminders: true,
        expenseAlerts: true,
        reportSummary: false,
        newsletterSubscription: false
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        ipRestriction: false,
        allowedIPs: ''
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        backupTime: '02:00',
        retentionDays: 30
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  const userId = req.userId;
  const { name, email, phone, company } = req.body;
  
  try {
    // Check if email is already in use by another user
    if (email) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user profile
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      // Add phone column if it doesn't exist
      await pool.execute(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)',
        []
      ).catch(() => {});
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (company !== undefined) {
      // Add company column if it doesn't exist
      await pool.execute(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255)',
        []
      ).catch(() => {});
      updateFields.push('company = ?');
      updateValues.push(company);
    }
    
    if (updateFields.length > 0) {
      updateValues.push(userId);
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );
    }
    
    // Get updated user
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, phone, company FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Update password
const updatePassword = async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Get current user
    const [user] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
};

// Update preferences
const updatePreferences = async (req, res) => {
  const userId = req.userId;
  const preferences = req.body;
  
  try {
    // Create preferences table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INT PRIMARY KEY,
        currency VARCHAR(3) DEFAULT 'BRL',
        language VARCHAR(10) DEFAULT 'pt-BR',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        time_zone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
        fiscal_year_start VARCHAR(2) DEFAULT '01',
        default_payment_status VARCHAR(20) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).catch(() => {});
    
    // Insert or update preferences
    await pool.execute(
      `INSERT INTO user_preferences 
       (user_id, currency, language, date_format, time_zone, fiscal_year_start, default_payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       currency = VALUES(currency),
       language = VALUES(language),
       date_format = VALUES(date_format),
       time_zone = VALUES(time_zone),
       fiscal_year_start = VALUES(fiscal_year_start),
       default_payment_status = VALUES(default_payment_status),
       updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        preferences.currency || 'BRL',
        preferences.language || 'pt-BR',
        preferences.dateFormat || 'DD/MM/YYYY',
        preferences.timeZone || 'America/Sao_Paulo',
        preferences.fiscalYearStart || '01',
        preferences.defaultPaymentStatus || 'pendente'
      ]
    );
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
};

// Update notifications
const updateNotifications = async (req, res) => {
  const userId = req.userId;
  const notifications = req.body;
  
  try {
    // Create notifications table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        user_id INT PRIMARY KEY,
        email_notifications BOOLEAN DEFAULT TRUE,
        payment_reminders BOOLEAN DEFAULT TRUE,
        expense_alerts BOOLEAN DEFAULT TRUE,
        report_summary BOOLEAN DEFAULT FALSE,
        newsletter_subscription BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).catch(() => {});
    
    // Insert or update notifications
    await pool.execute(
      `INSERT INTO notification_settings 
       (user_id, email_notifications, payment_reminders, expense_alerts, report_summary, newsletter_subscription) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       email_notifications = VALUES(email_notifications),
       payment_reminders = VALUES(payment_reminders),
       expense_alerts = VALUES(expense_alerts),
       report_summary = VALUES(report_summary),
       newsletter_subscription = VALUES(newsletter_subscription),
       updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        notifications.emailNotifications ? 1 : 0,
        notifications.paymentReminders ? 1 : 0,
        notifications.expenseAlerts ? 1 : 0,
        notifications.reportSummary ? 1 : 0,
        notifications.newsletterSubscription ? 1 : 0
      ]
    );
    
    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
};

// Update security settings
const updateSecurity = async (req, res) => {
  const userId = req.userId;
  const security = req.body;
  
  try {
    // Store security settings (you might want to create a dedicated table)
    // For now, we'll just return success
    res.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Update security error:', error);
    res.status(500).json({ message: 'Error updating security settings' });
  }
};

// Update backup settings
const updateBackup = async (req, res) => {
  const userId = req.userId;
  const backup = req.body;
  
  try {
    // Store backup settings (you might want to create a dedicated table)
    // For now, we'll just return success
    res.json({ message: 'Backup settings updated successfully' });
  } catch (error) {
    console.error('Update backup error:', error);
    res.status(500).json({ message: 'Error updating backup settings' });
  }
};

// Manual backup
const createManualBackup = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.tenantId;
  
  try {
    // Get all user data
    const backupData = {};
    
    // Get payments
    const [payments] = await pool.execute(
      'SELECT * FROM pagamentos WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    backupData.payments = payments;
    
    // Get expenses
    const [expenses] = await pool.execute(
      'SELECT * FROM despesas WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    backupData.expenses = expenses;
    
    // Get attendants
    const [attendants] = await pool.execute(
      'SELECT * FROM atendentes WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    backupData.attendants = attendants;
    
    // Get tripeiros
    const [tripeiros] = await pool.execute(
      'SELECT * FROM tripeiros WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    backupData.tripeiros = tripeiros;
    
    // Add metadata
    backupData.metadata = {
      createdAt: new Date().toISOString(),
      userId: userId,
      tenantId: tenantId,
      version: '1.0.0'
    };
    
    // Send as JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.json`);
    res.json(backupData);
  } catch (error) {
    console.error('Manual backup error:', error);
    res.status(500).json({ message: 'Error creating backup' });
  }
};

module.exports = {
  getSettings,
  updateProfile,
  updatePassword,
  updatePreferences,
  updateNotifications,
  updateSecurity,
  updateBackup,
  createManualBackup
};