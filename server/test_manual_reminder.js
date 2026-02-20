const db = require('./config/database');

const testManualReminder = async () => {
  try {
    console.log('🧪 Testing manual reminder...');
    
    // Find a cashbook entry with manual reminders enabled
    const entry = await db('cashbook')
      .where({ 
        reminder_enabled: true,
        reminder_schedule_type: 'manual'
      })
      .first();
    
    if (!entry) {
      console.log('❌ No manual reminder entries found');
      console.log('ℹ️ Creating test entry...');
      
      // Create a test entry
      const testEntry = {
        id: 'test-manual-' + Date.now(),
        business_id: 'a1230e79-70e8-4fe4-970c-9593bba2e16f',
        type: 'out',
        amount: 1000,
        name: 'Test User',
        contact_number: '1234567890',
        reminder_enabled: true,
        reminder_schedule_type: 'manual',
        reminder_message: 'Test reminder message'
      };
      
      await db('cashbook').insert(testEntry);
      console.log('✅ Test entry created');
    }
    
    // Test sending manual reminder
    if (entry) {
      console.log('📱 Testing manual reminder for entry:', entry.id);
      
      const response = await fetch('http://localhost:5000/api/cashbook/' + entry.id + '/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      const data = await response.json();
      console.log('📤 Response:', data);
      
      if (response.ok) {
        console.log('✅ Manual reminder test successful!');
      } else {
        console.log('❌ Manual reminder test failed:', data);
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
};

testManualReminder();
