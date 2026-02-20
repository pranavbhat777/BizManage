const db = require('./config/database');

const checkCashbookData = async () => {
  try {
    console.log('Checking cashbook entries...');
    
    // Get all cashbook entries
    const entries = await db('cashbook').select('*');
    
    console.log(`Found ${entries.length} entries`);
    
    entries.forEach((entry, index) => {
      console.log(`\nEntry ${index + 1}:`);
      console.log(`  ID: ${entry.id}`);
      console.log(`  Name: ${entry.name}`);
      console.log(`  Type: ${entry.type}`);
      console.log(`  Reminder Enabled: ${entry.reminder_enabled}`);
      console.log(`  Reminder Schedule Type: ${entry.reminder_schedule_type || 'NOT SET'}`);
      console.log(`  Reminder Message: ${entry.reminder_message || 'NOT SET'}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking cashbook data:', error);
    process.exit(1);
  }
};

checkCashbookData();
