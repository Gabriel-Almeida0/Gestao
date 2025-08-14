const { pool } = require('../config/database');

// Get all reminders
const getAllReminders = async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.userId;
  const { status, priority, from_date, to_date } = req.query;
  
  try {
    let query = `
      SELECT * FROM reminders 
      WHERE tenant_id = ? AND user_id = ? AND deleted_at IS NULL
    `;
    const params = [tenantId, userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    
    if (from_date) {
      query += ' AND due_date >= ?';
      params.push(from_date);
    }
    
    if (to_date) {
      query += ' AND due_date <= ?';
      params.push(to_date);
    }
    
    query += ' ORDER BY FIELD(priority, "high", "medium", "low"), due_date ASC, due_time ASC';
    
    const [reminders] = await pool.execute(query, params);
    
    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Error fetching reminders' });
  }
};

// Get single reminder
const getReminderById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    const [reminders] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (reminders.length === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminders[0]);
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ message: 'Error fetching reminder' });
  }
};

// Create reminder
const createReminder = async (req, res) => {
  const { title, description, due_date, due_time, priority, category } = req.body;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO reminders (title, description, due_date, due_time, priority, category, user_id, tenant_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        title, 
        description || null, 
        due_date || null, 
        due_time || null,
        priority || 'medium',
        category || null,
        userId, 
        tenantId
      ]
    );
    
    const [newReminder] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newReminder[0]);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Error creating reminder' });
  }
};

// Update reminder
const updateReminder = async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, due_time, priority, status, category } = req.body;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    // Check if reminder exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    // If marking as completed, set completed_at
    let completedAt = existing[0].completed_at;
    if (status === 'completed' && existing[0].status !== 'completed') {
      completedAt = new Date();
    } else if (status !== 'completed') {
      completedAt = null;
    }
    
    // Update reminder
    await pool.execute(
      `UPDATE reminders 
       SET title = ?, description = ?, due_date = ?, due_time = ?, 
           priority = ?, status = ?, category = ?, completed_at = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ? AND user_id = ?`,
      [
        title !== undefined ? title : existing[0].title,
        description !== undefined ? description : existing[0].description,
        due_date !== undefined ? due_date : existing[0].due_date,
        due_time !== undefined ? due_time : existing[0].due_time,
        priority !== undefined ? priority : existing[0].priority,
        status !== undefined ? status : existing[0].status,
        category !== undefined ? category : existing[0].category,
        completedAt,
        id, tenantId, userId
      ]
    );
    
    const [updatedReminder] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ?',
      [id]
    );
    
    res.json(updatedReminder[0]);
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: 'Error updating reminder' });
  }
};

// Delete reminder (soft delete)
const deleteReminder = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    // Check if reminder exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    // Soft delete
    await pool.execute(
      'UPDATE reminders SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ? AND user_id = ?',
      [id, tenantId, userId]
    );
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Error deleting reminder' });
  }
};

// Mark reminder as completed
const markCompleted = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    const [existing] = await pool.execute(
      'SELECT status FROM reminders WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    if (existing[0].status === 'completed') {
      return res.status(400).json({ message: 'Reminder already completed' });
    }
    
    await pool.execute(
      'UPDATE reminders SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ? AND user_id = ?',
      [id, tenantId, userId]
    );
    
    res.json({ message: 'Reminder marked as completed' });
  } catch (error) {
    console.error('Mark completed error:', error);
    res.status(500).json({ message: 'Error marking reminder as completed' });
  }
};

// Get upcoming reminders (next 7 days)
const getUpcomingReminders = async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    const [reminders] = await pool.execute(
      `SELECT * FROM reminders 
       WHERE tenant_id = ? AND user_id = ? 
       AND deleted_at IS NULL 
       AND status = 'pending'
       AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY due_date ASC, due_time ASC`,
      [tenantId, userId]
    );
    
    res.json(reminders);
  } catch (error) {
    console.error('Get upcoming reminders error:', error);
    res.status(500).json({ message: 'Error fetching upcoming reminders' });
  }
};

module.exports = {
  getAllReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  markCompleted,
  getUpcomingReminders
};