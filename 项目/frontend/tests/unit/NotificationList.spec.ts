import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NotificationList from '@/components/notification/NotificationList.vue'
import { ElMessageBox, ElEmpty, ElAvatar, ElButton } from 'element-plus'
import { Check, Delete } from '@element-plus/icons-vue'

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

describe('NotificationList.vue', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'SYSTEM',
      level: 'info',
      status: 'unread',
      title: '系统通知',
      content: '测试内容',
      createTime: new Date().toISOString(),
      sender: {
        name: '系统管理员',
        avatar: ''
      }
    },
    {
      id: '2',
      type: 'CONTRACT',
      level: 'warning',
      status: 'read',
      title: '合同到期提醒',
      content: '合同即将到期',
      createTime: new Date().toISOString(),
      sender: null
    }
  ]

  it('正确渲染通知列表', () => {
    const wrapper = mount(NotificationList, {
      props: {
        notifications: mockNotifications,
        loading: false
      },
      global: {
        components: {
          ElEmpty,
          ElAvatar,
          ElButton
        }
      }
    })

    expect(wrapper.findAll('.notification-item')).toHaveLength(2)
    expect(wrapper.find('.is-unread')).exists()
    expect(wrapper.find('.notification-type').text()).toBe('系统')
  })

  it('显示空状态提示', () => {
    const wrapper = mount(NotificationList, {
      props: {
        notifications: [],
        loading: false
      },
      global: {
        components: { ElEmpty }
      }
    })

    expect(wrapper.findComponent(ElEmpty).exists()).toBe(true)
  })

  it('正确处理通知已读事件', async () => {
    const wrapper = mount(NotificationList, {
      props: {
        notifications: mockNotifications,
        loading: false
      },
      global: {
        components: {
          ElButton,
          ElAvatar
        }
      }
    })

    const readButton = wrapper.find('.notification-actions .el-button')
    await readButton.trigger('click')

    expect(wrapper.emitted('read')).toBeTruthy()
    expect(wrapper.emitted('read')[0]).toEqual(['1'])
  })

  it('正确处理通知删除确认', async () => {
    vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce(true)

    const wrapper = mount(NotificationList, {
      props: {
        notifications: mockNotifications,
        loading: false
      },
      global: {
        components: {
          ElButton,
          ElAvatar
        }
      }
    })

    const deleteButtons = wrapper.findAll('.notification-actions .el-button')
    await deleteButtons[1].trigger('click')

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '确定要删除此通知吗？',
      '提示',
      expect.any(Object)
    )
  })

  it('正确格式化时间显示', () => {
    const wrapper = mount(NotificationList, {
      props: {
        notifications: [{
          ...mockNotifications[0],
          createTime: new Date(Date.now() - 30 * 1000).toISOString() // 30秒前
        }],
        loading: false
      },
      global: {
        components: {
          ElButton,
          ElAvatar
        }
      }
    })

    expect(wrapper.find('.notification-time').text()).toBe('刚刚')
  })
})