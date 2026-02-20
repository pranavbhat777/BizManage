const db = require('./config/database');

const createInsuranceTable = async () => {
  try {
    console.log('Creating insurance table...');
    
    // Create insurance table
    await db.schema.createTable('insurance', (table) => {
      table.text('id').primary();
      table.text('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
      table.text('policy_name').notNullable();
      table.text('insurance_company').notNullable();
      table.text('policy_number').notNullable();
      table.text('policy_type').notNullable(); // health, life, vehicle, property, etc.
      table.decimal('premium_amount', 10, 2).notNullable();
      table.text('premium_frequency').notNullable(); // monthly, quarterly, yearly
      table.date('start_date').notNullable();
      table.date('expiry_date').notNullable();
      table.text('contact_person').notNullable();
      table.text('contact_phone').notNullable();
      table.text('contact_email').nullable();
      table.text('coverage_details').nullable();
      table.text('notes').nullable();
      table.boolean('active').defaultTo(true);
      table.boolean('notification_sent').defaultTo(false);
      table.datetime('last_notification_sent').nullable();
      table.timestamps(true, true);
    });
    
    console.log('✅ Insurance table created successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating insurance table:', error);
    process.exit(1);
  }
};

createInsuranceTable();
