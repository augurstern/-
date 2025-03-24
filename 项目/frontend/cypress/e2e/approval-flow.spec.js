describe('合同审批流程测试', () => {
  beforeEach(() => {
    // 登录系统
    cy.login();
    
    // 模拟API请求
    cy.intercept('GET', '/api/contracts/102', {
      statusCode: 200,
      body: {
        id: '102',
        contractName: '审批测试合同',
        clientName: '测试客户',
        amount: 200000,
        signDate: '2024-01-15',
        approvalStatus: 'pending',
        currentApprover: '法务部门',
        approvalFlow: [
          {
            id: '1',
            name: '部门经理',
            status: 'approved',
            approvedBy: '张经理',
            approvedAt: '2024-01-16T10:30:00Z',
            comments: '同意'
          },
          {
            id: '2',
            name: '法务部门',
            status: 'pending',
            approvedBy: null,
            approvedAt: null,
            comments: null
          },
          {
            id: '3',
            name: '财务部门',
            status: 'waiting',
            approvedBy: null,
            approvedAt: null,
            comments: null
          },
          {
            id: '4',
            name: '总经理',
            status: 'waiting',
            approvedBy: null,
            approvedAt: null,
            comments: null
          }
        ]
      }
    }).as('getContract');
    
    cy.intercept('PUT', '/api/contracts/*/approval', {
      statusCode: 200,
      body: { success: true }
    }).as('approveContract');
    
    cy.intercept('PUT', '/api/contracts/*/reject', {
      statusCode: 200,
      body: { success: true }
    }).as('rejectContract');
    
    cy.intercept('PUT', '/api/contracts/*/timeout', {
      statusCode: 200,
      body: { success: true }
    }).as('timeoutContract');
    
    // 访问合同详情页
    cy.visit('/contracts/102');
  });
  
  it('应显示合同的审批流程', () => {
    // 点击审批流程标签
    cy.get('[data-test="approval-flow-tab"]').click();
    
    // 等待合同数据加载
    cy.wait('@getContract');
    
    // 验证审批流程是否正确显示
    cy.get('.approval-step').should('have.length', 4);
    
    // 验证审批步骤状态
    cy.get('.approval-step').eq(0).should('contain', '部门经理').and('contain', '已通过');
    cy.get('.approval-step').eq(1).should('contain', '法务部门').and('contain', '待审批');
    cy.get('.approval-step').eq(2).should('contain', '财务部门').and('contain', '等待中');
    cy.get('.approval-step').eq(3).should('contain', '总经理').and('contain', '等待中');
  });
  
  it('应能通过审批', () => {
    // 点击审批流程标签
    cy.get('[data-test="approval-flow-tab"]').click();
    
    // 等待合同数据加载
    cy.wait('@getContract');
    
    // 点击通过按钮
    cy.contains('通过').click();
    
    // 输入审批意见
    cy.get('.approval-comment').type('同意该合同');
    
    // 提交审批
    cy.get('.submit-approval').click();
    
    // 验证API调用
    cy.wait('@approveContract');
    
    // 验证审批状态更新
    cy.get('.approval-step').eq(1).should('contain', '已通过');
  });
  
  it('应能拒绝审批', () => {
    // 点击审批流程标签
    cy.get('[data-test="approval-flow-tab"]').click();
    
    // 等待合同数据加载
    cy.wait('@getContract');
    
    // 点击拒绝按钮
    cy.contains('拒绝').click();
    
    // 输入拒绝理由
    cy.get('.approval-comment').type('合同条款需要修改');
    
    // 提交拒绝
    cy.get('.submit-rejection').click();
    
    // 验证API调用
    cy.wait('@rejectContract');
    
    // 验证审批状态更新
    cy.get('.approval-step').eq(1).should('contain', '已拒绝');
  });
  
  it('应能处理审批超时', () => {
    // 点击审批流程标签
    cy.get('[data-test="approval-flow-tab"]').click();
    
    // 等待合同数据加载
    cy.wait('@getContract');
    
    // 模拟审批超时
    cy.clock().tick(7 * 24 * 60 * 60 * 1000); // 7天后
    
    // 验证超时状态
    cy.get('.approval-step').eq(1).should('contain', '已超时');
    
    // 验证API调用
    cy.wait('@timeoutContract');
  });