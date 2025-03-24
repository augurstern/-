import { defineStore } from 'pinia'
import * as dictApi from '@/api/dictionary'
import type { DictItem, DictType, DictQueryParams } from '@/api/dictionary'

// 接口定义
interface DictState {
  // 字典类型列表
  types: DictType[];
  // 字典项缓存，键为类型编码，值为该类型下的字典项数组
  itemsCache: Record<string, {
    items: DictItem[];
    timestamp: number; // 缓存时间戳
  }>;
  // 加载状态
  loadingTypes: boolean;
  loadingItems: Record<string, boolean>;
  // 缓存过期时间（毫秒）
  cacheExpiration: number;
  // 本地缓存键
  localCacheKey: string;
}

export const useDictionaryStore = defineStore('dictionary', {
  state: (): DictState => ({
    types: [],
    itemsCache: {},
    loadingTypes: false,
    loadingItems: {},
    cacheExpiration: 30 * 60 * 1000, // 30分钟
    localCacheKey: 'app_dict_cache'
  }),

  getters: {
    // 获取字典类型选项
    dictTypeOptions: (state) => {
      return state.types.map(type => ({
        label: type.typeName,
        value: type.id,
        code: type.typeCode,
        disabled: type.status === 'disabled'
      }))
    },
    
    // 获取字典类型的Map，用于快速查找
    dictTypeMap: (state) => {
      const map: Record<string, DictType> = {}
      state.types.forEach(type => {
        map[type.id] = type
        map[type.typeCode] = type
      })
      return map
    }
  },

  actions: {
    /**
     * 初始化字典数据
     */
    async initDictionary() {
      // 从本地存储加载缓存
      this.loadCacheFromStorage()
      
      // 加载所有字典类型
      await this.fetchAllDictTypes()
    },
    
    /**
     * 从本地存储加载缓存
     */
    loadCacheFromStorage() {
      try {
        const cacheJson = localStorage.getItem(this.localCacheKey)
        if (cacheJson) {
          const cache = JSON.parse(cacheJson)
          if (cache && cache.itemsCache) {
            this.itemsCache = cache.itemsCache
            
            // 清理过期缓存
            this.cleanExpiredCache()
          }
        }
      } catch (error) {
        console.error('加载字典缓存失败:', error)
        // 缓存损坏，清空
        this.itemsCache = {}
        localStorage.removeItem(this.localCacheKey)
      }
    },
    
    /**
     * 保存缓存到本地存储
     */
    saveCacheToStorage() {
      try {
        const cacheData = {
          itemsCache: this.itemsCache,
          timestamp: Date.now()
        }
        localStorage.setItem(this.localCacheKey, JSON.stringify(cacheData))
      } catch (error) {
        console.error('保存字典缓存失败:', error)
      }
    },
    
    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
      const now = Date.now()
      const expiredKeys: string[] = []
      
      // 找出过期的键
      Object.keys(this.itemsCache).forEach(key => {
        const cache = this.itemsCache[key]
        if (now - cache.timestamp > this.cacheExpiration) {
          expiredKeys.push(key)
        }
      })
      
      // 删除过期项
      expiredKeys.forEach(key => {
        delete this.itemsCache[key]
      })
      
      // 如果有过期项，则更新存储
      if (expiredKeys.length > 0) {
        this.saveCacheToStorage()
      }
    },
    
    /**
     * 获取所有字典类型（不分页）
     * @param refresh 是否强制刷新
     */
    async fetchAllDictTypes(refresh = false) {
      if (this.types.length > 0 && !refresh) {
        return this.types
      }
      
      this.loadingTypes = true
      try {
        const data = await dictApi.getAllDictTypes()
        this.types = data
        return data
      } catch (error) {
        console.error('获取字典类型列表失败:', error)
        return []
      } finally {
        this.loadingTypes = false
      }
    },
    
    /**
     * 获取字典类型列表（分页）
     * @param params 查询参数
     */
    async fetchDictTypes(params: DictQueryParams) {
      this.loadingTypes = true
      try {
        const result = await dictApi.getDictTypeList(params)
        return result
      } catch (error) {
        console.error('获取字典类型列表失败:', error)
        return { items: [], total: 0 }
      } finally {
        this.loadingTypes = false
      }
    },
    
    /**
     * 通过字典类型编码获取字典项列表
     * @param typeCode 字典类型编码
     * @param params 查询参数
     * @param useCache 是否使用缓存
     */
    async fetchDictItemsByTypeCode(typeCode: string, params?: Record<string, any>, useCache = true) {
      // 清理过期缓存
      this.cleanExpiredCache()
      
      // 如果使用缓存且缓存存在且未过期
      if (useCache && this.itemsCache[typeCode] && this.itemsCache[typeCode].timestamp) {
        return this.itemsCache[typeCode].items
      }
      
      // 设置加载状态
      this.loadingItems[typeCode] = true
      
      try {
        const items = await dictApi.getDictItemsByTypeCode(typeCode, params)
        
        // 更新缓存
        this.itemsCache[typeCode] = {
          items,
          timestamp: Date.now()
        }
        
        // 保存到本地存储
        this.saveCacheToStorage()
        
        return items
      } catch (error) {
        console.error(`获取字典项列表[${typeCode}]失败:`, error)
        
        // 如果出错但缓存存在，返回缓存
        if (this.itemsCache[typeCode]) {
          return this.itemsCache[typeCode].items
        }
        
        return []
      } finally {
        this.loadingItems[typeCode] = false
      }
    },
    
    /**
     * 刷新特定字典类型的缓存
     * @param typeCode 字典类型编码
     */
    async refreshDictItems(typeCode: string) {
      // 从缓存中删除
      delete this.itemsCache[typeCode]
      
      // 更新本地存储
      this.saveCacheToStorage()
      
      // 重新加载
      return await this.fetchDictItemsByTypeCode(typeCode, undefined, false)
    },
    
    /**
     * 刷新所有字典缓存
     * 包括服务器端和本地缓存
     */
    async refreshAllDict() {
      try {
        // 调用服务器刷新缓存接口
        await dictApi.refreshDictCache()
        
        // 清空本地缓存
        this.itemsCache = {}
        localStorage.removeItem(this.localCacheKey)
        
        // 重新加载字典类型
        await this.fetchAllDictTypes(true)
        
        return true
      } catch (error) {
        console.error('刷新字典缓存失败:', error)
        return false
      }
    },
    
    /**
     * 获取字典标签文本
     * @param typeCode 字典类型编码
     * @param value 字典值
     * @param defaultLabel 默认标签
     */
    async getDictLabel(typeCode: string, value: string, defaultLabel = '') {
      // 清理过期缓存
      this.cleanExpiredCache()
      
      // 从缓存获取字典项
      let dictItems: DictItem[] = []
      
      if (this.itemsCache[typeCode]) {
        dictItems = this.itemsCache[typeCode].items
      } else {
        dictItems = await this.fetchDictItemsByTypeCode(typeCode)
      }
      
      // 查找匹配项
      const item = dictItems.find(item => item.value === value)
      return item ? item.label : defaultLabel
    },
    
    /**
     * 获取字典标签类型
     * @param typeCode 字典类型编码
     * @param value 字典值
     * @param defaultType 默认类型
     */
    async getDictTagType(typeCode: string, value: string, defaultType = '') {
      // 清理过期缓存
      this.cleanExpiredCache()
      
      // 从缓存获取字典项
      let dictItems: DictItem[] = []
      
      if (this.itemsCache[typeCode]) {
        dictItems = this.itemsCache[typeCode].items
      } else {
        dictItems = await this.fetchDictItemsByTypeCode(typeCode)
      }
      
      // 查找匹配项
      const item = dictItems.find(item => item.value === value)
      return item && item.cssClass ? item.cssClass : defaultType
    }
  }
}) 