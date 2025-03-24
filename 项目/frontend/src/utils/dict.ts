import { useDictionaryStore } from '@/stores/dictionary'

/**
 * 字典工具函数
 */

/**
 * 获取字典项列表
 * @param dictCode 字典编码
 * @param onlyActive 是否只返回启用状态的项
 * @returns 字典项列表
 */
export const getDictItems = async (dictCode: string, onlyActive = true) => {
  const dictionaryStore = useDictionaryStore()
  const params = onlyActive ? { status: 'active' } : undefined
  return await dictionaryStore.fetchDictItemsByTypeCode(dictCode, params)
}

/**
 * 获取字典标签
 * @param dictCode 字典编码
 * @param value 字典值
 * @param defaultLabel 默认标签
 * @returns 字典标签
 */
export const getDictLabel = async (dictCode: string, value: string, defaultLabel = '') => {
  const items = await getDictItems(dictCode)
  const dictItem = items.find(item => item.value === value)
  return dictItem ? dictItem.label : defaultLabel
}

/**
 * 获取字典项
 * @param dictCode 字典编码
 * @param value 字典值
 * @returns 字典项
 */
export const getDictItem = async (dictCode: string, value: string) => {
  const items = await getDictItems(dictCode)
  return items.find(item => item.value === value)
}

/**
 * 获取字典标签类型
 * @param dictCode 字典编码
 * @param value 字典值
 * @param defaultType 默认类型
 * @returns 标签类型
 */
export const getDictTagType = async (dictCode: string, value: string, defaultType = '') => {
  const dictItem = await getDictItem(dictCode, value)
  return dictItem?.cssClass || defaultType
}

/**
 * 获取字典下拉选项
 * @param dictCode 字典编码
 * @param onlyActive 是否只返回启用状态的项
 * @returns 下拉选项
 */
export const getDictOptions = async (dictCode: string, onlyActive = true) => {
  const items = await getDictItems(dictCode, onlyActive)
  return items.map(item => ({
    label: item.label,
    value: item.value,
    disabled: item.status === 'disabled'
  }))
}

/**
 * 根据字典编码和字典值，格式化为带样式的标签数据
 * @param dictCode 字典编码
 * @param value 字典值
 * @returns 标签数据
 */
export const formatDictTag = async (dictCode: string, value: string) => {
  const dictItem = await getDictItem(dictCode, value)
  return dictItem 
    ? { 
        label: dictItem.label, 
        type: dictItem.cssClass || '' 
      } 
    : { label: value, type: '' }
}

/**
 * 批量格式化字典数据
 * @param data 数据列表
 * @param options 格式化配置
 * @returns 格式化后的数据
 */
export const batchFormatDict = async (data: any[], options: {
  field: string,
  dictCode: string,
  targetField?: string
}[]) => {
  if (!data || !data.length || !options || !options.length) {
    return data
  }
  
  const result = [...data]
  
  for (const opt of options) {
    const { field, dictCode, targetField } = opt
    
    // 获取字典项
    const dictItems = await getDictItems(dictCode)
    
    // 遍历数据
    for (const item of result) {
      if (item[field] !== undefined && item[field] !== null) {
        const dictItem = dictItems.find(d => d.value === item[field])
        if (dictItem) {
          if (targetField) {
            // 指定了目标字段，将标签放入目标字段
            item[targetField] = dictItem.label
          } else {
            // 未指定目标字段，使用原字段名加Label后缀
            item[`${field}Label`] = dictItem.label
          }
          
          // 存储标签类型
          item[`${field}Type`] = dictItem.cssClass || ''
        }
      }
    }
  }
  
  return result
} 