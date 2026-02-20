const db = require('./config/database');

const checkCashbookTable = async () => {
  try {
    console.log('Checking cashbook table structure...');
    
    // Get table structure
    const tableInfo = await db.raw("PRAGMA table_info(cashbook)");
    
    console.log('\n📊 Cashbook Table Columns:');
    tableInfo.forEach((column, index) => {
      console.log(`${index + 1}. ${column.name} - ${column.type} (nullable: ${column.notnull === 0 ? 'Yes' : 'No'})`);
    });
    
    // Test a simple insert to check schema
    console.log('\n🧪 Testing reminder insert...');
    const testData = {
      id: 'test-reminder-' + Date.now(),
      cashbook_id: 'cashbook-1770975606534-uj5xj4f9h',
      message: 'Test reminder message',
      contact_number: '1234567890',
      status: 'sent',
      scheduled_at: new Date().toISOString(),
      sent_at: new Date().toISOString()
    };
    
    try {
      await db('reminders').insert(testData);
      console.log('✅ Reminder insert test successful');
      
      // Clean up test data
      await db('reminders').where({ id: testData.id }).del();
      console.log('✅ Test data cleaned up');
      
    } catch (insertError) {
      console.log('❌ Reminder insert error:', insertError.message);
      console.log('❌ Error details:', insertError);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking cashbook table:', error);
    process.exit(1);
  }
};

checkCashbookTable();
