import { describe, it, expect } from 'vitest'
import { 
  parseTemplateVariables, 
  replaceTemplateVariables, 
  areAllVariablesFilled, 
  getUnfilledVariables 
} from '../templateUtils'

describe('templateUtils', () => {
  describe('parseTemplateVariables', () => {
    it('应从模板中提取变量', () => {
      const template = '甲方：${甲方}\n乙方：${乙方}\n金额：${合同金额}元'
      const result = parseTemplateVariables(template)
      expect(result).toEqual(['甲方', '乙方', '合同金额'])
    })

    it('应返回唯一的变量名称', () => {
      const template = '金额：${合同金额}元\n实际金额：${合同金额}元'
      const result = parseTemplateVariables(template)
      expect(result).toEqual(['合同金额'])
    })

    it('当没有变量时应返回空数组', () => {
      const template = '这是没有变量的模板'
      const result = parseTemplateVariables(template)
      expect(result).toEqual([])
    })

    it('当内容为空时应返回空数组', () => {
      const template = ''
      const result = parseTemplateVariables(template)
      expect(result).toEqual([])
    })
  })

  describe('replaceTemplateVariables', () => {
    it('应替换所有变量', () => {
      const template = '甲方：${甲方}\n乙方：${乙方}\n金额：${合同金额}元'
      const values = {
        '甲方': '测试公司',
        '乙方': '供应商',
        '合同金额': '10000'
      }
      const result = replaceTemplateVariables(template, values)
      expect(result).toBe('甲方：测试公司\n乙方：供应商\n金额：10000元')
    })

    it('未提供值的变量应保持原样', () => {
      const template = '甲方：${甲方}\n乙方：${乙方}\n金额：${合同金额}元'
      const values = {
        '甲方': '测试公司',
        '合同金额': '10000'
      }
      const result = replaceTemplateVariables(template, values)
      expect(result).toBe('甲方：测试公司\n乙方：${乙方}\n金额：10000元')
    })

    it('当内容为空时应返回空字符串', () => {
      const template = ''
      const values = { '变量': '值' }
      const result = replaceTemplateVariables(template, values)
      expect(result).toBe('')
    })
  })

  describe('areAllVariablesFilled', () => {
    it('当所有变量都有值时应返回true', () => {
      const variables = ['甲方', '乙方', '合同金额']
      const values = {
        '甲方': '测试公司',
        '乙方': '供应商',
        '合同金额': '10000'
      }
      const result = areAllVariablesFilled(variables, values)
      expect(result).toBe(true)
    })

    it('当有变量没有值时应返回false', () => {
      const variables = ['甲方', '乙方', '合同金额']
      const values = {
        '甲方': '测试公司',
        '乙方': '',
        '合同金额': '10000'
      }
      const result = areAllVariablesFilled(variables, values)
      expect(result).toBe(false)
    })

    it('当变量只有空格时应返回false', () => {
      const variables = ['甲方', '乙方', '合同金额']
      const values = {
        '甲方': '测试公司',
        '乙方': '   ',
        '合同金额': '10000'
      }
      const result = areAllVariablesFilled(variables, values)
      expect(result).toBe(false)
    })
  })

  describe('getUnfilledVariables', () => {
    it('应返回未填充的变量列表', () => {
      const variables = ['甲方', '乙方', '合同金额']
      const values = {
        '甲方': '测试公司',
        '乙方': '',
        '合同金额': '10000'
      }
      const result = getUnfilledVariables(variables, values)
      expect(result).toEqual(['乙方'])
    })

    it('应将空格视为未填充', () => {
      const variables = ['甲方', '乙方', '合同金额']
      const values = {
        '甲方': '测试公司',
        '乙方': '   ',
        '合同金额': '10000'
      }
      const result = getUnfilledVariables(variables, values)
      expect(result).toEqual(['乙方'])
    })

    it('当所有变量都已填充时应返回空数组', () => {
      const variables = ['甲方', '乙方', '合同金额']
      const values = {
        '甲方': '测试公司',
        '乙方': '供应商',
        '合同金额': '10000'
      }
      const result = getUnfilledVariables(variables, values)
      expect(result).toEqual([])
    })
  })
}) 