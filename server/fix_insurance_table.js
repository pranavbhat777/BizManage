const db = require('./config/database');

const fixInsuranceTable = async () => {
  try {
    console.log('Fixing insurance table constraints...');
    
    // Make optional fields truly nullable
    await db.schema.alterTable('insurance', (table) => {
      table.text('policy_number').nullable().alter();
      table.decimal('premium_amount', 10, 2).nullable().alter();
      table.text('premium_frequency').nullable().alter();
      table.text('contact_person').nullable().alter();
      table.text('contact_phone').nullable().alter();
    });
    
    console.log('✅ Insurance table constraints fixed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing insurance table:', error);
    process.exit(1);
  }
};

fixInsuranceTable();
