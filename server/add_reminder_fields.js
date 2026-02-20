const db = require('./config/database');

const addReminderFields = async () => {
  try {
    console.log('Adding reminder fields to cashbook table...');
    
    // Add reminder-related columns to cashbook table
    await db.schema.alterTable('cashbook', (table) => {
      table.text('reminder_message').nullable().comment('Personalized reminder message');
      table.boolean('reminder_enabled').defaultTo(false).comment('Whether reminder is enabled');
      table.integer('reminder_interval_days').defaultTo(7).comment('Days between reminders');
      table.datetime('last_reminder_sent').nullable().comment('When last reminder was sent');
      table.datetime('next_reminder_date').nullable().comment('When next reminder should be sent');
    });
    
    console.log('✅ Reminder fields added successfully');
    
    // Create reminders table to track reminder history
    await db.schema.createTable('reminders', (table) => {
      table.increments('id').primary();
      table.text('cashbook_id').notNullable().references('id').inTable('cashbook').onDelete('CASCADE');
      table.text('message').notNullable();
      table.text('contact_number').notNullable();
      table.text('status').defaultTo('pending').comment('pending, sent, failed');
      table.datetime('scheduled_at').notNullable();
      table.datetime('sent_at').nullable();
      table.text('error_message').nullable();
      table.timestamps(true, true);
    });
    
    console.log('✅ Reminders table created successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding reminder fields:', error);
    process.exit(1);
  }
};

addReminderFields();
