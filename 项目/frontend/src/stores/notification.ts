import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  NotificationItem, 
  NotificationSettings, 
  NotificationQuery,
  NotificationStatus,
  NotificationType,
  getUserNotifications, 
  getUnreadCount, 
  markAsRead,
  markAllAsRead, 
  getUserNotificationSettings,
  saveUserNotificationSettings,
  getMockNotifications,
  getMockUnreadCount,
  getMockNotificationSettings
} from '../api/notification'
import { ElMessage } from 'element-plus'

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const loading = ref(false)
  const error = ref('')
  const notifications = ref<NotificationItem[]>([])
  const totalCount = ref(0)
  const unreadCount = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const initialized = ref(false)
  const settings = ref<NotificationSettings | null>(null)
  const settingsLoading = ref(false)
  const showNotificationPanel = ref(false)

  // 计算属性
  const hasUnread = computed(() => unreadCount.value > 0)
  
  // 是否有新通知
  const hasNewNotifications = computed(() => {
    const lastCheckTime = localStorage.getItem('lastNotificationCheckTime')
    if (!lastCheckTime) return false
    
    const lastCheck = new Date(lastCheckTime).getTime()
    return notifications.value.some(notification => {
      const notificationTime = new Date(notification.createTime).getTime()
      return notificationTime > lastCheck && notification.status === NotificationStatus.UNREAD
    })
  })

  // 获取通知列表
  const fetchNotifications = async (query: NotificationQuery = {}) => {
    try {
      loading.value = true
      error.value = ''
      
      // 合并分页参数
      const params = {
        page: page.value,
        size: pageSize.value,
        ...query
      }
      
      // 根据环境决定使用真实API还是模拟数据
      let response
      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
        response = getMockNotifications(params)
      } else {
        response = await getUserNotifications(params)
      }
      
      notifications.value = response.items
      totalCount.value = response.total
      
      // 更新分页
      if (query.page) {
        page.value = query.page
      }
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取通知失败'
      console.error('获取通知失败', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    try {
      // 根据环境决定使用真实API还是模拟数据
      let response
      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
        response = getMockUnreadCount()
      } else {
        response = await getUnreadCount()
      }
      
      unreadCount.value = response.count
      return response.count
    } catch (err) {
      console.error('获取未读通知数量失败', err)
      return 0
    }
  }

  // 初始化通知数据
  const initNotifications = async () => {
    if (initialized.value) return
    
    await fetchNotifications()
    await fetchUnreadCount()
    
    // 记录检查时间
    localStorage.setItem('lastNotificationCheckTime', new Date().toISOString())
    initialized.value = true
  }

  // 刷新通知数据
  const refreshNotifications = async () => {
    await fetchNotifications({ page: 1 })
    await fetchUnreadCount()
    
    // 更新检查时间
    localStorage.setItem('lastNotificationCheckTime', new Date().toISOString())
  }

  // 标记通知为已读
  const markNotificationAsRead = async (id: string) => {
    try {
      await markAsRead([id])
      
      // 更新本地状态
      const notification = notifications.value.find(n => n.id === id)
      if (notification && notification.status === NotificationStatus.UNREAD) {
        notification.status = NotificationStatus.READ
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      
      return true
    } catch (err) {
      console.error('标记通知已读失败', err)
      return false
    }
  }

  // 标记所有通知为已读
  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead()
      
      // 更新本地状态
      notifications.value.forEach(notification => {
        if (notification.status === NotificationStatus.UNREAD) {
          notification.status = NotificationStatus.READ
        }
      })
      unreadCount.value = 0
      
      return true
    } catch (err) {
      console.error('标记所有通知已读失败', err)
      return false
    }
  }

  // 切换通知面板显示状态
  const toggleNotificationPanel = () => {
    showNotificationPanel.value = !showNotificationPanel.value
    
    // 打开面板时刷新通知
    if (showNotificationPanel.value) {
      refreshNotifications()
    }
  }

  // 获取用户通知设置
  const fetchUserSettings = async () => {
    try {
      loading.value = true
      
      // 根据环境决定使用真实API还是模拟数据
      let response
      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
        response = getMockNotificationSettings()
      } else {
        response = await getUserNotificationSettings()
      }
      
      settings.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取通知设置失败'
      console.error('获取通知设置失败', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 保存用户通知设置
  const saveUserSettings = async (newSettings: NotificationSettings) => {
    try {
      loading.value = true
      error.value = ''
      
      await saveUserNotificationSettings(newSettings)
      settings.value = newSettings
      
      ElMessage.success('通知设置已保存')
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存通知设置失败'
      console.error('保存通知设置失败', err)
      ElMessage.error('保存通知设置失败')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    loading,
    error,
    notifications,
    totalCount,
    unreadCount,
    page,
    pageSize,
    initialized,
    settings,
    settingsLoading,
    showNotificationPanel,
    
    // 计算属性
    hasUnread,
    hasNewNotifications,
    
    // 方法
    fetchNotifications,
    fetchUnreadCount,
    initNotifications,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleNotificationPanel,
    fetchUserSettings,
    saveUserSettings
  }
}) 