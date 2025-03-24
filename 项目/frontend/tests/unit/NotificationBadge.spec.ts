import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NotificationBadge from '@/components/notification/NotificationBadge.vue'
import { useNotificationStore } from '@/stores/notification'

// 模拟通知存储
vi.mock('@/stores/notification', () => ({
  useNotificationStore: vi.fn()
}))

describe('NotificationBadge.vue', () => {
  let notificationStore: any

  beforeEach(() => {
    // 设置模拟通知存储的返回值
    notificationStore = {
      unreadCount: 5,
      hasUnread: true,
      hasNewNotifications: true,
      initialized: true,
      initNotifications: vi.fn(),
      markAsRead: vi.fn()
    }

    // 设置模拟的返回值
    ;(useNotificationStore as any).mockReturnValue(notificationStore)
  })

  it('渲染正确的未读消息数', async () => {
    const wrapper = mount(NotificationBadge)
    expect(wrapper.find('.el-badge').exists()).toBe(true)
    expect(wrapper.find('.el-badge').attributes('value')).toBe('5')
  })

  it('当未读消息数为0时隐藏徽章', async () => {
    notificationStore.unreadCount = 0
    notificationStore.hasUnread = false

    const wrapper = mount(NotificationBadge)
    expect(wrapper.find('.el-badge').attributes('hidden')).toBe('true')
  })

  it('点击按钮时切换通知面板', async () => {
    const wrapper = mount(NotificationBadge)
    const button = wrapper.find('.notification-button')
    
    expect(button.exists()).toBe(true)
    
    await button.trigger('click')
    expect(wrapper.vm.showPanel).toBe(true)
    
    await button.trigger('click')
    expect(wrapper.vm.showPanel).toBe(false)
  })

  it('使用dot模式时显示圆点', async () => {
    const wrapper = mount(NotificationBadge, {
      props: { isDot: true }
    })
    
    expect(wrapper.find('.el-badge').attributes('is-dot')).toBe('true')
  })

  it('在组件挂载时初始化通知数据', () => {
    mount(NotificationBadge)
    expect(notificationStore.initNotifications).toHaveBeenCalled()
  })

  it('传递自定义大小到按钮', () => {
    const wrapper = mount(NotificationBadge, {
      props: { size: 'large' }
    })
    
    expect(wrapper.find('.notification-button').attributes('size')).toBe('large')
  })
}) 