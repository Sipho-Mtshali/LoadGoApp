const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

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

// ==================== AUTHENTICATION ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role, created_at',
      [name, email, hashedPassword, phone, role]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.rows[0].id, role: newUser.rows[0].role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'User created successfully',
      token,
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'admin']
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials or not an admin' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ user: userResult.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ==================== DASHBOARD & ANALYTICS ROUTES ====================

// Root endpoint
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

// ==================== CRUD ROUTES ====================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all payments
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== UPDATE & DELETE ROUTES ====================

// Valid status values for orders
const VALID_ORDER_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
// Valid payment methods
const VALID_PAYMENT_METHODS = ['cash', 'card', 'wallet', 'bank_transfer'];
// Valid payment statuses
const VALID_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, vehicle_type } = req.body;
    
    console.log(`👤 Updating user with ID: ${id}`);
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, role = $4, vehicle_type = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, email, phone, role, vehicle_type, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log('✅ User updated successfully');
    
    res.json({
      success: true,
      message: 'User updated successfully',
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

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    
    console.log(`🗑️ Deleting user with ID: ${id}`);
    
    // First check if user exists
    const userCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (userCheck.rows.length === 0) {
      console.log(`❌ User not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Check if user has associated orders
    const ordersCheck = await client.query(
      'SELECT id FROM orders WHERE driver_id = $1 OR customer_id = $1',
      [id]
    );
    
    if (ordersCheck.rows.length > 0) {
      console.log(`❌ Cannot delete user with ID: ${id} - User has associated orders`);
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete user with associated orders. Please reassign or delete orders first.' 
      });
    }
    
    // Check if user has associated payments
    const paymentsCheck = await client.query(
      'SELECT id FROM payments WHERE user_id = $1',
      [id]
    );
    
    if (paymentsCheck.rows.length > 0) {
      console.log(`❌ Cannot delete user with ID: ${id} - User has associated payments`);
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete user with associated payments. Please reassign or delete payments first.' 
      });
    }
    
    // If no associated records, delete the user
    const result = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    
    await client.query('COMMIT');
    
    console.log('✅ User deleted successfully');
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Update order (trip)
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_location, dropoff_location, status, price } = req.body;
    
    console.log(`📦 Updating order with ID: ${id}`);
    
    // Validate status
    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
      });
    }
    
    const result = await pool.query(
      'UPDATE orders SET pickup_location = $1, dropoff_location = $2, status = $3, price = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [pickup_location, dropoff_location, status, price, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Order not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    console.log('✅ Order updated successfully');
    
    res.json({
      success: true,
      message: 'Order updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    
    // Check if it's a constraint violation
    if (error.message.includes('orders_status_check')) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete order (trip)
app.delete('/api/orders/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    
    console.log(`🗑️ Deleting order with ID: ${id}`);
    
    // First check if order exists
    const orderCheck = await client.query(
      'SELECT id FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderCheck.rows.length === 0) {
      console.log(`❌ Order not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    // Check if order has associated payments
    const paymentsCheck = await client.query(
      'SELECT id FROM payments WHERE order_id = $1',
      [id]
    );
    
    if (paymentsCheck.rows.length > 0) {
      console.log(`❌ Cannot delete order with ID: ${id} - Order has associated payments`);
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete order with associated payments. Please delete payments first.' 
      });
    }
    
    // If no associated payments, delete the order
    const result = await client.query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [id]
    );
    
    await client.query('COMMIT');
    
    console.log('✅ Order deleted successfully');
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Update payment
app.put('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, method } = req.body;
    
    console.log(`💰 Updating payment with ID: ${id}`);
    
    // Validate status and method
    if (status && !VALID_PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
      });
    }
    
    if (method && !VALID_PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`
      });
    }
    
    const result = await pool.query(
      'UPDATE payments SET status = $1, method = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, method, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Payment not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    console.log('✅ Payment updated successfully');
    
    res.json({
      success: true,
      message: 'Payment updated successfully',
      payment: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    
    // Check if it's a constraint violation
    if (error.message.includes('payments_method_check')) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`
      });
    }
    
    if (error.message.includes('payments_status_check')) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete payment
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting payment with ID: ${id}`);
    
    const result = await pool.query(
      'DELETE FROM payments WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Payment not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    console.log('✅ Payment deleted successfully');
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Approve payment
app.put('/api/payments/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`✅ Approving payment with ID: ${id}`);
    
    const result = await pool.query(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['completed', id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Payment not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    console.log('✅ Payment approved successfully');
    
    res.json({
      success: true,
      message: 'Payment approved successfully',
      payment: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error approving payment:', error);
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
  console.log(`📍 Auth Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`📍 Auth Login: http://localhost:${PORT}/api/auth/login`);
});