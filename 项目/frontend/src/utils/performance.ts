import { debounce } from 'lodash-es'
import { useNotificationStore } from '@/stores/notification'

/**
 * 通知存储实例
 */
const notificationStore = useNotificationStore()

/**
 * 对搜索等高频操作实施防抖
 * @param keyword 搜索关键词
 */
export const debouncedSearch = debounce(async (keyword: string) => {
  await notificationStore.fetchNotifications({ keyword })
}, 300)

/**
 * API数据缓存映射
 */
const cacheMap = new Map<string, {data: any, timestamp: number}>()

/**
 * 缓存有效期（5分钟）
 */
const CACHE_TTL = 5 * 60 * 1000

/**
 * 带缓存的API数据获取函数
 * @param key 缓存键
 * @param fetchFn 数据获取函数
 * @returns 获取到的数据
 */
export const fetchWithCache = async <T>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
  const now = Date.now()
  const cached = cacheMap.get(key)
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  
  const data = await fetchFn()
  cacheMap.set(key, {data, timestamp: now})
  return data
}

/**
 * 清除指定键的缓存
 * @param key 缓存键，如果不提供则清除所有缓存
 */
export const clearCache = (key?: string) => {
  if (key) {
    cacheMap.delete(key)
  } else {
    cacheMap.clear()
  }
}

/**
 * 分批次渲染大量数据，避免UI阻塞
 * @param list 数据列表
 * @param batchSize 每批次渲染的数量
 * @param renderFn 渲染函数，接收当前批次数据
 */
export const batchRender = <T>(list: T[], batchSize = 20, renderFn: (batch: T[]) => void) => {
  const total = list.length
  let rendered = 0
  
  const renderBatch = () => {
    const batch = list.slice(rendered, rendered + batchSize)
    rendered += batch.length
    
    // 调用渲染函数处理当前批次
    renderFn(batch)
    
    if (rendered < total) {
      requestAnimationFrame(renderBatch)
    }
  }
  
  renderBatch()
}

/**
 * 虚拟滚动所需的计算尺寸函数
 * @param container 滚动容器元素
 * @param itemHeight 单个项目高度
 * @param total 总项目数
 * @param buffer 缓冲区项目数
 * @returns 计算结果，包含开始索引、结束索引和偏移量
 */
export const calculateVirtualScroll = (
  container: HTMLElement,
  itemHeight: number,
  total: number,
  buffer = 5
) => {
  const scrollTop = container.scrollTop
  const viewportHeight = container.clientHeight
  
  // 计算可见区域内的起始和结束索引
  let startIndex = Math.floor(scrollTop / itemHeight) - buffer
  startIndex = Math.max(0, startIndex)
  
  let endIndex = Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer
  endIndex = Math.min(total - 1, endIndex)
  
  // 计算偏移量，使项目正确定位
  const offsetY = startIndex * itemHeight
  
  return { startIndex, endIndex, offsetY }
}

/**
 * 延迟加载函数，用于分页数据的预加载
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 */
export const lazyLoad = (callback: () => void, delay = 300) => {
  let timer: number | null = null
  
  return () => {
    if (timer !== null) {
      clearTimeout(timer)
    }
    
    timer = window.setTimeout(() => {
      callback()
      timer = null
    }, delay)
  }
}

/**
 * 资源预加载函数，用于提前加载图片等资源
 * @param urls 资源URL数组
 * @returns Promise数组
 */
export const preloadResources = (urls: string[]) => {
  return urls.map(url => {
    if (url.match(/\.(jpeg|jpg|gif|png)$/)) {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
      })
    } else {
      return fetch(url, { method: 'HEAD' })
    }
  })
} 