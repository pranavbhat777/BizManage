const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

// Add name column to cashbook table
const alterTable = `
ALTER TABLE cashbook ADD COLUMN name TEXT;
`;

db.run(alterTable, (err) => {
  if (err) {
    console.log('Column might already exist or error:', err.message);
  } else {
    console.log('name column added successfully');
  }
  
  db.close();
});
