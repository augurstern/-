describe('合同全流程测试', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.intercept('http://localhost:3000/**').as('apiRequest')
  })

  it('应成功完成合同创建→审批→履约提醒流程', () => {
    // 合同创建
    cy.get('[data-testid=new-contract-btn]').click()
    cy.get('#contract-name').type('测试合同')
    cy.get('#client-name').type('测试客户')
    cy.get('#amount').type('10000')
    cy.get('[data-testid=submit-btn]').click()

    // 审批流程验证
    cy.wait('@apiRequest').its('response.statusCode').should('eq', 201)
    cy.contains('.el-step__title', '法务审批').should('be.visible')
    
    // 履约提醒验证
    cy.clock(new Date(2025, 2, 15))
    cy.get('[data-testid=reminder-btn]').click()
    cy.contains('下次付款提醒日期：2025-03-15').should('exist')
  })

  afterEach(() => {
    // 清理测试数据
    cy.exec('rm c:/Users/31706/Desktop/Contract/项目/backend/test-db.sqlite', {
      failOnNonZeroExit: false
    })
  })
})