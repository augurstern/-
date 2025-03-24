module.exports = {
  // 邮件通知配置
  email: {
    // 提醒时间配置（单位：天）
    reminderDays: 3,
    
    // 邮件主题模板
    subjectTemplate: '付款计划即将到期提醒 - {contractTitle}',
    
    // 邮件内容模板
    contentTemplate: `
      <h3>付款计划到期提醒</h3>
      <p>您负责的合同 <strong>{contractTitle}</strong> 有一笔付款计划即将到期：</p>
      <ul>
        <li>付款金额：¥{amount}</li>
        <li>计划付款日期：{plannedDate}</li>
      </ul>
      <p>请及时处理，避免造成逾期。</p>
    `
  },
  
  // 系统内提醒配置
  system: {
    // 提醒消息模板
    messageTemplate: '合同 {contractTitle} 的付款计划将于 {plannedDate} 到期，付款金额：¥{amount}'
  }
};