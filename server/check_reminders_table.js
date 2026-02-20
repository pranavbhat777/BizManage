const db = require('./config/database');

const checkRemindersTable = async () => {
  try {
    console.log('Checking reminders table structure...');
    
    // Get table structure
    const tableInfo = await db.raw("PRAGMA table_info(reminders)");
    
    console.log('\n📊 Reminders Table Columns:');
    tableInfo.forEach((column, index) => {
      console.log(`${index + 1}. ${column.name} - ${column.type} (nullable: ${column.notnull === 0 ? 'Yes' : 'No'})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking reminders table:', error);
    process.exit(1);
  }
};

checkRemindersTable();
