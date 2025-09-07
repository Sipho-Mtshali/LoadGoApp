const { Client } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  console.log('🚀 Initializing PostgreSQL database...');
  
  // First try to connect to default postgres database
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if our database exists
    const dbExists = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME]
    );

    if (dbExists.rows.length === 0) {
      console.log('📦 Creating database:', process.env.DB_NAME);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }

    await client.end();

    // Now connect to our specific database to create tables
    const dbClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await dbClient.connect();
    console.log('✅ Connected to database:', process.env.DB_NAME);

    // Create tables
    console.log('🗂️  Creating tables...');
    
    // Users table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('customer', 'driver', 'admin')) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id),
        driver_id INTEGER REFERENCES users(id),
        pickup_location VARCHAR(255) NOT NULL,
        dropoff_location VARCHAR(255) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
        price DECIMAL(10, 2) NOT NULL,
        distance DECIMAL(8, 2),
        estimated_time INTEGER,
        actual_time INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        method VARCHAR(20) CHECK (method IN ('card', 'cash', 'mobile_money')),
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created successfully');

    // Insert sample data
    console.log('📝 Inserting sample data...');
    
    // Check if users exist
    const usersExist = await dbClient.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersExist.rows[0].count) === 0) {
      await dbClient.query(`
        INSERT INTO users (name, email, password, role, phone) VALUES 
        ('Customer One', 'customer@example.com', 'password', 'customer', '+1234567890'),
        ('Driver One', 'driver@example.com', 'password', 'driver', '+1234567891'),
        ('Admin One', 'admin@example.com', 'password', 'admin', '+1234567892')
      `);

      await dbClient.query(`
        INSERT INTO orders (customer_id, driver_id, pickup_location, dropoff_location, vehicle_type, status, price, distance, estimated_time, actual_time) VALUES 
        (1, 2, '123 Main St', '456 Oak Ave', 'van', 'delivered', 15.00, 5.2, 15, 16),
        (1, 2, '789 Pine Rd', '101 Maple St', 'van', 'delivered', 22.50, 8.7, 25, 24)
      `);

      await dbClient.query(`
        INSERT INTO payments (order_id, amount, status, method, transaction_id) VALUES 
        (1, 15.00, 'completed', 'card', 'TXN12345'),
        (2, 22.50, 'pending', 'cash', NULL)
      `);

      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('✅ Data already exists');
    }

    await dbClient.end();
    console.log('🎉 Database initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.log('\n💡 Please check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Your password in .env file is correct');
    console.log('3. You have permission to create databases');
  }
}

initializeDatabase();