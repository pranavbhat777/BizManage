const { exec } = require('child_process');

const setupSimpleScheduler = () => {
  console.log('⏰ Setting up automated reminder scheduler...');
  
  // Get the current directory path
  const dirPath = __dirname.replace(/\\/g, '\\\\');
  
  // Create Windows Task Scheduler command
  const command = `schtasks /create /tn "BizManage Reminders" /tr "BizManage Reminders" /sc hourly /f "node "${dirPath}\\auto_reminders.js"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error setting up scheduler:', error);
      return;
    }
    
    if (stderr) {
      console.error('❌ Scheduler setup stderr:', stderr);
      return;
    }
    
    console.log('✅ Auto reminder scheduler setup successfully!');
    console.log('📋 Task will run every hour');
    console.log('🔧 To view tasks: schtasks /query "BizManage Reminders"');
    console.log('📱 Scheduler is now active');
  });
};

setupSimpleScheduler();
