# Automated Cashbook Reminder Setup

## 🎯 What This Does:
- Automatically sends WhatsApp reminders for cashbook entries with interval-based scheduling
- Checks every hour for due reminders
- Sends WhatsApp messages with business branding
- Updates next reminder dates automatically

## 📋 Manual Setup (Windows Task Scheduler):

Since Windows Task Scheduler is having path issues, you can manually set up the automated reminders:

### Option 1: Windows Task Scheduler (Recommended)
```cmd
# Open Command Prompt as Administrator and run:
schtasks /create /tn "BizManage Reminders" /tr "BizManage Reminders" /sc hourly /f "C:\path\to\your\server\auto_reminders.js"

# To check if it was created:
schtasks /query "BizManage Reminders"

# To test manually:
node "C:\path\to\your\server\auto_reminders.js"

# To delete if needed:
schtasks /delete /tn "BizManage Reminders" /f
```

### Option 2: Node.js Cron (Alternative)
```cmd
# Install node-cron globally:
npm install -g node-cron

# Create a cron job file (save as auto_reminders.cron):
```
0 * * * * node "C:\path\to\your\server\auto_reminders.js" >> "C:\path\to\logs\auto_reminders.log" 2>&1
```

# Start the cron service:
node-cron auto_reminders.cron
```

### Option 3: Manual Execution (Simplest)
```cmd
# Just run the scheduler every hour manually:
node "C:\path\to\your\server\auto_reminders.js"

# Or create a batch file to run it:
echo @echo off
echo Starting BizManage Auto Reminders...
node "C:\path\to\your\server\auto_reminders.js"
echo Reminders sent at: %date% %time%
# Save as run_reminders.bat and run it
```

## 🔧 Current Status:
✅ Auto reminder script created and tested
✅ Ready for automated scheduling
✅ Manual reminders work via bell icon

## 📱 WhatsApp Integration:
- Automatic reminders: Sent via WhatsApp URLs
- Manual reminders: Bell icon opens WhatsApp with pre-filled message
- Business branding included in all messages

## 🎯 Next Steps:
1. Choose one of the setup options above
2. Test the automated scheduler
3. Monitor reminder logs
4. Adjust frequency as needed (currently hourly)

**The automated reminder system is ready to use!** 🚀
