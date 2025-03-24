/**
 * 合同数据验证模式
 */
const Joi = require('joi');

// 创建合同验证模式
const createContractSchema = {
  body: Joi.object({
    title: Joi.string().required().min(3).max(100).messages({
      'string.base': '合同标题必须是字符串',
      'string.empty': '合同标题不能为空',
      'string.min': '合同标题至少需要{#limit}个字符',
      'string.max': '合同标题不能超过{#limit}个字符',
      'any.required': '合同标题是必填项'
    }),
    content: Joi.string().allow('').max(5000).messages({
      'string.base': '合同内容必须是字符串',
      'string.max': '合同内容不能超过{#limit}个字符'
    }),
    parties: Joi.string().required().min(2).max(100).messages({
      'string.base': '合同方必须是字符串',
      'string.empty': '合同方不能为空',
      'string.min': '合同方至少需要{#limit}个字符',
      'string.max': '合同方不能超过{#limit}个字符',
      'any.required': '合同方是必填项'
    }),
    amount: Joi.number().positive().required().messages({
      'number.base': '合同金额必须是数字',
      'number.positive': '合同金额必须是正数',
      'any.required': '合同金额是必填项'
    }),
    sign_date: Joi.date().iso().max('now').messages({
      'date.base': '签订日期必须是有效的日期',
      'date.format': '签订日期必须是ISO格式',
      'date.max': '签订日期不能晚于当前日期'
    }),
    payment_cycle: Joi.number().integer().min(1).max(12).messages({
      'number.base': '付款周期必须是数字',
      'number.integer': '付款周期必须是整数',
      'number.min': '付款周期最小为{#limit}',
      'number.max': '付款周期最大为{#limit}'
    })
  })
};

// 更新合同验证模式
const updateContractSchema = {
  params: Joi.object({
    id: Joi.number().integer().required().messages({
      'number.base': '合同ID必须是数字',
      'number.integer': '合同ID必须是整数',
      'any.required': '合同ID是必填项'
    })
  }),
  body: Joi.object({
    title: Joi.string().min(3).max(100).messages({
      'string.base': '合同标题必须是字符串',
      'string.min': '合同标题至少需要{#limit}个字符',
      'string.max': '合同标题不能超过{#limit}个字符'
    }),
    content: Joi.string().allow('').max(5000).messages({
      'string.base': '合同内容必须是字符串',
      'string.max': '合同内容不能超过{#limit}个字符'
    }),
    parties: Joi.string().min(2).max(100).messages({
      'string.base': '合同方必须是字符串',
      'string.min': '合同方至少需要{#limit}个字符',
      'string.max': '合同方不能超过{#limit}个字符'
    }),
    amount: Joi.number().positive().messages({
      'number.base': '合同金额必须是数字',
      'number.positive': '合同金额必须是正数'
    }),
    sign_date: Joi.date().iso().max('now').messages({
      'date.base': '签订日期必须是有效的日期',
      'date.format': '签订日期必须是ISO格式',
      'date.max': '签订日期不能晚于当前日期'
    }),
    payment_cycle: Joi.number().integer().min(1).max(12).messages({
      'number.base': '付款周期必须是数字',
      'number.integer': '付款周期必须是整数',
      'number.min': '付款周期最小为{#limit}',
      'number.max': '付款周期最大为{#limit}'
    }),
    approval_status: Joi.string().valid('draft', 'active', 'archived').messages({
      'string.base': '审批状态必须是字符串',
      'any.only': '审批状态必须是以下之一: draft, active, archived'
    })
  })
};

module.exports = {
  createContractSchema,
  updateContractSchema
};