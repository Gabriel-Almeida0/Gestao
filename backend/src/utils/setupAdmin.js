const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // Generate password hash
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash for admin123');
    
    // Delete existing admin
    await pool.execute('DELETE FROM users WHERE email = ?', ['admin@gestao.com']);
    console.log('Removed existing admin user');
    
    // Create new admin
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, tenant_id) VALUES (?, ?, ?, ?, ?)',
      ['Administrador', 'admin@gestao.com', hash, 'admin', 1]
    );
    
    console.log('Admin user created with ID:', result.insertId);
    
    // Verify the user was created
    const [users] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['admin@gestao.com']
    );
    
    if (users.length > 0) {
      console.log('✅ Admin user verified:', users[0]);
      console.log('\nYou can now login with:');
      console.log('Email: admin@gestao.com');
      console.log('Password: admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();