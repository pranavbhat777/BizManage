const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database.db');

// Create tables one by one to avoid foreign key issues
const tables = [
  `CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    features TEXT,
    max_employees INTEGER DEFAULT 50,
    active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS business_subscriptions (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS subscription_payments (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

// Add columns to businesses table if they don't exist
const alterTables = [
  `ALTER TABLE businesses ADD COLUMN subscription_status TEXT DEFAULT 'inactive'`,
  `ALTER TABLE businesses ADD COLUMN subscription_end_date DATETIME`
];

async function runMigration() {
  try {
    // Create tables
    for (const sql of tables) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Add columns (ignore errors if they already exist)
    for (const sql of alterTables) {
      await new Promise((resolve) => {
        db.run(sql, () => resolve()); // Ignore errors
      });
    }
    
    // Insert default plans
    const plans = [
      ['basic-plan', 'Basic Plan', 'Perfect for small businesses with up to 10 employees', 499.00, '{"attendance": true, "payroll": true, "reports": true, "max_employees": 10}', 10],
      ['professional-plan', 'Professional Plan', 'Ideal for growing businesses with up to 50 employees', 999.00, '{"attendance": true, "payroll": true, "reports": true, "advances": true, "overtime": true, "max_employees": 50}', 50],
      ['enterprise-plan', 'Enterprise Plan', 'Complete solution for large businesses', 1999.00, '{"attendance": true, "payroll": true, "reports": true, "advances": true, "overtime": true, "api_access": true, "max_employees": 999}', 999]
    ];
    
    for (const plan of plans) {
      await new Promise((resolve) => {
        db.run(
          'INSERT OR IGNORE INTO subscription_plans (id, name, description, price, features, max_employees) VALUES (?, ?, ?, ?, ?, ?)',
          plan,
          () => resolve()
        );
      });
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    db.close();
  }
}

runMigration();
