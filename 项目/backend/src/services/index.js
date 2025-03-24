const { schedulePaymentReminders } = require('./schedulerService');
const { checkAndCreateReminders } = require('./systemNotificationService');

// 初始化服务
const initializeServices = () => {
  // 启动定时任务
  schedulePaymentReminders();
  
  // 立即检查一次付款计划
  checkAndCreateReminders();
  
  console.log('服务初始化完成');
};

module.exports = {
  initializeServices
};