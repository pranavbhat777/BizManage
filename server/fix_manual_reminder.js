// This is the corrected section for manual reminders
// Replace lines 545-550 in cashbook.js with this:

    // Check if manual reminders are allowed
    if (entry.reminder_schedule_type === 'interval') {
      return res.status(400).json({ 
        message: 'This entry is set to automatic interval reminders only. Use "Both" option to enable manual reminders too.' 
      });
    }
