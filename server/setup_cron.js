const { exec } = require('child_process');

const setupCronJob = () => {
  console.log('⏰ Setting up automated reminder scheduler...');
  
  // For Windows, we'll use Windows Task Scheduler
  // This command creates a scheduled task to run every hour
  const command = `schtasks /create /tn "BizManage Auto Reminders" /tr "BizManage Auto Reminders" /sc hourly /mo /f "node "${__dirname}\\auto_reminders.js"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error setting up cron job:', error);
      return;
    }
    
    if (stderr) {
      console.error('❌ Cron setup stderr:', stderr);
      return;
    }
    
    console.log('✅ Auto reminder scheduler setup successfully!');
    console.log('📋 Task will run every hour');
    console.log('🔧 To manage: schtasks /query "BizManage Auto Reminders"');
    console.log('🗑️ To delete: schtasks /delete /tn "BizManage Auto Reminders"');
    console.log('📱 Manual test: node auto_reminders.js');
    
    // Test the scheduler once
    console.log('🧪 Testing scheduler...');
    exec('node "${__dirname}\\auto_reminders.js"', (testError, testStdout, testStderr) => {
      if (testError) {
        console.error('❌ Test error:', testError);
      } else {
        console.log('✅ Scheduler test completed successfully!');
      }
    });
  });
};

setupCronJob();
