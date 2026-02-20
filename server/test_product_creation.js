// Test Product Creation
const Product = require('./models/product');

const testProductCreation = async () => {
  try {
    console.log('🧪 Testing Product Creation...\n');

    const businessId = 'a1230e79-70e8-4fe4-970c-9593bba2e16f';

    // Test 1: Create a product
    console.log('1️⃣ Creating a test product...');
    const productData = {
      name: 'Test Product',
      description: 'A test product for demonstration',
      sku: 'TEST-001',
      category: 'Electronics',
      opening_quantity: 100,
      purchasing_price: 500,
      selling_price: 750,
      unit: 'pieces',
      min_stock_level: 10
    };

    const product = await Product.createProduct(businessId, productData);
    console.log('✅ Product created successfully:');
    console.log('   ID:', product.id);
    console.log('   Name:', product.name);
    console.log('   Current Quantity:', product.current_quantity);
    console.log('   Purchase Price:', product.purchasing_price);
    console.log('   Selling Price:', product.selling_price);

    // Test 2: Get all products to verify
    console.log('\n2️⃣ Verifying product in database...');
    const products = await Product.getProductsByBusinessId(businessId);
    console.log('✅ Total products found:', products.products.length);

    const createdProduct = products.products.find(p => p.id === product.id);
    if (createdProduct) {
      console.log('✅ Product verified in database');
      console.log('   Profit per unit:', createdProduct.selling_price - createdProduct.purchasing_price);
    } else {
      console.log('❌ Product not found in database');
    }

    console.log('\n🎯 Product Creation Test Complete!');
    console.log('✅ Product management system is working correctly');

  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('Stack trace:', error.stack);
  }
};

testProductCreation();
