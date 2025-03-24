const nodemailer = require('nodemailer');
const db = require('../db');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 获取即将到期的付款计划
const getUpcomingPayments = () => {
  const today = new Date();
  const threeDaysLater = new Date(today.setDate(today.getDate() + 3));
  
  const stmt = db.prepare(`
    SELECT p.*, c.title as contract_title, c.responsible_email 
    FROM payment_plans p
    JOIN contracts c ON p.contract_id = c.id
    WHERE p.status = 'pending'
    AND p.planned_date <= ?
    AND p.planned_date > ?
  `);
  
  return stmt.all(threeDaysLater.toISOString().split('T')[0], today.toISOString().split('T')[0]);
};

// 发送到期提醒邮件
const sendPaymentReminder = async (payment) => {
  if (!payment.responsible_email) return;
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: payment.responsible_email,
    subject: `付款计划即将到期提醒 - ${payment.contract_title}`,
    html: `
      <h3>付款计划到期提醒</h3>
      <p>您负责的合同 <strong>${payment.contract_title}</strong> 有一笔付款计划即将到期：</p>
      <ul>
        <li>付款金额：¥${payment.amount.toLocaleString()}</li>
        <li>计划付款日期：${payment.planned_date}</li>
      </ul>
      <p>请及时处理，避免造成逾期。</p>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`付款提醒邮件已发送至 ${payment.responsible_email}`);
  } catch (error) {
    console.error('发送付款提醒邮件失败:', error);
  }
};

// 检查并发送到期提醒
const checkAndSendReminders = async () => {
  const upcomingPayments = getUpcomingPayments();
  
  for (const payment of upcomingPayments) {
    await sendPaymentReminder(payment);
  }
};

module.exports = {
  checkAndSendReminders
};