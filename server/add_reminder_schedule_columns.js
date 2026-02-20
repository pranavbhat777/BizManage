const db = require('./config/database');

const addReminderScheduleColumns = async () => {
  try {
    console.log('Adding reminder schedule columns to cashbook table...');
    
    // Check if columns already exist
    const tableInfo = await db.raw("PRAGMA table_info(cashbook)");
    const existingColumns = tableInfo.map(col => col.name);
    
    console.log('Existing columns:', existingColumns);
    
    // Add reminder_schedule_type column if it doesn't exist
    if (!existingColumns.includes('reminder_schedule_type')) {
      await db.schema.alterTable('cashbook', (table) => {
        table.text('reminder_schedule_type').defaultTo('interval');
      });
      console.log('✅ Added reminder_schedule_type column');
    } else {
      console.log('ℹ️ reminder_schedule_type column already exists');
    }
    
    // Add reminder_interval_enabled column if it doesn't exist
    if (!existingColumns.includes('reminder_interval_enabled')) {
      await db.schema.alterTable('cashbook', (table) => {
        table.boolean('reminder_interval_enabled').defaultTo(true);
      });
      console.log('✅ Added reminder_interval_enabled column');
    } else {
      console.log('ℹ️ reminder_interval_enabled column already exists');
    }
    
    // Add reminder_manual_enabled column if it doesn't exist
    if (!existingColumns.includes('reminder_manual_enabled')) {
      await db.schema.alterTable('cashbook', (table) => {
        table.boolean('reminder_manual_enabled').defaultTo(false);
      });
      console.log('✅ Added reminder_manual_enabled column');
    } else {
      console.log('ℹ️ reminder_manual_enabled column already exists');
    }
    
    console.log('✅ Cashbook table schema updated successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding reminder schedule columns:', error);
    process.exit(1);
  }
};

addReminderScheduleColumns();
