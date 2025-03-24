const db = require('../db');
const notificationConfig = require('../config/notification');

// 获取用户的未读通知
const getUserNotifications = (userId) => {
  const stmt = db.prepare(`
    SELECT n.* 
    FROM notifications n
    WHERE n.user_id = ? AND n.read = 0
    ORDER BY n.created_at DESC
  `);
  
  return stmt.all(userId);
};

// 创建系统内通知
const createNotification = (userId, type, message, relatedId = null) => {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, type, message, related_id, created_at, read)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  
  const now = new Date().toISOString();
  stmt.run(userId, type, message, relatedId, now);
};

// 标记通知为已读
const markNotificationAsRead = (notificationId) => {
  const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?');
  stmt.run(notificationId);
};

// 创建付款计划到期提醒
const createPaymentReminder = (payment) => {
  if (!payment.responsible_id) return;
  
  const message = notificationConfig.system.messageTemplate
    .replace('{contractTitle}', payment.contract_title)
    .replace('{plannedDate}', payment.planned_date)
    .replace('{amount}', payment.amount.toLocaleString());
  
  createNotification(
    payment.responsible_id,
    'payment_reminder',
    message,
    payment.id
  );
};

// 检查并创建到期提醒
const checkAndCreateReminders = () => {
  const today = new Date();
  const threeDaysLater = new Date(today.setDate(today.getDate() + 3));
  
  const stmt = db.prepare(`
    SELECT p.*, c.title as contract_title, c.responsible_id
    FROM payment_plans p
    JOIN contracts c ON p.contract_id = c.id
    WHERE p.status = 'pending'
    AND p.planned_date <= ?
    AND p.planned_date > ?
  `);
  
  const upcomingPayments = stmt.all(
    threeDaysLater.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );
  
  upcomingPayments.forEach(payment => {
    createPaymentReminder(payment);
  });
};

module.exports = {
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  checkAndCreateReminders
};