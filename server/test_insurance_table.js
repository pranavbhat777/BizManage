const db = require('./config/database');

const testInsuranceTable = async () => {
  try {
    console.log('Testing insurance table structure...');
    
    // Try to get table info
    const tableInfo = await db.raw("PRAGMA table_info(insurance)");
    console.log('Insurance table structure:');
    console.table(tableInfo);
    
    // Try a simple insert test
    console.log('\nTesting simple insert...');
    const testData = {
      id: 'test-' + Date.now(),
      business_id: 'a1230e79-70e8-4fe4-970c-9593bba2e16f',
      policy_name: 'Test Policy',
      insurance_company: 'Test Company',
      policy_type: 'health',
      start_date: '2024-01-01',
      expiry_date: '2024-12-31'
    };
    
    const result = await db('insurance').insert(testData);
    console.log('Insert successful:', result);
    
    // Clean up
    await db('insurance').where({ id: testData.id }).del();
    console.log('Test record cleaned up');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing insurance table:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno
    });
    process.exit(1);
  }
};

testInsuranceTable();
