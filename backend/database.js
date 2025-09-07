const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'loadgo.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('customer', 'driver', 'admin')) NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    driver_id INTEGER,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
    price REAL NOT NULL,
    distance REAL,
    estimated_time INTEGER,
    actual_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Payments table
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    method TEXT CHECK(method IN ('card', 'cash', 'mobile_money')),
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample data
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Inserting sample data...');
      
      // Insert sample users
      db.run(`INSERT INTO users (name, email, password, role, phone) VALUES 
        ('Customer One', 'customer@example.com', 'password', 'customer', '+1234567890'),
        ('Driver One', 'driver@example.com', 'password', 'driver', '+1234567891'),
        ('Admin One', 'admin@example.com', 'password', 'admin', '+1234567892')`, function(err) {
        if (err) {
          console.error('Error inserting users:', err);
          return;
        }
        
        // Insert sample orders
        db.run(`INSERT INTO orders (customer_id, driver_id, pickup_location, dropoff_location, vehicle_type, status, price, distance, estimated_time, actual_time) VALUES 
          (1, 2, '123 Main St', '456 Oak Ave', 'van', 'delivered', 15.00, 5.2, 15, 16),
          (1, 2, '789 Pine Rd', '101 Maple St', 'van', 'delivered', 22.50, 8.7, 25, 24)`, function(err) {
          if (err) {
            console.error('Error inserting orders:', err);
            return;
          }
          
          // Insert sample payments
          db.run(`INSERT INTO payments (order_id, amount, status, method, transaction_id) VALUES 
            (1, 15.00, 'completed', 'card', 'TXN12345'),
            (2, 22.50, 'pending', 'cash', NULL)`, function(err) {
            if (err) {
              console.error('Error inserting payments:', err);
            } else {
              console.log('✅ Sample data inserted successfully');
            }
          });
        });
      });
    } else {
      console.log('✅ Database already has data');
    }
  });
});

module.exports = db;