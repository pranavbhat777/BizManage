const db = require('./config/database');

const addVehicleNumberColumn = async () => {
  try {
    console.log('Adding vehicle_number column to insurance table...');
    
    // Check if column already exists
    const tableInfo = await db.raw("PRAGMA table_info(insurance)");
    const existingColumns = tableInfo.map(col => col.name);
    
    if (existingColumns.includes('vehicle_number')) {
      console.log('✅ vehicle_number column already exists');
      process.exit(0);
    }
    
    // Add the column
    await db.schema.alterTable('insurance', (table) => {
      table.text('vehicle_number').nullable();
    });
    
    console.log('✅ vehicle_number column added successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding vehicle_number column:', error);
    process.exit(1);
  }
};

addVehicleNumberColumn();
