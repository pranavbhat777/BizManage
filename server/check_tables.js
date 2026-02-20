const db = require('./config/database');

const checkTables = async () => {
  try {
    console.log('Checking database tables...');
    
    // Get all table names
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    
    console.log('\n📊 Available Tables:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name}`);
    });
    
    // Check for business-related tables
    const businessTables = tables.filter(table => 
      table.name.toLowerCase().includes('business')
    );
    
    if (businessTables.length > 0) {
      console.log('\n🏢 Business-related Tables:');
      businessTables.forEach(table => {
        console.log(`- ${table.name}`);
      });
    } else {
      console.log('\n❌ No business-related tables found');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
};

checkTables();
