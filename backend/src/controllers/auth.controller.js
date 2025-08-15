const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for:', email);

  try {
    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, tenant_id FROM users WHERE email = ?',
      [email]
    );
    
    console.log('Users found:', users.length);

    if (users.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

const register = async (req, res) => {
  const { name, email, password, companyName } = req.body;

  try {
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction for atomic operation
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create a unique tenant for this user
      // Use user's name or company name for the tenant
      const tenantName = companyName || `${name}'s Workspace`;
      const tenantSlug = email.split('@')[0] + '_' + Date.now(); // Unique slug
      
      const [tenantResult] = await connection.execute(
        'INSERT INTO tenants (name, slug, active) VALUES (?, ?, true)',
        [tenantName, tenantSlug]
      );
      
      const tenantId = tenantResult.insertId;

      // Create user with their own tenant
      const [userResult] = await connection.execute(
        'INSERT INTO users (name, email, password, tenant_id, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, tenantId, 'user']
      );

      await connection.commit();

      // Generate token with tenant_id
      const token = jwt.sign(
        { id: userResult.insertId, email, role: 'user', tenant_id: tenantId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        token,
        user: {
          id: userResult.insertId,
          name,
          email,
          role: 'user',
          tenant_id: tenantId,
          tenant_name: tenantName
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
};

const me = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.tenant_id, t.name as tenant_name 
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = ?`,
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

module.exports = {
  login,
  register,
  me
};