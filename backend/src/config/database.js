const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestao_financeira',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully (MySQL)');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Por favor, certifique-se de que:');
    console.log('   1. O XAMPP está rodando');
    console.log('   2. O MySQL está ativo no XAMPP');
    console.log('   3. Execute o script database/create_database.sql no phpMyAdmin');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };