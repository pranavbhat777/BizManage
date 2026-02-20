const db = require('./config/database');

const checkInsuranceTable = async () => {
  try {
    console.log('Checking insurance table structure...');
    
    // Get table structure
    const tableInfo = await db.raw("PRAGMA table_info(insurance)");
    
    console.log('\n📋 Insurance Table Columns:');
    tableInfo.forEach((column, index) => {
      console.log(`${index + 1}. ${column.name} - ${column.type} (nullable: ${column.notnull === 0 ? 'Yes' : 'No'})`);
    });
    
    // Test a simple insert
    console.log('\n🧪 Testing simple insert...');
    const testData = {
      id: 'test-' + Date.now(),
      business_id: 'a1230e79-70e8-4fe4-970c-9593bba2e16f',
      policy_name: 'Test Policy',
      insurance_company: 'Test Company',
      policy_type: 'health',
      start_date: '2024-01-01',
      expiry_date: '2024-12-31',
      contact_phone: '1234567890'
    };
    
    try {
      await db('insurance').insert(testData);
      console.log('✅ Simple insert successful');
      
      // Clean up test data
      await db('insurance').where({ id: testData.id }).del();
      console.log('✅ Test data cleaned up');
      
    } catch (insertError) {
      console.log('❌ Insert error:', insertError.message);
      console.log('❌ Error details:', insertError);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking insurance table:', error);
    process.exit(1);
  }
};

checkInsuranceTable();
