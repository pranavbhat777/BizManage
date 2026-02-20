// Test Transactions API
const db = require('./config/database');

const testTransactionsAPI = async () => {
  try {
    console.log('🧪 Testing Transactions API...\n');

    const businessId = 'a1230e79-70e8-4fe4-970c-9593bba2e16f';

    // Test 1: Check if transactions exist
    console.log('1️⃣ Checking existing transactions...');
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

    console.log(`✅ Found ${transactions.length} transactions in database`);

    if (transactions.length > 0) {
      console.log('\n📋 Sample transactions:');
      transactions.slice(0, 3).forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.product_name} - ${transaction.transaction_type}`);
        console.log(`   Amount: ₹${transaction.total_amount}, Date: ${transaction.transaction_date}`);
      });
    }

    // Test 2: Simulate API response format
    console.log('\n2️⃣ Simulating API response format...');
    const apiResponse = {
      transactions: transactions,
      pagination: {
        page: 1,
        limit: 100,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / 100)
      }
    };

    console.log('✅ API Response Format:', JSON.stringify(apiResponse, null, 2));

    console.log('\n🎯 Transactions API Test Complete!');
    console.log('✅ Frontend should receive this data structure');
    console.log('✅ Check browser network tab for API calls');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testTransactionsAPI();
