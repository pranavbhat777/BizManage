const db = require('../config/database');

async function createUsersTable() {
  try {
    console.log('Creating users table with mobile authentication and subscription support...');
    
    // Drop existing table if it exists to start fresh
    await db.schema.dropTableIfExists('users');
    
    // Create new users table
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('mobile_number').unique().notNullable(); // Unique identifier
      table.string('password').notNullable(); // Hashed password
      table.string('business_name').notNullable();
      table.string('email').optional();
      table.string('address').optional();
      
      // Trial and subscription fields
      table.datetime('trial_start_date').nullable();
      table.datetime('trial_end_date').nullable();
      table.string('subscription_status').defaultTo('inactive'); // inactive, trial, active
      table.string('subscription_plan').nullable(); // monthly, weekly
      table.datetime('subscription_start_date').nullable();
      table.datetime('subscription_end_date').nullable();
      table.string('google_purchase_token').nullable(); // For Google Play verification
      table.string('device_id').nullable(); // For anti-abuse
      
      // Business settings
      table.json('working_days').defaultTo(JSON.stringify([1, 2, 3, 4, 5])); // Monday to Friday
      table.integer('standard_working_hours').defaultTo(8);
      table.integer('week_start_day').defaultTo(1); // Monday
      table.json('holidays').defaultTo(JSON.stringify([]));
      table.json('overtime_rates').defaultTo(JSON.stringify({ normal: 1.5, holiday: 2.0 }));
      
      // Metadata
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
    });
    
    console.log('✅ Users table created successfully!');
    
    // Create indexes for performance
    await db.schema.raw('CREATE INDEX idx_users_mobile ON users (mobile_number)');
    await db.schema.raw('CREATE INDEX idx_users_subscription_status ON users (subscription_status)');
    await db.schema.raw('CREATE INDEX idx_users_trial_end ON users (trial_end_date)');
    await db.schema.raw('CREATE INDEX idx_users_device_id ON users (device_id)');
    
    console.log('✅ Indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  createUsersTable()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createUsersTable;
