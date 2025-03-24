const cron = require('node-cron');
const { checkAndSendReminders } = require('./notificationService');

// 每天早上9点检查付款计划并发送提醒
const schedulePaymentReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('开始检查付款计划到期情况...');
    try {
      await checkAndSendReminders();
      console.log('付款计划检查完成');
    } catch (error) {
      console.error('付款计划检查失败:', error);
    }
  });
};

module.exports = {
  schedulePaymentReminders
};