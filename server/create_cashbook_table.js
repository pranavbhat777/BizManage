const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite3');

// Create cashbook table
const createCashbookTable = `
CREATE TABLE IF NOT EXISTS cashbook (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    amount REAL NOT NULL CHECK (amount >= 0),
    name TEXT NOT NULL,
    title TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    proof_type TEXT CHECK (proof_type IN ('receipt', 'invoice', 'bank_statement', 'other')),
    proof_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);
`;

db.run(createCashbookTable, (err) => {
  if (err) {
    console.error('Error creating cashbook table:', err.message);
  } else {
    console.log('Cashbook table created successfully');
  }
  
  db.close();
});
