import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NotificationTypeSetting from '@/components/notification/NotificationTypeSetting.vue'
import { useNotificationStore } from '@/stores/notification'

// 模拟通知存储
vi.mock('@/stores/notification', () => ({
  useNotificationStore: vi.fn()
}))

describe('NotificationTypeSetting.vue', () => {
  let notificationStore: any

  beforeEach(() => {
    notificationStore = {
      notificationTypes: [
        { id: 'SYSTEM', name: '系统通知', enabled: true },
        { id: 'CONTRACT', name: '合同通知', enabled: true },
        { id: 'TASK', name: '任务通知', enabled: false }
      ],
      loading: false,
      saveNotificationSettings: vi.fn(),
      resetNotificationSettings: vi.fn()
    }

    ;(useNotificationStore as any).mockReturnValue(notificationStore)
  })

  it('正确渲染通知项目列表', () => {
    const wrapper = mount(NotificationTypeSetting)

    const notificationItems = wrapper.findAll('.notification-item')
    expect(notificationItems).toHaveLength(5)
    expect(notificationItems[0].text()).toContain('创建操作')
    expect(notificationItems[1].text()).toContain('更新操作')
  })

  it('切换通知启用状态', async () => {
    const wrapper = mount(NotificationTypeSetting)

    const toggleSwitch = wrapper.find('.el-switch')
    await toggleSwitch.trigger('change')

    expect(wrapper.emitted('update:enabled')).toBeTruthy()
    expect(wrapper.emitted('update:enabled')[0]).toEqual([false])
  })

  it('更新通知渠道', async () => {
    const wrapper = mount(NotificationTypeSetting)

    const channelGroup = wrapper.find('.el-checkbox-group')
    await channelGroup.trigger('change')

    expect(wrapper.emitted('update:channels')).toBeTruthy()
  })

  it('更新通知级别', async () => {
    const wrapper = mount(NotificationTypeSetting)

    const levelGroup = wrapper.find('.el-radio-group')
    await levelGroup.setValue('important')

    expect(wrapper.vm.level).toBe('important')
  })

  it('切换单个通知项目状态', async () => {
    const wrapper = mount(NotificationTypeSetting)

    const itemCheckbox = wrapper.find('.notification-item .el-checkbox')
    await itemCheckbox.trigger('change')

    const notificationItems = wrapper.vm.notificationItems
    expect(notificationItems[0].enabled).toBe(false)
  })

  it('更新单个通知项目渠道', async () => {
    const wrapper = mount(NotificationTypeSetting)

    const itemChannelGroup = wrapper.find('.notification-item-settings .el-checkbox-group')
    await itemChannelGroup.trigger('change')

    expect(wrapper.vm.notificationItems[0].channels).toBeDefined()
  })
})