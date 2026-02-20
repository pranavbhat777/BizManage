// Test Recent Transactions API
const db = require('./config/database');

const testRecentTransactions = async () => {
  try {
    console.log('🧪 Testing Recent Transactions API...\n');

    const businessId = 'a1230e79-70e8-4fe4-970c-9593bba2e16f';

    // Test 1: Check if we have any transactions
    console.log('1️⃣ Checking for existing transactions...');
    const transactions = await db('product_transactions')
      .join('products', 'product_transactions.product_id', 'products.id')
      .where({
        'product_transactions.business_id': businessId,
        'products.business_id': businessId
      })
      .select(
        'product_transactions.*',
        'products.name as product_name'
      )
      .orderBy('product_transactions.transaction_date', 'desc')
      .limit(10);

    console.log(`✅ Found ${transactions.length} transactions`);

    if (transactions.length > 0) {
      console.log('\n📋 Recent Transactions:');
      transactions.forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.product_name} - ${transaction.transaction_type}`);
        console.log(`   Quantity: ${transaction.quantity}, Amount: ₹${transaction.total_amount}`);
        console.log(`   Date: ${transaction.transaction_date}`);
        console.log('');
      });
    } else {
      console.log('ℹ️ No transactions found. Creating test data...');

      // Test 2: Create a test product and transaction
      console.log('\n2️⃣ Creating test product...');
      const testProduct = {
        name: 'Test Product for Transactions',
        description: 'Test product',
        opening_quantity: 50,
        purchasing_price: 100,
        selling_price: 150,
        unit: 'pieces',
        min_stock_level: 5
      };

      const product = await db('products').insert({
        id: 'prod-test-' + Date.now(),
        business_id: businessId,
        ...testProduct,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).returning('*');

      console.log('✅ Test product created:', product[0].name);

      // Test 3: Create test transactions
      console.log('\n3️⃣ Creating test transactions...');
      
      const saleTransaction = await db('product_transactions').insert({
        id: 'trans-sale-' + Date.now(),
        product_id: product[0].id,
        business_id: businessId,
        transaction_type: 'sale',
        quantity: 5,
        unit_price: 150,
        total_amount: 750,
        reference: 'TEST-SALE-001',
        notes: 'Test sale transaction',
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }).returning('*');

      console.log('✅ Sale transaction created:', saleTransaction[0].total_amount);

      const purchaseTransaction = await db('product_transactions').insert({
        id: 'trans-purchase-' + Date.now(),
        product_id: product[0].id,
        business_id: businessId,
        transaction_type: 'purchase',
        quantity: 10,
        unit_price: 90,
        total_amount: 900,
        reference: 'TEST-PUR-001',
        notes: 'Test purchase transaction',
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }).returning('*');

      console.log('✅ Purchase transaction created:', purchaseTransaction[0].total_amount);

      // Test 4: Verify transactions
      console.log('\n4️⃣ Verifying transactions...');
      const updatedTransactions = await db('product_transactions')
        .join('products', 'product_transactions.product_id', 'products.id')
        .where({
          'product_transactions.business_id': businessId,
          'products.business_id': businessId
        })
        .select(
          'product_transactions.*',
          'products.name as product_name'
        )
        .orderBy('product_transactions.transaction_date', 'desc')
        .limit(5);

      console.log(`✅ Found ${updatedTransactions.length} transactions after test data creation`);

      updatedTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.product_name} - ${transaction.transaction_type}`);
        console.log(`   Quantity: ${transaction.quantity}, Amount: ₹${transaction.total_amount}`);
        console.log(`   Date: ${new Date(transaction.transaction_date).toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('\n🎯 Recent Transactions Test Complete!');
    console.log('✅ API should return transaction data with product names');
    console.log('✅ Frontend should display transactions in Recent Transactions tab');

  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Stack trace:', error.stack);
  }
};

testRecentTransactions();
