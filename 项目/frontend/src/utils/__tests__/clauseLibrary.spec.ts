import { describe, it, expect } from 'vitest'
import { 
  contractTypeOptions, 
  typeNameMap, 
  getClausesByType, 
  getAllClausesForType,
  getRecommendedClauses
} from '../clauseLibrary'

describe('clauseLibrary', () => {
  describe('contractTypeOptions', () => {
    it('应包含预期的合同类型选项', () => {
      expect(contractTypeOptions.length).toBeGreaterThan(0)
      expect(contractTypeOptions[0].value).toBe('')
      expect(contractTypeOptions[0].label).toBe('全部类型')
      
      const salesOption = contractTypeOptions.find(option => option.value === 'sales')
      expect(salesOption).toBeDefined()
      expect(salesOption?.label).toBe('销售合同')
    })
  })

  describe('typeNameMap', () => {
    it('应包含所有合同类型的名称映射', () => {
      expect(Object.keys(typeNameMap).length).toBeGreaterThan(0)
      expect(typeNameMap['sales']).toBe('销售合同')
      expect(typeNameMap['purchase']).toBe('采购合同')
    })
  })

  describe('getClausesByType', () => {
    it('应返回指定类型的条款', () => {
      const salesClauses = getClausesByType('sales')
      expect(salesClauses.length).toBeGreaterThan(0)
      expect(salesClauses[0].category).toBeDefined()
      expect(salesClauses[0].title).toBeDefined()
      expect(salesClauses[0].content).toBeDefined()
    })

    it('应返回空数组如果类型不存在', () => {
      const invalidTypeClauses = getClausesByType('invalid_type')
      expect(invalidTypeClauses).toEqual([])
    })
  })

  describe('getAllClausesForType', () => {
    it('应返回指定类型的条款和通用条款', () => {
      const allClauses = getAllClausesForType('sales')
      expect(allClauses.length).toBeGreaterThan(0)
      
      // 检查是否包含通用条款
      const hasCommonClause = allClauses.some(clause => 
        clause.id.startsWith('common_')
      )
      expect(hasCommonClause).toBe(true)
      
      // 检查是否包含销售条款
      const hasSalesClause = allClauses.some(clause => 
        clause.id.startsWith('sales_')
      )
      expect(hasSalesClause).toBe(true)
    })
  })

  describe('getRecommendedClauses', () => {
    it('当内容包含关键词时应返回推荐条款', () => {
      const content = '本合同约定了付款方式和付款条件，甲方需要按时支付相关费用。'
      const clauses = getRecommendedClauses(content, 'sales')
      expect(clauses.length).toBeGreaterThan(0)
      
      // 检查是否包含付款相关条款
      const hasPaymentClause = clauses.some(clause => 
        clause.category === 'payment'
      )
      expect(hasPaymentClause).toBe(true)
    })

    it('当内容为空时应返回空数组', () => {
      const clauses = getRecommendedClauses('', 'sales')
      expect(clauses).toEqual([])
    })

    it('应根据指定的最大数量限制结果', () => {
      const content = '本合同约定了付款方式、交付条件、质量保证和违约责任。'
      const clauses = getRecommendedClauses(content, 'sales', 2)
      expect(clauses.length).toBeLessThanOrEqual(2)
    })
  })
}) 