const db = require('./config/database');

const renamePremiumToPolicyNumber = async () => {
  try {
    console.log('Renaming premium column to policy_number in insurance table...');
    
    // Rename the column
    await db.schema.alterTable('insurance', (table) => {
      table.renameColumn('premium_amount', 'policy_number');
    });
    
    console.log('✅ Column renamed successfully: premium_amount → policy_number');
    console.log('✅ This change will affect all existing insurance records');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error renaming column:', error);
    process.exit(1);
  }
};

renamePremiumToPolicyNumber();
