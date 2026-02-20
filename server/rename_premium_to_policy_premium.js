const db = require('./config/database');

const renamePremiumToPolicyPremium = async () => {
  try {
    console.log('Renaming premium_amount to policy_premium in insurance table...');
    
    // Rename the column
    await db.schema.alterTable('insurance', (table) => {
      table.renameColumn('premium_amount', 'policy_premium');
    });
    
    console.log('✅ Column renamed successfully: premium_amount → policy_premium');
    console.log('✅ Now we have both policy_number and policy_premium columns');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error renaming column:', error);
    process.exit(1);
  }
};

renamePremiumToPolicyPremium();
