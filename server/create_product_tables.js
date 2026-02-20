const db = require('./config/database');

const createProductTables = async () => {
  try {
    console.log('🔄 Creating product management tables...');

    // Check if products table already exists
    const productsTableExists = await db.raw(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='products'
    `);

    if (productsTableExists.length === 0) {
      // Create products table
      await db.raw(`
        CREATE TABLE products (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          sku TEXT,
          category TEXT,
          opening_quantity REAL DEFAULT 0,
          current_quantity REAL DEFAULT 0,
          purchasing_price REAL DEFAULT 0,
          selling_price REAL DEFAULT 0,
          unit TEXT DEFAULT 'pieces',
          min_stock_level REAL DEFAULT 0,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses(id)
        )
      `);

      console.log('✅ Products table created');
    } else {
      console.log('✅ Products table already exists');
    }

    // Check if product_transactions table already exists
    const transactionsTableExists = await db.raw(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='product_transactions'
    `);

    if (transactionsTableExists.length === 0) {
      // Create product_transactions table
      await db.raw(`
        CREATE TABLE product_transactions (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          business_id TEXT NOT NULL,
          transaction_type TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'production'
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          total_amount REAL NOT NULL,
          reference TEXT,
          notes TEXT,
          transaction_date DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id),
          FOREIGN KEY (business_id) REFERENCES businesses(id)
        )
      `);

      console.log('✅ Product transactions table created');
    } else {
      console.log('✅ Product transactions table already exists');
    }

    // Create indexes for better performance
    try {
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id)`);
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`);
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
      
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_product_transactions_product_id ON product_transactions(product_id)`);
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_product_transactions_business_id ON product_transactions(business_id)`);
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_product_transactions_date ON product_transactions(transaction_date)`);
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_product_transactions_type ON product_transactions(transaction_type)`);
      
      console.log('✅ Indexes created for product tables');
    } catch (error) {
      console.log('ℹ️ Indexes may already exist:', error.message);
    }

  } catch (error) {
    console.error('❌ Error creating product tables:', error);
    throw error;
  }
};

// Run the table creation
if (require.main === module) {
  createProductTables()
    .then(() => {
      console.log('🎯 Product tables setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup error:', error);
      process.exit(1);
    });
}

module.exports = createProductTables;
