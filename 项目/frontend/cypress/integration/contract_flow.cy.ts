/// <reference types="cypress" />

describe('合同管理系统测试', () => {
  beforeEach(() => {
    // 模拟成功登录
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'admin',
          name: '管理员',
          role: 'admin',
          email: 'admin@example.com'
        }
      }
    }).as('loginRequest')
    
    // 模拟获取仪表盘数据
    cy.intercept('GET', '/api/statistics/dashboard', {
      statusCode: 200,
      body: {
        totalContracts: 120,
        activeContracts: 85,
        expiringContracts: 12,
        pendingApprovals: 5,
        contractsByStatus: [
          { name: '执行中', value: 85 },
          { name: '已完成', value: 20 },
          { name: '已终止', value: 10 },
          { name: '草稿', value: 5 }
        ],
        contractsByType: [
          { name: '销售合同', value: 50 },
          { name: '采购合同', value: 30 },
          { name: '服务合同', value: 25 },
          { name: '租赁合同', value: 15 }
        ],
        recentContracts: [
          {
            id: '1001',
            contractNumber: 'XS-2023-001',
            title: '产品销售合同',
            type: 'sales',
            partyName: '上海科技有限公司',
            amount: 120000,
            status: 'active',
            updateTime: '2023-03-15 14:30:22'
          },
          {
            id: '1002',
            contractNumber: 'FW-2023-002',
            title: '软件开发服务合同',
            type: 'service',
            partyName: '北京软件科技有限公司',
            amount: 85000,
            status: 'active',
            updateTime: '2023-03-12 10:15:48'
          }
        ]
      }
    }).as('dashboardData')
    
    // 模拟获取合同列表
    cy.intercept('GET', '/api/contracts*', {
      statusCode: 200,
      body: {
        total: 120,
        page: 1,
        pageSize: 10,
        items: Array(10).fill(0).map((_, i) => ({
          id: `100${i + 1}`,
          contractNumber: `XS-2023-00${i + 1}`,
          title: `测试合同 ${i + 1}`,
          type: i % 2 === 0 ? 'sales' : 'service',
          partyName: `测试公司 ${i + 1}`,
          amount: 100000 + i * 10000,
          status: i % 3 === 0 ? 'active' : (i % 3 === 1 ? 'draft' : 'completed'),
          startDate: '2023-03-01',
          endDate: '2024-03-01',
          updateTime: '2023-03-15 14:30:22'
        }))
      }
    }).as('contractsList')
    
    // 模拟获取合同模板
    cy.intercept('GET', '/api/contracts/templates*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: '1',
            name: '销售合同模板',
            type: 'sales',
            description: '标准销售合同模板',
            content: '甲方：${甲方}\n乙方：${乙方}\n...',
            isDefault: true,
            lastUpdated: '2023-01-15 10:30:00'
          },
          {
            id: '2',
            name: '服务合同模板',
            type: 'service',
            description: '标准服务合同模板',
            content: '甲方：${甲方}\n乙方：${乙方}\n...',
            isDefault: true,
            lastUpdated: '2023-01-16 14:20:00'
          }
        ]
      }
    }).as('contractTemplates')
  })

  it('用户登录和工作流测试', () => {
    // 访问登录页
    cy.visit('/login')
    cy.get('[data-test="username-input"]').type('admin')
    cy.get('[data-test="password-input"]').type('password')
    cy.get('[data-test="login-button"]').click()
    cy.wait('@loginRequest')
    
    // 验证成功导航至仪表盘
    cy.url().should('include', '/')
    cy.wait('@dashboardData')
    cy.contains('仪表盘').should('exist')
    cy.contains('合同总数：120').should('exist')
    
    // 导航至合同列表
    cy.contains('合同管理').click()
    cy.wait('@contractsList')
    cy.url().should('include', '/contracts')
    cy.contains('合同管理').should('exist')
    
    // 测试搜索功能
    cy.get('[data-test="search-input"]').type('测试')
    cy.get('[data-test="search-button"]').click()
    cy.wait('@contractsList')
    
    // 测试筛选功能
    cy.get('[data-test="status-filter"]').click()
    cy.contains('执行中').click()
    cy.get('[data-test="search-button"]').click()
    cy.wait('@contractsList')
    
    // 测试新建合同流程
    cy.get('[data-test="create-contract-button"]').click()
    cy.url().should('include', '/contracts/create')
    cy.wait('@contractTemplates')
    
    // 选择模板
    cy.contains('销售合同模板').click()
    cy.get('[data-test="select-template-button"]').click()
    
    // 填写变量
    cy.get('[data-test="variable-input-甲方"]').type('我方公司名称')
    cy.get('[data-test="variable-input-乙方"]').type('客户公司名称')
    cy.get('[data-test="next-step-button"]').click()
    
    // 编辑合同内容
    cy.get('[data-test="contract-title-input"]').type('2024年度销售合同')
    cy.get('[data-test="contract-amount-input"]').type('150000')
    cy.get('[data-test="save-draft-button"]').click()
    
    // 验证保存成功
    cy.contains('合同草稿已保存').should('exist')
    cy.url().should('include', '/contracts')
  })
  
  it('测试合同模板管理', () => {
    // 模拟登录
    cy.visit('/login')
    cy.get('[data-test="username-input"]').type('admin')
    cy.get('[data-test="password-input"]').type('password')
    cy.get('[data-test="login-button"]').click()
    cy.wait('@loginRequest')
    
    // 导航至系统设置
    cy.contains('系统设置').click()
    cy.url().should('include', '/settings')
    
    // 进入模板管理
    cy.contains('合同模板').click()
    cy.wait('@contractTemplates')
    
    // 测试新建模板
    cy.get('[data-test="create-template-button"]').click()
    cy.get('[data-test="template-name-input"]').type('新测试模板')
    cy.get('[data-test="template-type-select"]').click()
    cy.contains('销售合同').click()
    cy.get('[data-test="template-content-input"]').type('合同内容：${合同内容}\n金额：${合同金额}元')
    
    // 模拟保存请求
    cy.intercept('POST', '/api/contracts/templates', {
      statusCode: 200,
      body: {
        id: '100',
        name: '新测试模板',
        type: 'sales',
        content: '合同内容：${合同内容}\n金额：${合同金额}元',
        isDefault: false,
        lastUpdated: new Date().toISOString()
      }
    }).as('saveTemplate')
    
    cy.get('[data-test="save-template-button"]').click()
    cy.wait('@saveTemplate')
    
    // 验证保存成功
    cy.contains('模板创建成功').should('exist')
    cy.contains('新测试模板').should('exist')
  })
  
  it('测试系统设置', () => {
    // 模拟登录
    cy.visit('/login')
    cy.get('[data-test="username-input"]').type('admin')
    cy.get('[data-test="password-input"]').type('password')
    cy.get('[data-test="login-button"]').click()
    cy.wait('@loginRequest')
    
    // 导航至系统设置
    cy.contains('系统设置').click()
    cy.url().should('include', '/settings')
    
    // 模拟获取系统设置
    cy.intercept('GET', '/api/settings/system', {
      statusCode: 200,
      body: {
        systemName: '合同管理系统',
        companyName: '演示公司',
        logoUrl: '/logo.png',
        theme: 'light',
        dateFormat: 'YYYY-MM-DD',
        currencySymbol: '¥'
      }
    }).as('systemSettings')
    
    // 访问系统设置页面
    cy.contains('系统参数').click()
    cy.wait('@systemSettings')
    
    // 修改设置
    cy.get('[data-test="system-name-input"]').clear().type('新合同管理系统')
    cy.get('[data-test="company-name-input"]').clear().type('新公司名称')
    
    // 模拟保存设置
    cy.intercept('PUT', '/api/settings/system', {
      statusCode: 200,
      body: {
        systemName: '新合同管理系统',
        companyName: '新公司名称',
        logoUrl: '/logo.png',
        theme: 'light',
        dateFormat: 'YYYY-MM-DD',
        currencySymbol: '¥'
      }
    }).as('saveSettings')
    
    cy.get('[data-test="save-settings-button"]').click()
    cy.wait('@saveSettings')
    
    // 验证保存成功
    cy.contains('设置已保存').should('exist')
  })
}) 