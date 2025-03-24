import api from './index'

// 通知类型枚举
export enum NotificationType {
  SYSTEM = 'system',
  CONTRACT = 'contract',
  TASK = 'task',
  APPROVAL = 'approval',
  MESSAGE = 'message'
}

// 通知渠道枚举
export enum NotificationChannel {
  SITE = 'site',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

// 通知级别枚举
export enum NotificationLevel {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  CRITICAL = 'critical'
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

// 通知项目接口
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  level: string;
  status: string;
  createTime: string;
  link?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  relatedData?: Record<string, any>;
}

// 通知类型设置
export interface NotificationTypeSetting {
  enabled: boolean;
  channels: string[];
}

// 通知设置接口
export interface NotificationSettings {
  siteEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  muteAll: boolean;
  muteStartTime?: string;
  muteEndTime?: string;
  typeSettings: Record<string, NotificationTypeSetting>;
}

// 通知查询参数
export interface NotificationQuery {
  page?: number;
  size?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

// API函数

/**
 * 获取用户通知列表
 */
export const getUserNotifications = (query: NotificationQuery) => {
  return api.get<{
    total: number;
    items: NotificationItem[];
  }>('/notifications', { params: query })
}

/**
 * 获取未读通知数
 */
export const getUnreadCount = () => {
  return api.get<{ count: number }>('/notifications/unread-count')
}

/**
 * 标记通知为已读
 */
export const markAsRead = (ids: string[]) => {
  return api.put('/notifications/read', { ids })
}

/**
 * 标记所有通知为已读
 */
export const markAllAsRead = () => {
  return api.put('/notifications/read-all')
}

/**
 * 删除通知
 */
export const deleteNotifications = (ids: string[]) => {
  return api.post('/notifications/delete', { ids })
}

/**
 * 归档通知
 */
export const archiveNotifications = (ids: string[]) => {
  return api.put('/notifications/archive', { ids })
}

/**
 * 获取用户通知设置
 */
export const getUserNotificationSettings = () => {
  return api.get<NotificationSettings>('/notifications/settings')
}

/**
 * 保存用户通知设置
 */
export const saveUserNotificationSettings = (settings: NotificationSettings) => {
  return api.put('/notifications/settings', settings)
}

/**
 * 获取模拟通知数据（用于开发环境）
 */
export const getMockNotifications = (query: NotificationQuery) => {
  const { page = 1, size = 10, type, status } = query
  const mockData: NotificationItem[] = Array.from({ length: 50 }, (_, i) => {
    const id = `notification-${i + 1}`
    const types = [
      NotificationType.SYSTEM,
      NotificationType.CONTRACT,
      NotificationType.TASK,
      NotificationType.APPROVAL,
      NotificationType.MESSAGE
    ]
    const levels = [
      NotificationLevel.NORMAL,
      NotificationLevel.IMPORTANT,
      NotificationLevel.CRITICAL
    ]
    const statuses = [
      NotificationStatus.UNREAD,
      NotificationStatus.READ,
      NotificationStatus.ARCHIVED
    ]
    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomLevel = levels[Math.floor(Math.random() * levels.length)]
    const randomStatus = i < 10 ? NotificationStatus.UNREAD : statuses[Math.floor(Math.random() * statuses.length)]
    
    let title, content
    switch (randomType) {
      case NotificationType.SYSTEM:
        title = `系统通知 #${i + 1}`
        content = `这是一条系统通知，请注意查看。时间：${new Date().toLocaleString()}`
        break
      case NotificationType.CONTRACT:
        title = `合同更新 #${i + 1}`
        content = `合同状态已更新，请查看最新变更。合同编号: C-2023-${1000 + i}`
        break
      case NotificationType.TASK:
        title = `任务提醒 #${i + 1}`
        content = `您有一个任务即将到期，请尽快处理。任务ID: T-${2000 + i}`
        break
      case NotificationType.APPROVAL:
        title = `审批请求 #${i + 1}`
        content = `有一个新的审批请求等待您处理。审批编号: A-${3000 + i}`
        break
      case NotificationType.MESSAGE:
        title = `新消息 #${i + 1}`
        content = `您收到了一条新消息，请查看详情。`
        break
      default:
        title = `通知 #${i + 1}`
        content = `这是一条通知内容示例`
    }

    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))

    return {
      id,
      type: randomType,
      title,
      content,
      level: randomLevel,
      status: randomStatus,
      createTime: date.toISOString(),
      link: randomType !== NotificationType.SYSTEM ? `/dashboard/${randomType}/${id}` : undefined,
      sender: i % 3 === 0 ? {
        id: `user-${i % 5 + 1}`,
        name: `用户${i % 5 + 1}`,
        avatar: `https://randomuser.me/api/portraits/men/${i % 10 + 1}.jpg`
      } : undefined
    }
  })

  // 根据查询参数筛选
  let filteredData = [...mockData]
  if (type) {
    filteredData = filteredData.filter(item => item.type === type)
  }
  if (status) {
    filteredData = filteredData.filter(item => item.status === status)
  }

  // 分页
  const startIndex = (page - 1) * size
  const endIndex = startIndex + size
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return {
    total: filteredData.length,
    items: paginatedData
  }
}

/**
 * 获取模拟未读通知数
 */
export const getMockUnreadCount = () => {
  return { count: 10 }
}

/**
 * 获取模拟通知设置
 */
export const getMockNotificationSettings = (): NotificationSettings => {
  return {
    siteEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    muteAll: false,
    muteStartTime: '22:00',
    muteEndTime: '08:00',
    typeSettings: {
      [NotificationType.SYSTEM]: {
        enabled: true,
        channels: [NotificationChannel.SITE, NotificationChannel.EMAIL]
      },
      [NotificationType.CONTRACT]: {
        enabled: true,
        channels: [NotificationChannel.SITE, NotificationChannel.EMAIL, NotificationChannel.PUSH]
      },
      [NotificationType.TASK]: {
        enabled: true,
        channels: [NotificationChannel.SITE, NotificationChannel.PUSH]
      },
      [NotificationType.APPROVAL]: {
        enabled: true,
        channels: [NotificationChannel.SITE, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH]
      },
      [NotificationType.MESSAGE]: {
        enabled: true,
        channels: [NotificationChannel.SITE, NotificationChannel.PUSH]
      }
    }
  }
} 