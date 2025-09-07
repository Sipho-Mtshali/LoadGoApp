const { Pool } = require('pg');
require('dotenv').config();

// Create a temporary pool for testing
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'loadgo_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here',
});

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current time:', result.rows[0].current_time);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables found:');
    tables.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.log('\n💡 Common solutions:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file credentials');
    console.log('3. Verify the database exists');
    console.log('4. Check your PostgreSQL password');
    
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();