describe('通知系统测试', () => {
  beforeEach(() => {
    // 登录系统
    cy.login();
    
    // 模拟API请求
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: '1',
          type: 'CONTRACT',
          level: 'info',
          status: 'unread',
          title: '合同审批通知',
          content: '您有一个新的合同需要审批',
          createTime: new Date().toISOString(),
          sender: {
            name: '系统',
            avatar: ''
          }
        },
        {
          id: '2',
          type: 'PAYMENT',
          level: 'warning',
          status: 'unread',
          title: '付款提醒',
          content: '合同XS-2023-001有一笔付款即将到期',
          createTime: new Date().toISOString(),
          sender: {
            name: '系统',
            avatar: ''
          }
        }
      ]
    }).as('getNotifications');
    
    cy.intercept('PUT', '/api/notifications/*/read', {
      statusCode: 200,
      body: { success: true }
    }).as('markAsRead');
    
    cy.intercept('PUT', '/api/notifications/read-all', {
      statusCode: 200,
      body: { success: true }
    }).as('markAllAsRead');
    
    cy.intercept('GET', '/api/user/notification-settings', {
      statusCode: 200,
      body: {
        emailNotification: true,
        smsNotification: false,
        contractReminder: true,
        paymentReminder: true,
        approvalNotification: true,
        systemNotification: true,
        muteStartTime: '22:00',
        muteEndTime: '08:00'
      }
    }).as('getNotificationSettings');
    
    // 访问首页
    cy.visit('/');
  });
  
  it('应显示未读通知数量', () => {
    // 等待通知数据加载
    cy.wait('@getNotifications');
    
    // 检查通知徽章是否显示正确的未读数量
    cy.get('.notification-badge').should('contain', '2');
  });
  
  it('应能打开通知面板并显示通知列表', () => {
    // 等待通知数据加载
    cy.wait('@getNotifications');
    
    // 点击通知图标
    cy.get('.notification-icon').click();
    
    // 验证通知面板是否打开
    cy.get('.notification-panel').should('be.visible');
    
    // 验证通知列表是否显示所有通知
    cy.get('.notification-item').should('have.length', 2);
    cy.get('.notification-item').first().should('contain', '合同审批通知');
    cy.get('.notification-item').last().should('contain', '付款提醒');
  });
  
  it('应能将通知标记为已读', () => {
    // 等待通知数据加载
    cy.wait('@getNotifications');
    
    // 点击通知图标打开通知面板
    cy.get('.notification-icon').click();
    
    // 点击第一个通知的已读按钮
    cy.get('.notification-item').first().find('.mark-read-btn').click();
    
    // 验证API调用
    cy.wait('@markAsRead');
    
    // 验证通知状态变更
    cy.get('.notification-item').first().should('have.class', 'read');
    
    // 验证未读数量减少
    cy.get('.notification-badge').should('contain', '1');
  });
  
  it('应能将所有通知标记为已读', () => {
    // 等待通知数据加载
    cy.wait('@getNotifications');
    
    // 点击通知图标打开通知面板
    cy.get('.notification-icon').click();
    
    // 点击全部已读按钮
    cy.get('.mark-all-read-btn').click();
    
    // 验证API调用
    cy.wait('@markAllAsRead');
    
    // 验证所有通知状态变更
    cy.get('.notification-item').should('have.class', 'read');
    
    // 验证未读数量为0
    cy.get('.notification-badge').should('not.exist');
  });
  
  it('应能访问通知设置页面并更新设置', () => {
    // 点击用户头像
    cy.get('.user-avatar').click();
    
    // 点击通知设置菜单项
    cy.get('.notification-settings-menu-item').click();
    
    // 验证页面跳转
    cy.url().should('include', '/settings/notifications');
    
    // 等待设置数据加载
    cy.wait('@getNotificationSettings');
    
    // 切换邮件通知开关
    cy.get('[data-test="email-notification-switch"]').click();
    
    // 切换短信通知开关
    cy.get('[data-test="sms-notification-switch"]').click();
    
    // 保存设置
    cy.get('[data-test="save-settings-button"]').click();
    
    // 验证API调用
    cy.intercept('PUT', '/api/user/notification-settings', {
      statusCode: 200,
      body: { success: true }
    }).as('updateSettings');
    
    cy.wait('@updateSettings');
    
    // 验证成功提示
    cy.get('.el-message--success').should('be.visible');
  });
  
  it('应能筛选不同类型的通知', () => {
    // 等待通知数据加载
    cy.wait('@getNotifications');
    
    // 点击通知图标打开通知面板
    cy.get('.notification-icon').click();
    
    // 点击合同通知筛选按钮
    cy.get('[data-test="filter-contract"]').click();
    
    // 验证只显示合同类型通知
    cy.get('.notification-item').should('have.length', 1);
    cy.get('.notification-item').first().should('contain', '合同审批通知');
    
    // 点击付款通知筛选按钮
    cy.get('[data-test="filter-payment"]').click();
    
    // 验证只显示付款类型通知
    cy.get('.notification-item').should('have.length', 1);
    cy.get('.notification-item').first().should('contain', '付款提醒');
    
    // 点击全部通知筛选按钮
    cy.get('[data-test="filter-all"]').click();
    
    // 验证显示所有通知
    cy.get('.notification-item').should('have.length', 2);
  });
});