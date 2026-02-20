const db = require('./config/database');

async function updateCashbookPhoneNumbers() {
  try {
    console.log('Checking cashbook entries for missing phone numbers...');
    
    // Get all entries without phone numbers
    const entriesWithoutPhone = await db('cashbook')
      .whereNull('contact_number')
      .orWhere('contact_number', '');
    
    console.log(`Found ${entriesWithoutPhone.length} entries without phone numbers`);
    
    if (entriesWithoutPhone.length > 0) {
      // For demo purposes, add dummy phone numbers
      // In production, you would want to update these manually or through a UI
      for (const entry of entriesWithoutPhone) {
        const dummyPhone = `900000000${Math.floor(Math.random() * 10)}`;
        await db('cashbook')
          .where({ id: entry.id })
          .update({ 
            contact_number: dummyPhone,
            updated_at: new Date().toISOString()
          });
        console.log(`Updated entry ${entry.id} with phone: ${dummyPhone}`);
      }
      
      console.log('✅ Updated all entries with phone numbers');
    } else {
      console.log('✅ All entries already have phone numbers');
    }
    
  } catch (error) {
    console.error('❌ Error updating phone numbers:', error);
    throw error;
  }
}

// Run the update
if (require.main === module) {
  updateCashbookPhoneNumbers()
    .then(() => {
      console.log('🎉 Phone number update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}

module.exports = updateCashbookPhoneNumbers;
