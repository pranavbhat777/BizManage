const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database.db');

// Read and execute migration SQL
const migrationSQL = fs.readFileSync('./migrations/004_create_subscriptions.sql', 'utf8');

db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('Migration error:', err);
  } else {
    console.log('Migration completed successfully!');
  }
  
  db.close();
});
