// Create sample data for testing stats
const db = require('./config/database');

const createSampleData = async () => {
  try {
    console.log('🔄 Creating sample data...');
    
    const businessId = 'a1230e79-70e8-4fe4-970c-9593bba2e16f';
    
    // Create sample products
    const products = [
      {
        id: 'prod-1',
        business_id: businessId,
        name: 'Laptop',
        description: 'High-performance laptop',
        sku: 'LAP-001',
        category: 'Electronics',
        opening_quantity: 10,
        current_quantity: 8,
        purchasing_price: 50000,
        selling_price: 60000,
        unit: 'pieces',
        min_stock_level: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-2',
        business_id: businessId,
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        sku: 'CHR-001',
        category: 'Furniture',
        opening_quantity: 20,
        current_quantity: 15,
        purchasing_price: 3000,
        selling_price: 4500,
        unit: 'pieces',
        min_stock_level: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-3',
        business_id: businessId,
        name: 'Notebook Set',
        description: 'Set of 5 notebooks',
        sku: 'NB-001',
        category: 'Stationery',
        opening_quantity: 100,
        current_quantity: 3,
        purchasing_price: 150,
        selling_price: 250,
        unit: 'sets',
        min_stock_level: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert products
    for (const product of products) {
      await db('products').insert(product).onConflict().ignore();
    }

    // Create sample transactions
    const transactions = [
      {
        id: 'txn-1',
        business_id: businessId,
        product_id: 'prod-1',
        transaction_type: 'sale',
        quantity: 2,
        unit_price: 60000,
        total_amount: 120000,
        transaction_date: new Date().toISOString(),
        reference: 'SALE-001',
        notes: 'Sold to customer A',
        created_at: new Date().toISOString()
      },
      {
        id: 'txn-2',
        business_id: businessId,
        product_id: 'prod-2',
        transaction_type: 'sale',
        quantity: 5,
        unit_price: 4500,
        total_amount: 22500,
        transaction_date: new Date().toISOString(),
        reference: 'SALE-002',
        notes: 'Sold to customer B',
        created_at: new Date().toISOString()
      },
      {
        id: 'txn-3',
        business_id: businessId,
        product_id: 'prod-3',
        transaction_type: 'purchase',
        quantity: 50,
        unit_price: 150,
        total_amount: 7500,
        transaction_date: new Date().toISOString(),
        reference: 'PUR-001',
        notes: 'Purchased from supplier',
        created_at: new Date().toISOString()
      }
    ];

    // Insert transactions
    for (const transaction of transactions) {
      await db('product_transactions').insert(transaction).onConflict().ignore();
    }

    console.log('✅ Sample data created successfully!');
    console.log('📊 Products created:', products.length);
    console.log('💰 Transactions created:', transactions.length);
    console.log('🎯 Stats should now show real values');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

createSampleData();
