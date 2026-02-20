// Test Database Connection
const db = require('./config/database');

const testDBConnection = async () => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Simple query
    const products = await db('products').select('*').limit(1);
    console.log('✅ Simple query works:', products.length, 'products found');
    
    // Test 2: Check if image_url column exists
    const columns = await db.raw('PRAGMA table_info(products)');
    const hasImageUrlColumn = columns.some(col => col.name === 'image_url');
    console.log('✅ image_url column exists:', hasImageUrlColumn);
    
    // Test 3: Try to insert a simple product
    const testProduct = {
      id: 'test-' + Date.now(),
      business_id: 'a1230e79-70e8-4fe4-970c-9593bba2e16f',
      name: 'Test Product',
      description: 'Test Description',
      sku: 'TEST-001',
      category: 'Test Category',
      opening_quantity: 10,
      current_quantity: 10,
      purchasing_price: 100,
      selling_price: 150,
      unit: 'pieces',
      min_stock_level: 5,
      image_url: '/api/products/images/test.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await db('products').insert(testProduct);
    console.log('✅ Test insert successful:', result);
    
    // Clean up test data
    await db('products').where({ id: testProduct.id }).del();
    console.log('✅ Test cleanup completed');
    
    console.log('🎯 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Stack trace:', error.stack);
  }
};

testDBConnection();
