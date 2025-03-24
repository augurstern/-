import { ref, onMounted } from 'vue'
import { useDictionaryStore } from '@/stores/dictionary'
import type { DictItem } from '@/api/dictionary'
import { debounce } from 'lodash-es'

/**
 * 字典数据钩子函数
 * @param dictCode 字典类型编码
 * @param onlyActive 是否只返回启用状态的字典项
 * @returns 字典项数组、加载状态
 */
export function useDictionary(dictCode: string, onlyActive: boolean = true) {
  const dictionaryStore = useDictionaryStore()
  const dictList = ref<DictItem[]>([])
  const loading = ref(true)
  
  // 获取字典数据的函数
  const getDictData = async () => {
    loading.value = true
    try {
      const params = onlyActive ? { status: 'active' } : undefined
      const data = await dictionaryStore.fetchDictItemsByTypeCode(dictCode, params)
      dictList.value = data
    } catch (error) {
      console.error(`获取字典数据[${dictCode}]失败:`, error)
    } finally {
      loading.value = false
    }
  }
  
  // 组件挂载时获取字典数据
  onMounted(() => {
    getDictData()
  })
  
  /**
   * 通过字典值获取字典标签
   * @param value 字典值
   * @param defaultLabel 默认标签，当找不到对应的字典项时返回此值
   * @returns 字典标签
   */
  const getDictLabel = (value: string, defaultLabel = ''): string => {
    const item = dictList.value.find(item => item.value === value)
    return item ? item.label : defaultLabel
  }
  
  /**
   * 通过字典值获取字典项
   * @param value 字典值
   * @returns 字典项
   */
  const getDictItem = (value: string): DictItem | undefined => {
    return dictList.value.find(item => item.value === value)
  }
  
  /**
   * 获取格式化后的字典项，用于选择器等组件
   * @returns 格式化后的字典项数组 {label, value}
   */
  const getOptions = () => {
    return dictList.value.map(item => ({
      label: item.label,
      value: item.value,
      disabled: item.status === 'disabled'
    }))
  }
  
  /**
   * 获取带有样式信息的标签
   * @param value 字典值
   * @returns 字典标签对象 {label, type}
   */
  const getTagData = (value: string) => {
    const item = getDictItem(value)
    return item 
      ? { 
          label: item.label, 
          type: item.cssClass || '' 
        } 
      : { label: value, type: '' }
  }
  
  return {
    dictList,
    loading,
    getDictLabel,
    getDictItem,
    getOptions,
    getTagData,
    refresh: getDictData
  }
}

/**
 * 多字典数据钩子函数，用于同时获取多个字典类型的数据
 * @param dictCodes 字典类型编码数组
 * @param onlyActive 是否只返回启用状态的字典项
 * @returns 字典数据对象
 */
export function useMultipleDictionaries(dictCodes: string[], onlyActive: boolean = true) {
  const dictionaryStore = useDictionaryStore()
  const dictionaries = ref<Record<string, DictItem[]>>({})
  const loading = ref(true)
  
  // 获取所有字典数据
  const getDictData = async () => {
    loading.value = true
    try {
      const params = onlyActive ? { status: 'active' } : undefined
      const promises = dictCodes.map(code => 
        dictionaryStore.fetchDictItemsByTypeCode(code, params)
          .then(data => ({ code, data }))
          .catch(error => {
            console.error(`获取字典数据[${code}]失败:`, error)
            return { code, data: [] }
          })
      )
      
      const results = await Promise.all(promises)
      const newDictionaries: Record<string, DictItem[]> = {}
      
      results.forEach(({ code, data }) => {
        newDictionaries[code] = data
      })
      
      dictionaries.value = newDictionaries
    } finally {
      loading.value = false
    }
  }
  
  // 组件挂载时获取所有字典数据
  onMounted(() => {
    getDictData()
  })
  
  /**
   * 获取指定字典类型的标签
   * @param dictCode 字典类型编码
   * @param value 字典值
   * @param defaultLabel 默认标签
   * @returns 字典标签
   */
  const getDictLabel = (dictCode: string, value: string, defaultLabel = ''): string => {
    const dictList = dictionaries.value[dictCode] || []
    const item = dictList.find(item => item.value === value)
    return item ? item.label : defaultLabel
  }
  
  /**
   * 获取指定字典类型的选项
   * @param dictCode 字典类型编码
   * @returns 格式化后的字典项数组
   */
  const getOptions = (dictCode: string) => {
    const dictList = dictionaries.value[dictCode] || []
    return dictList.map(item => ({
      label: item.label,
      value: item.value,
      disabled: item.status === 'disabled'
    }))
  }
  
  /**
   * 获取指定字典类型的标签数据
   * @param dictCode 字典类型编码
   * @param value 字典值
   * @returns 字典标签对象
   */
  const getTagData = (dictCode: string, value: string) => {
    const dictList = dictionaries.value[dictCode] || []
    const item = dictList.find(item => item.value === value)
    return item 
      ? { 
          label: item.label, 
          type: item.cssClass || '' 
        } 
      : { label: value, type: '' }
  }
  
  return {
    dictionaries,
    loading,
    getDictLabel,
    getOptions,
    getTagData,
    refresh: getDictData
  }
} 