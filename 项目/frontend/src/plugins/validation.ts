import { App } from 'vue'

// 通用验证规则
export const validationRules = {
  // 必填
  required: (message = '该字段不能为空') => ({
    required: true,
    message,
    trigger: 'blur'
  }),
  
  // 字符串长度范围
  length: (min: number, max: number, message?: string) => ({
    min,
    max,
    message: message || `长度必须在 ${min} 到 ${max} 个字符之间`,
    trigger: 'blur'
  }),
  
  // 数字范围
  range: (min: number, max: number, message?: string) => ({
    type: 'number',
    min,
    max,
    message: message || `数值必须在 ${min} 到 ${max} 之间`,
    trigger: 'blur'
  }),
  
  // 邮箱格式
  email: (message = '请输入有效的邮箱地址') => ({
    type: 'email',
    message,
    trigger: 'blur'
  }),
  
  // 手机号格式（中国大陆）
  mobile: (message = '请输入有效的手机号码') => ({
    pattern: /^1[3-9]\d{9}$/,
    message,
    trigger: 'blur'
  }),
  
  // 身份证号码
  idCard: (message = '请输入有效的身份证号码') => ({
    pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
    message,
    trigger: 'blur'
  }),
  
  // URL地址
  url: (message = '请输入有效的URL地址') => ({
    type: 'url',
    message,
    trigger: 'blur'
  }),
  
  // 自定义正则表达式
  pattern: (pattern: RegExp, message: string) => ({
    pattern,
    message,
    trigger: 'blur'
  }),
  
  // 密码强度：至少8位，包含大小写字母和数字
  password: (message = '密码必须至少8位，包含大小写字母和数字') => ({
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
    message,
    trigger: 'blur'
  }),
  
  // 确认密码
  confirmPassword: (password: string, message = '两次输入的密码不一致') => ({
    validator: (_: any, value: string, callback: Function) => {
      if (value !== password) {
        callback(new Error(message))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }),
  
  // 数字
  number: (message = '请输入数字') => ({
    type: 'number',
    message,
    trigger: 'blur'
  }),
  
  // 整数
  integer: (message = '请输入整数') => ({
    pattern: /^-?[0-9]\d*$/,
    message,
    trigger: 'blur'
  }),
  
  // 正整数
  positiveInteger: (message = '请输入正整数') => ({
    pattern: /^[1-9]\d*$/,
    message,
    trigger: 'blur'
  }),
  
  // 金额 (最多两位小数)
  amount: (message = '请输入有效的金额') => ({
    pattern: /^(([1-9]\d*)|\d)(\.\d{1,2})?$/,
    message,
    trigger: 'blur'
  })
}

// 表单数据校验工具
export const validationUtils = {
  /**
   * 校验整个表单
   * @param formRef 表单引用
   * @returns Promise<boolean> 是否通过验证
   */
  validateForm: (formRef: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!formRef) {
        resolve(false)
        return
      }
      
      formRef.validate((valid: boolean) => {
        resolve(valid)
      })
    })
  },
  
  /**
   * 校验单个字段
   * @param formRef 表单引用
   * @param field 字段名
   * @returns Promise<boolean> 是否通过验证
   */
  validateField: (formRef: any, field: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!formRef) {
        resolve(false)
        return
      }
      
      formRef.validateField(field, (error: string) => {
        resolve(!error)
      })
    })
  },
  
  /**
   * 重置表单
   * @param formRef 表单引用
   */
  resetForm: (formRef: any) => {
    if (formRef) {
      formRef.resetFields()
    }
  },
  
  /**
   * 清除表单验证
   * @param formRef 表单引用
   */
  clearValidate: (formRef: any, fields?: string | string[]) => {
    if (formRef) {
      formRef.clearValidate(fields)
    }
  }
}

// 注册验证插件
export function setupValidation(app: App) {
  // 添加全局验证规则和工具方法
  app.config.globalProperties.$rules = validationRules
  app.config.globalProperties.$validate = validationUtils
  
  // 添加动态生成验证规则的方法
  app.config.globalProperties.$generateRules = (schema: Record<string, any[]>) => {
    const rules: Record<string, any[]> = {}
    
    Object.keys(schema).forEach(field => {
      rules[field] = schema[field].map((rule: any) => {
        if (typeof rule === 'function') {
          return rule()
        }
        return rule
      })
    })
    
    return rules
  }
  
  console.log('表单验证插件已安装')
}

export default {
  install(app: App) {
    setupValidation(app)
  }
} 