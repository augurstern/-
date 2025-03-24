describe('支付计划测试', () => {
  beforeEach(() => {
    // 登录系统
    cy.login();
    
    // 模拟API请求
    cy.intercept('GET', '/api/contracts/*/payment-plans', {
      statusCode: 200,
      body: [
        {
          id: 1,
          contract_id: '101',
          amount: 50000,
          planned_date: '2024-12-31',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getPaymentPlans');
    
    cy.intercept('POST', '/api/contracts/*/payment-plans', {
      statusCode: 201,
      body: { 
        id: 3,
        contract_id: '101',
        amount: 30000,
        planned_date: '2025-09-30',
        actual_payment_date: null,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    }).as('createPaymentPlan');
    
    cy.intercept('PUT', '/api/payment-plans/*', {
      statusCode: 200,
      body: { 
        id: 1,
        contract_id: '101',
        amount: 50000,
        planned_date: '2024-12-31',
        actual_payment_date: new Date().toISOString().split('T')[0],
        status: 'paid'
      }
    }).as('updatePaymentPlan');
    
    cy.intercept('GET', '/api/contracts/101', {
      statusCode: 200,
      body: {
        id: '101',
        title: '测试合同',
        partyName: '测试客户',
        amount: 100000,
        signDate: '2024-01-01',
        status: 'active'
      }
    }).as('getContract');
    
    // 模拟删除支付计划API
    cy.intercept('DELETE', '/api/payment-plans/*', {
      statusCode: 200,
      body: { message: '支付计划已删除' }
    }).as('deletePaymentPlan');
    
    // 模拟导出支付计划API
    cy.intercept('GET', '/api/contracts/*/payment-plans/export', {
      statusCode: 200,
      headers: {
        'content-disposition': 'attachment; filename="payment_plans_101.xlsx"'
      },
      body: new Blob(['模拟的Excel文件内容'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    }).as('exportPaymentPlans');
    
    // 访问合同详情页
    cy.visit('/contracts/101');
  });
  
  it('应显示合同的支付计划列表', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 验证支付计划列表是否显示
    cy.get('.el-table__row').should('have.length', 2);
    cy.get('.el-table__row').first().should('contain', '50,000');
    cy.get('.el-table__row').first().should('contain', '2024-12-31');
    cy.get('.el-table__row').first().should('contain', '待付款');
    cy.get('.el-table__row').last().should('contain', '50,000');
    cy.get('.el-table__row').last().should('contain', '2025-06-30');
  });
  
  it('应能创建新的支付计划', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 点击添加支付计划按钮
    cy.contains('添加付款计划').click();
    
    // 模拟添加支付计划后的数据刷新
    cy.intercept('GET', '/api/contracts/*/payment-plans', {
      statusCode: 200,
      body: [
        {
          id: 1,
          contract_id: '101',
          amount: 50000,
          planned_date: '2024-12-31',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          contract_id: '101',
          amount: 30000,
          planned_date: '2025-09-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getUpdatedPaymentPlans');
    
    // 验证API调用
    cy.wait('@createPaymentPlan');
    cy.wait('@getUpdatedPaymentPlans');
    
    // 验证列表更新
    cy.get('.el-table__row').should('have.length', 3);
    cy.get('.el-table__row').last().should('contain', '30,000');
    cy.get('.el-table__row').last().should('contain', '2025-09-30');
  });
  
  it('应能修改支付计划金额', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 修改第一个支付计划的金额
    cy.get('.el-table__row').first().find('.el-input-number__increase').click().click();
    
    // 模拟更新支付计划后的数据刷新
    cy.intercept('PUT', '/api/payment-plans/*', {
      statusCode: 200,
      body: { 
        id: 1,
        contract_id: '101',
        amount: 50200,
        planned_date: '2024-12-31',
        actual_payment_date: null,
        status: 'pending'
      }
    }).as('updatePaymentAmount');
    
    // 模拟获取更新后的支付计划列表
    cy.intercept('GET', '/api/contracts/*/payment-plans', {
      statusCode: 200,
      body: [
        {
          id: 1,
          contract_id: '101',
          amount: 50200,
          planned_date: '2024-12-31',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getUpdatedAmountPlans');
    
    // 验证API调用
    cy.wait('@updatePaymentAmount');
    cy.wait('@getUpdatedAmountPlans');
    
    // 验证修改后的数据
    cy.get('.el-table__row').first().should('contain', '50,200');
    cy.get('.el-table__row').first().should('contain', '2024-12-31');
  });
  
  it('应能处理删除支付计划失败的情况', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 模拟删除失败
    cy.intercept('DELETE', '/api/payment-plans/*', {
      statusCode: 500,
      body: { error: '删除支付计划失败' }
    }).as('deletePaymentPlanFail');
    
    // 点击第二个支付计划的删除按钮
    cy.get('.el-table__row').last().contains('删除').click();
    
    // 确认删除操作
    cy.get('.el-message-box__wrapper').find('.el-button--primary').click();
    
    // 验证API调用
    cy.wait('@deletePaymentPlanFail');
    
    // 验证错误提示
    cy.contains('删除支付计划失败').should('exist');
    
    // 验证列表未更新
    cy.get('.el-table__row').should('have.length', 2);
  });
: 50200,
          planned_date: '2024-12-31',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getUpdatedAmountPlans');
    
    // 验证API调用
    cy.wait('@updatePaymentAmount');
    cy.wait('@getUpdatedAmountPlans');
    
    // 验证修改后的数据
    cy.get('.el-table__row').first().should('contain', '50,200');
  });
  
  it('应能标记支付计划为已付款', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 点击第一个支付计划的标记为已付款按钮
    cy.get('.el-table__row').first().contains('标记为已付款').click();
    
    // 模拟获取更新后的支付计划列表
    cy.intercept('GET', '/api/contracts/*/payment-plans', {
      statusCode: 200,
      body: [
        {
          id: 1,
          contract_id: '101',
          amount: 50000,
          planned_date: '2024-12-31',
          actual_payment_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getUpdatedStatusPlans');
    
    // 验证API调用
    cy.wait('@updatePaymentPlan');
    cy.wait('@getUpdatedStatusPlans');
    
    // 验证状态变更
    cy.get('.el-table__row').first().should('contain', '已付款');
    cy.get('.el-tag--success').should('exist');
  });
  
  it('应能处理删除支付计划失败的情况', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 模拟删除失败
    cy.intercept('DELETE', '/api/payment-plans/*', {
      statusCode: 500,
      body: { error: '删除支付计划失败' }
    }).as('deletePaymentPlanFail');
    
    // 点击第二个支付计划的删除按钮
    cy.get('.el-table__row').last().contains('删除').click();
    
    // 确认删除操作
    cy.get('.el-message-box__wrapper').find('.el-button--primary').click();
    
    // 验证API调用
    cy.wait('@deletePaymentPlanFail');
    
    // 验证错误提示
    cy.contains('删除支付计划失败').should('exist');
    
    // 验证列表未更新
    cy.get('.el-table__row').should('have.length', 2);
  });
: 50000,
          planned_date: '2024-12-31',
          actual_payment_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getUpdatedStatusPlans');
    
    // 验证API调用
    cy.wait('@updatePaymentPlan');
    cy.wait('@getUpdatedStatusPlans');
    
    // 验证状态变更
    cy.get('.el-table__row').first().should('contain', '已付款');
    cy.get('.el-tag--success').should('exist');
  });
  
  it('应能导出支付计划', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 点击导出按钮
    cy.contains('导出付款计划').click();
    
    // 验证API调用
    cy.wait('@exportPaymentPlans');
    
    // 验证导出成功提示
    cy.contains('导出成功').should('exist');
  });
  
  it('应能删除支付计划', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 点击第二个支付计划的删除按钮
    cy.get('.el-table__row').last().contains('删除').click();
    
    // 确认删除操作
    cy.get('.el-message-box__wrapper').find('.el-button--primary').click();
    
    // 模拟获取更新后的支付计划列表
    cy.intercept('GET', '/api/contracts/*/payment-plans', {
      statusCode: 200,
      body: [
        {
          id: 1,
          contract_id: '101',
          amount: 50000,
          planned_date: '2024-12-31',
          actual_payment_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          contract_id: '101',
          amount: 50000,
          planned_date: '2025-06-30',
          actual_payment_date: null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getUpdatedStatusPlans');
    
    // 验证API调用
    cy.wait('@updatePaymentPlan');
    cy.wait('@getUpdatedStatusPlans');
    
    // 验证状态变更
    cy.get('.el-table__row').first().should('contain', '已付款');
    cy.get('.el-tag--success').should('exist');
  });
  
  it('应能处理删除支付计划失败的情况', () => {
    // 点击支付计划标签
    cy.get('[data-test="payment-plans-tab"]').click();
    
    // 等待支付计划数据加载
    cy.wait('@getPaymentPlans');
    
    // 模拟删除失败
    cy.intercept('DELETE', '/api/payment-plans/*', {
      statusCode: 500,
      body: { error: '删除支付计划失败' }
    }).as('deletePaymentPlanFail');
    
    // 点击第二个支付计划的删除按钮
    cy.get('.el-table__row').last().contains('删除').click();
    
    // 确认删除操作
    cy.get('.el-message-box__wrapper').find('.el-button--primary').click();
    
    // 验证API调用
    cy.wait('@deletePaymentPlanFail');
    
    // 验证错误提示
    cy.contains('删除支付计划失败').should('exist');
    
    // 验证列表未更新
    cy.get('.el-table__row').should('have.length', 2);
  });