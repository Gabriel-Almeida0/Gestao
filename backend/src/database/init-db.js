const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDatabase() {
  let connection;
  
  try {
    // Connect without database first
    console.log('🔗 Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Read and execute schema
    console.log('📝 Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    console.log('🚀 Creating database and tables...');
    await connection.query(schema);

    console.log('✅ Database initialized successfully!');
    console.log('\n📋 Database Info:');
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log('\n🔐 Default Admin Credentials:');
    console.log('   Email: admin@gestao.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;