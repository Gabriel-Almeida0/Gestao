const { pool } = require('../config/database');

// Get all notes
const getAllNotes = async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    const [notes] = await pool.execute(
      `SELECT * FROM notes 
       WHERE tenant_id = ? AND user_id = ? AND deleted_at IS NULL
       ORDER BY is_pinned DESC, updated_at DESC`,
      [tenantId, userId]
    );
    
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Error fetching notes' });
  }
};

// Get single note
const getNoteById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    const [notes] = await pool.execute(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(notes[0]);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Error fetching note' });
  }
};

// Create note
const createNote = async (req, res) => {
  const { title, content, color, is_pinned } = req.body;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO notes (title, content, color, is_pinned, user_id, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title || null, content, color || '#f3f4f6', is_pinned || false, userId, tenantId]
    );
    
    const [newNote] = await pool.execute(
      'SELECT * FROM notes WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newNote[0]);
  } catch (error) {
    console.error('Create note error:', error);
    console.error('SQL Error:', error.sqlMessage || error.message);
    res.status(500).json({ 
      message: 'Error creating note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update note
const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content, color, is_pinned } = req.body;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    // Check if note exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update note
    await pool.execute(
      `UPDATE notes 
       SET title = ?, content = ?, color = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ? AND user_id = ?`,
      [
        title !== undefined ? title : existing[0].title,
        content !== undefined ? content : existing[0].content,
        color !== undefined ? color : existing[0].color,
        is_pinned !== undefined ? is_pinned : existing[0].is_pinned,
        id, tenantId, userId
      ]
    );
    
    const [updatedNote] = await pool.execute(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );
    
    res.json(updatedNote[0]);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Error updating note' });
  }
};

// Delete note (soft delete)
const deleteNote = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    // Check if note exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Soft delete
    await pool.execute(
      'UPDATE notes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ? AND user_id = ?',
      [id, tenantId, userId]
    );
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
};

// Toggle pin status
const togglePin = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  
  try {
    const [existing] = await pool.execute(
      'SELECT is_pinned FROM notes WHERE id = ? AND tenant_id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, tenantId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    const newPinStatus = !existing[0].is_pinned;
    
    await pool.execute(
      'UPDATE notes SET is_pinned = ? WHERE id = ? AND tenant_id = ? AND user_id = ?',
      [newPinStatus, id, tenantId, userId]
    );
    
    res.json({ is_pinned: newPinStatus });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ message: 'Error toggling pin status' });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  togglePin
};