describe('审批超时处理流程', () => {
  beforeEach(() => {
    cy.login('test_approver', 'password123');
    cy.visit('/contracts/pending');
  });

  it('当审批超时时应自动推进到下一审批阶段', () => {
    cy.intercept('PUT', '/api/contracts/*/timeout').as('timeoutRequest');
    
    cy.get('.pending-contract').first().within(() => {
      cy.clock(new Date(2024, 5, 1));
      cy.tick(1000 * 60 * 60 * 49); // 模拟49小时流逝
      
      cy.get('.contract-status').should('contain', '等待超时处理');
      cy.tick(1000 * 60 * 60 * 2); // 超过50小时阈值
      
      cy.wait('@timeoutRequest').its('response.statusCode').should('eq', 200);
      cy.get('.next-phase-alert').should('be.visible');
      cy.get('.timeout-notification').should('contain', '已自动转交下一审批人');
    });
  });
});