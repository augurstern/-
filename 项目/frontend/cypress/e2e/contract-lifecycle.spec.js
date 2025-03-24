describe('合同全生命周期测试', () => {
  beforeEach(() => {
    cy.login();
    
    // 模拟合同创建API
    cy.intercept('POST', '/api/contracts', {
      statusCode: 201,
      body: {
        id: 'CT2024001',
        title: '测试全生命周期合同',
        partyName: '生命周期测试客户',
        amount: 200000,
        signDate: new Date().toISOString().split('T')[0],
        status: 'pending_approval'
      }
    }).as('createContract');

    // 模拟审批流程API
    cy.intercept('POST', '/api/contracts/CT2024001/approve', {
      statusCode: 200,
      body: {
        approvalDate: new Date().toISOString().split('T')[0],
        status: 'active'
      }
    }).as('approveContract');

    // 模拟支付计划API
    cy.intercept('POST', '/api/contracts/CT2024001/payment-plans', {
      statusCode: 201,
      body: {
        id: 3,
        amount: 100000,
        planned_date: '2024-12-31',
        status: 'pending'
      }
    }).as('addPaymentPlan');

    // 模拟归档API
    cy.intercept('PUT', '/api/contracts/CT2024001/archive', {
      statusCode: 200,
      body: {
        archivedAt: new Date().toISOString().split('T')[0],
        status: 'archived'
      }
    }).as('archiveContract');

    cy.visit('/contracts');
  });

  it('应完成合同创建->审批->添加支付计划->归档全流程', () => {
    // 创建新合同
    cy.get('[data-test="new-contract-btn"]').click();
    cy.get('#contractTitle').type('全生命周期测试合同');
    cy.get('#contractAmount').type('200000');
    cy.get('#signDate').type(new Date().toISOString().split('T')[0]);
    cy.contains('提交审批').click();

    cy.wait('@createContract').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
      cy.contains('合同创建成功').should('exist');
    });

    // 审批流程
    cy.visit('/contracts/CT2024001');
    cy.get('[data-test="approve-btn"]').click();
    cy.get('.el-dialog__footer').contains('确认通过').click();

    cy.wait('@approveContract').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      cy.contains('审批通过').should('exist');
      cy.get('[data-test="contract-status"]').should('contain', '生效中');
    });

    // 添加支付计划
    cy.get('[data-test="payment-plans-tab"]').click();
    cy.contains('添加付款计划').click();
    cy.get('#paymentAmount').type('100000');
    cy.get('#plannedDate').type('2024-12-31');
    cy.contains('确认添加').click();

    cy.wait('@addPaymentPlan').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
      cy.get('.el-table__row').should('have.length', 1);
      cy.get('.el-table__row').first().should('contain', '100,000');
    });

    // 归档合同
    cy.get('[data-test="archive-btn"]').click();
    cy.get('.el-message-box__input textarea').type('已完成所有付款计划');
    cy.get('.el-message-box__btns').contains('确认归档').click();

    cy.wait('@archiveContract').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      cy.contains('归档成功').should('exist');
      cy.get('[data-test="contract-status"]').should('contain', '已归档');
    });
  });

  it('应处理审批被拒绝的情况', () => {
    cy.intercept('POST', '/api/contracts/CT2024001/reject', {
      statusCode: 200,
      body: {
        rejectionReason: '预算不足',
        status: 'rejected'
      }
    }).as('rejectContract');

    cy.visit('/contracts/CT2024001');
    cy.get('[data-test="reject-btn"]').click();
    cy.get('.el-dialog__footer').contains('确认拒绝').click();

    cy.wait('@rejectContract').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      cy.contains('拒绝原因：预算不足').should('exist');
      cy.get('[data-test="contract-status"]').should('contain', '已拒绝');
    });
  });
}); {
    // 创建新合同
    cy.visit('/contracts/create');
    cy.get('[data-test="contract-title"]').type('测试生命周期合同');
    cy.get('[data-test="contract-amount"]').type('100000');
    cy.get('[data-test="party-a"]').type('我方公司');
    cy.get('[data-test="party-b"]').type('测试客户');
    cy.get('[data-test="start-date"]').type('2024-01-01');
    cy.get('[data-test="end-date"]').type('2024-12-31');
    cy.get('[data-test="payment-terms"]').type('分期付款');
    cy.get('[data-test="save-draft"]').click();
    cy.wait('@createContract');

    // 验证合同创建成功
    cy.url().should('include', '/contracts/1001');
    cy.contains('测试生命周期合同').should('exist');
    cy.contains('草稿').should('exist');

    // 提交审批
    cy.get('[data-test="submit-approval"]').click();
    cy.wait('@submitContract');
    cy.contains('待审批').should('exist');

    // 验证合同历史记录
    cy.get('[data-test="history-tab"]').click();
    cy.wait('@getContractHistory');
    cy.contains('创建合同').should('exist');

    // 添加支付计划
    cy.get('[data-test="payment-tab"]').click();
    cy.get('[data-test="add-payment-plan"]').click();
    cy.get('[data-test="payment-amount"]').type('50000');
    cy.get('[data-test="payment-date"]').type('2024-06-30');
    cy.get('[data-test="save-payment-plan"]').click();

    // 验证支付计划添加成功
    cy.contains('50,000').should('exist');
    cy.contains('2024-06-30').should('exist');

    // 模拟合同审批通过
    cy.intercept('PUT', '/api/contracts/*/approve', {
      statusCode: 200,
      body: { status: 'active' }
    }).as('approveContract');

    cy.get('[data-test="approve-button"]').click();
    cy.get('[data-test="approval-comment"]').type('同意');
    cy.get('[data-test="confirm-approval"]').click();
    cy.wait('@approveContract');

    // 验证合同状态更新
    cy.contains('执行中').should('exist');

    // 模拟合同归档
    cy.intercept('PUT', '/api/contracts/*/archive', {
      statusCode: 200,
      body: { status: 'archived' }
    }).as('archiveContract');

    cy.get('[data-test="archive-button"]').click();
    cy.get('[data-test="archive-reason"]').type('合同已完成');
    cy.get('[data-test="confirm-archive"]').click();
    cy.wait('@archiveContract');

    // 验证合同已归档
    cy.contains('已归档').should('exist');
  });
});