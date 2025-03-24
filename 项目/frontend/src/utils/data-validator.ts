/**
 * 数据校验工具类
 * 提供各种数据验证和格式化功能
 */

/**
 * 检查值是否为空
 * null, undefined, '', [], {} 都被视为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return true
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return true
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true
  }
  
  return false
}

/**
 * 检查值是否为有效数字
 */
export function isNumber(value: any): boolean {
  if (typeof value === 'number') {
    return !isNaN(value)
  }
  
  if (typeof value === 'string') {
    return !isNaN(Number(value))
  }
  
  return false
}

/**
 * 检查值是否为正数
 */
export function isPositive(value: any): boolean {
  if (!isNumber(value)) {
    return false
  }
  
  return Number(value) > 0
}

/**
 * 检查值是否为手机号（中国大陆）
 */
export function isMobile(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value)
}

/**
 * 检查值是否为邮箱地址
 */
export function isEmail(value: string): boolean {
  return /^[\w.-]+@[\w.-]+\.\w+$/.test(value)
}

/**
 * 检查值是否为身份证号（中国大陆）
 */
export function isIdCard(value: string): boolean {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value)
}

/**
 * 检查值是否为URL
 */
export function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * 检查值是否为IP地址 (IPv4)
 */
export function isIPv4(value: string): boolean {
  return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)
}

/**
 * 检查值是否为日期字符串
 */
export function isDateString(value: string): boolean {
  return !isNaN(Date.parse(value))
}

/**
 * 确保值在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 截断字符串到指定长度，可选添加省略号
 */
export function truncate(str: string, length: number, ellipsis = '...'): string {
  if (str.length <= length) {
    return str
  }
  
  return str.substring(0, length) + ellipsis
}

/**
 * 数据格式化
 */
export const formatters = {
  /**
   * 格式化金额，添加千位分隔符，保留小数位
   */
  money(value: number | string, decimals = 2, symbol = '¥'): string {
    if (!isNumber(value)) {
      return '--'
    }
    
    const num = Number(value)
    return symbol + num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  },
  
  /**
   * 格式化日期
   */
  date(value: string | number | Date, format = 'YYYY-MM-DD'): string {
    if (!value) {
      return '--'
    }
    
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return '--'
      }
      
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      
      return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
    } catch {
      return '--'
    }
  },
  
  /**
   * 格式化文件大小
   */
  fileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
  },
  
  /**
   * 格式化字符串，保留指定长度
   */
  ellipsis(str: string, maxLength = 20): string {
    return truncate(str, maxLength)
  },
  
  /**
   * 格式化手机号，中间部分用*替代
   */
  maskMobile(mobile: string): string {
    if (!isMobile(mobile)) {
      return mobile
    }
    
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
  },
  
  /**
   * 格式化身份证号，中间部分用*替代
   */
  maskIdCard(idCard: string): string {
    if (!isIdCard(idCard)) {
      return idCard
    }
    
    return idCard.replace(/^(.{6}).*(.{4})$/, '$1********$2')
  }
}

/**
 * 数据转换
 */
export const converters = {
  /**
   * 转换为数字
   */
  toNumber(value: any, defaultValue = 0): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }
    
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  },
  
  /**
   * 转换为布尔值
   */
  toBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value
    }
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase()
      return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1'
    }
    
    if (typeof value === 'number') {
      return value === 1
    }
    
    return Boolean(value)
  },
  
  /**
   * 转换为日期对象
   */
  toDate(value: any): Date | null {
    if (!value) {
      return null
    }
    
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  },
  
  /**
   * 转换为数组
   */
  toArray<T = any>(value: any): T[] {
    if (Array.isArray(value)) {
      return value
    }
    
    if (value === null || value === undefined) {
      return []
    }
    
    return [value] as T[]
  },
  
  /**
   * 转换为字符串
   */
  toString(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return Object.prototype.toString.call(value)
      }
    }
    
    return String(value)
  }
}

/**
 * 数据清理
 */
export const cleaners = {
  /**
   * 移除对象中的空值属性
   */
  removeEmpty<T extends object>(obj: T): Partial<T> {
    const result = { ...obj }
    
    Object.keys(result).forEach(key => {
      if (isEmpty(result[key as keyof T])) {
        delete result[key as keyof T]
      }
    })
    
    return result
  },
  
  /**
   * 移除对象中的指定属性
   */
  removeProps<T extends object, K extends keyof T>(obj: T, props: K[]): Omit<T, K> {
    const result = { ...obj }
    
    props.forEach(prop => {
      delete result[prop]
    })
    
    return result
  },
  
  /**
   * 只保留对象中的指定属性
   */
  keepProps<T extends object, K extends keyof T>(obj: T, props: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>
    
    props.forEach(prop => {
      if (prop in obj) {
        result[prop] = obj[prop]
      }
    })
    
    return result
  },
  
  /**
   * 深度去除对象中的空值属性
   */
  deepRemoveEmpty(obj: any): any {
    if (Array.isArray(obj)) {
      return obj
        .map(item => cleaners.deepRemoveEmpty(item))
        .filter(item => !isEmpty(item))
    }
    
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {}
      
      Object.keys(obj).forEach(key => {
        const value = cleaners.deepRemoveEmpty(obj[key])
        if (!isEmpty(value)) {
          result[key] = value
        }
      })
      
      return result
    }
    
    return obj
  }
}

// 导出统一的验证器对象
export default {
  isEmpty,
  isNumber,
  isPositive,
  isMobile,
  isEmail,
  isIdCard,
  isUrl,
  isIPv4,
  isDateString,
  clamp,
  truncate,
  formatters,
  converters,
  cleaners
} 