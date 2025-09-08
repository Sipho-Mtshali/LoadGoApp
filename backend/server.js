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

// Analytics endpoints
app.get('/api/analytics/trips', async (req, res) => {
  try {
    console.log('📈 Fetching trip analytics from PostgreSQL...');
    
    // Query to get trips grouped by day for the current week
    const result = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Dy') as day,
        COUNT(*) as trips
      FROM orders 
      WHERE created_at >= date_trunc('week', CURRENT_DATE)
      GROUP BY TO_CHAR(created_at, 'Dy'), DATE_PART('dow', created_at)
      ORDER BY DATE_PART('dow', created_at)
    `);
    
    console.log('✅ Trip analytics fetched:', result.rows.length, 'days');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching trip analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.get('/api/analytics/revenue', async (req, res) => {
  try {
    console.log('💰 Fetching revenue analytics from PostgreSQL...');
    
    // Query to get revenue grouped by day for the current week
    const result = await pool.query(`
      SELECT 
        TO_CHAR(p.created_at, 'Dy') as day,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM payments p
      WHERE p.created_at >= date_trunc('week', CURRENT_DATE)
        AND p.status = 'completed'
      GROUP BY TO_CHAR(p.created_at, 'Dy'), DATE_PART('dow', p.created_at)
      ORDER BY DATE_PART('dow', p.created_at)
    `);
    
    console.log('✅ Revenue analytics fetched:', result.rows.length, 'days');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching revenue analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    console.log(`👤 Updating user profile for ID: ${id}`);
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, email, phone, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log('✅ User profile updated successfully');
    
    // Return the updated user with success message
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
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
  console.log(`📍 Trip Analytics: http://localhost:${PORT}/api/analytics/trips`);
  console.log(`📍 Revenue Analytics: http://localhost:${PORT}/api/analytics/revenue`);
});