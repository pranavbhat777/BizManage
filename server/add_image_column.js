const db = require('./config/database');

const addImageColumn = async () => {
  try {
    console.log('🔄 Adding image_url column to products table...');

    // Check if image_url column already exists
    const tableInfo = await db.raw(`
      PRAGMA table_info(products)
    `);

    const hasImageColumn = tableInfo.some(column => column.name === 'image_url');

    if (!hasImageColumn) {
      // Add image_url column
      await db.raw(`
        ALTER TABLE products ADD COLUMN image_url TEXT
      `);

      console.log('✅ image_url column added successfully');
    } else {
      console.log('✅ image_url column already exists');
    }

    console.log('🎯 Migration completed');

  } catch (error) {
    console.error('❌ Error adding image_url column:', error);
    throw error;
  }
};

// Run the migration
if (require.main === module) {
  addImageColumn()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration error:', error);
      process.exit(1);
    });
}

module.exports = addImageColumn;
