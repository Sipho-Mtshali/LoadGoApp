const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Create PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database successfully');
    release();
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'LoadGo Backend Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get dashboard statistics - REAL DATA from PostgreSQL
app.get('/api/stats', async (req, res) => {
  try {
    console.log('📊 Fetching real statistics from PostgreSQL...');
    
    const totalTripsResult = await pool.query('SELECT COUNT(*) as total_trips FROM orders');
    const activeDriversResult = await pool.query("SELECT COUNT(*) as active_drivers FROM users WHERE role = 'driver'");
    const revenueResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as revenue FROM payments WHERE status = 'completed'");
    const pendingPaymentsResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as pending_payments FROM payments WHERE status = 'pending'");

    const stats = {
      total_trips: parseInt(totalTripsResult.rows[0].total_trips),
      active_drivers: parseInt(activeDriversResult.rows[0].active_drivers),
      revenue: parseFloat(revenueResult.rows[0].revenue),
      pending_payments: parseFloat(pendingPaymentsResult.rows[0].pending_payments)
    };

    console.log('📈 Real stats fetched:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get recent trips - REAL DATA from PostgreSQL
app.get('/api/trips/recent', async (req, res) => {
  try {
    console.log('🚗 Fetching recent trips from PostgreSQL...');
    
    const result = await pool.query(`
      SELECT o.id, u.name AS driver_name, o.pickup_location AS pickup_address, o.status
      FROM orders o
      LEFT JOIN users u ON o.driver_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    console.log('✅ Recent trips fetched:', result.rows.length, 'trips');
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Error fetching recent trips:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check with real database connection test
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'postgres_connected',
      timestamp: new Date().toISOString(),
      message: 'PostgreSQL database is connected and responsive'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'postgres_disconnected',
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// Get all users (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (for testing)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all payments (for testing)
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📍 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`📍 Recent trips: http://localhost:${PORT}/api/trips/recent`);
  console.log(`📍 Users: http://localhost:${PORT}/api/users`);
  console.log(`📍 Orders: http://localhost:${PORT}/api/orders`);
});