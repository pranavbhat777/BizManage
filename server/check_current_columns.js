const db = require('./config/database');

const checkCurrentColumns = async () => {
  try {
    console.log('Checking current insurance table columns...');
    
    // Get table structure
    const tableInfo = await db.raw("PRAGMA table_info(insurance)");
    
    console.log('\n📋 Current Insurance Table Columns:');
    tableInfo.forEach((column, index) => {
      console.log(`${index + 1}. ${column.name} - ${column.type} (nullable: ${column.notnull === 0 ? 'Yes' : 'No'})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking table:', error);
    process.exit(1);
  }
};

checkCurrentColumns();
