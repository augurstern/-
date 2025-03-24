import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NotificationPanel from '@/components/notification/NotificationPanel.vue'
import { useNotificationStore } from '@/stores/notification'

// 模拟通知存储
vi.mock('@/stores/notification', () => ({
  useNotificationStore: vi.fn()
}))

describe('NotificationPanel.vue', () => {
  let notificationStore: any

  beforeEach(() => {
    notificationStore = {
      notifications: [
        {
          id: '1',
          type: 'SYSTEM',
          level: 'info',
          status: 'unread',
          title: '系统通知',
          content: '测试内容',
          createTime: new Date().toISOString()
        }
      ],
      loading: false,
      loadNotifications: vi.fn(),
      markAllAsRead: vi.fn()
    }

    ;(useNotificationStore as any).mockReturnValue(notificationStore)
  })

  it('正确渲染通知面板', () => {
    const wrapper = mount(NotificationPanel, {
      props: {
        visible: true
      }
    })

    expect(wrapper.find('.notification-panel').exists()).toBe(true)
    expect(wrapper.find('.notification-header').exists()).toBe(true)
  })

  it('加载时显示加载状态', () => {
    notificationStore.loading = true

    const wrapper = mount(NotificationPanel, {
      props: {
        visible: true
      }
    })

    expect(wrapper.find('.loading-indicator').exists()).toBe(true)
  })

  it('点击关闭按钮时触发close事件', async () => {
    const wrapper = mount(NotificationPanel, {
      props: {
        visible: true
      }
    })

    await wrapper.find('.close-button').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('点击全部已读按钮时调用markAllAsRead', async () => {
    const wrapper = mount(NotificationPanel, {
      props: {
        visible: true
      }
    })

    await wrapper.find('.mark-all-read-button').trigger('click')
    expect(notificationStore.markAllAsRead).toHaveBeenCalled()
  })

  it('切换通知类型时更新过滤器', async () => {
    const wrapper = mount(NotificationPanel, {
      props: {
        visible: true
      }
    })

    const typeFilter = wrapper.find('.type-filter')
    await typeFilter.trigger('change')

    expect(notificationStore.loadNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(String)
      })
    )
  })

  it('正确处理通知点击事件', async () => {
    const wrapper = mount(NotificationPanel, {
      props: {
        visible: true
      }
    })

    await wrapper.find('.notification-item').trigger('click')
    expect(wrapper.emitted('view')).toBeTruthy()
  })
})