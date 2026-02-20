const db = require('./config/database');
const moment = require('moment');

const checkAndSendAutomaticReminders = async () => {
  try {
    console.log('🔄 Checking for automatic reminders...');
    
    // Get all cashbook entries that have automatic reminders enabled
    const entries = await db('cashbook')
      .join('businesses', 'cashbook.business_id', 'businesses.id')
      .select(
        'cashbook.*',
        'businesses.name as business_name'
      )
      .where({
        'cashbook.reminder_enabled': true,
        'cashbook.reminder_schedule_type': 'interval',
        'cashbook.next_reminder_date': db.raw('datetime("now", "localtime") // Get current datetime
      })
      .where('cashbook.next_reminder_date', '<=', db.raw('datetime("now", "localtime'))
      .orderBy('cashbook.next_reminder_date', 'asc')
      .limit(10); // Process up to 10 reminders at a time
    
    console.log(`Found ${entries.length} entries with automatic reminders due`);
    
    if (entries.length === 0) {
      console.log('ℹ️ No automatic reminders due at this time');
      return;
    }
    
    const now = moment();
    let sentCount = 0;
    
    for (const entry of entries) {
      const nextReminderDate = moment(entry.next_reminder_date);
      const isDue = nextReminderDate.isSameOrBefore(now, 'minute');
      
      if (isDue) {
        console.log(`⏰ Sending automatic reminder for entry: ${entry.name} (${entry.id})`);
        
        // Create friendly reminder message
        const reminderMessage = entry.reminder_message || 
          `Hi ${entry.name}, this is a friendly reminder from ${entry.business_name || 'BizManage Pro'} about the outstanding amount of ₹${entry.amount}. Please settle it at your earliest convenience.\n\nPowered by BizManage Pro 🚀`;
        
        // Create reminder record
        const reminderData = {
          cashbook_id: entry.id,
          message: reminderMessage,
          contact_number: entry.contact_number,
          status: 'sent',
          scheduled_at: new Date().toISOString(),
          sent_at: new Date().toISOString()
        };
        
        await db('reminders').insert(reminderData);
        
        // Update cashbook entry
        const nextReminderDate = moment().add(entry.reminder_interval_days, 'days');
        await db('cashbook')
          .where({ id: entry.id })
          .update({
            last_reminder_sent: new Date().toISOString(),
            next_reminder_date: nextReminderDate.toISOString()
          });
        
        // Send WhatsApp notification (if contact number exists)
        if (entry.contact_number) {
          const whatsappUrl = `https://wa.me/${entry.contact_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(reminderMessage)}`;
          console.log(`📱 WhatsApp URL: ${whatsappUrl}`);
          
          // In a real implementation, you would integrate with WhatsApp API here
          // For now, we just log the URL
        }
        
        sentCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Sent ${sentCount} automatic reminders successfully`);
    
  } catch (error) {
    console.error('❌ Error in automatic reminder scheduler:', error);
  }
};

// Run scheduler
if (require.main === module) {
  checkAndSendAutomaticReminders()
    .then(() => {
      console.log('🎯 Automatic reminder check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Scheduler error:', error);
      process.exit(1);
    });
}
