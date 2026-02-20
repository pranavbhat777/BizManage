const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database.db');

// Add payment_gateway_id column to subscription_payments table
const alterTable = `
ALTER TABLE subscription_payments ADD COLUMN payment_gateway_id TEXT;
`;

db.run(alterTable, (err) => {
  if (err) {
    console.log('Column might already exist or error:', err.message);
  } else {
    console.log('payment_gateway_id column added successfully');
  }
  
  db.close();
});
