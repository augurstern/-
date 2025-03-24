<template>
  <el-popover
    placement="bottom-end"
    :width="300"
    trigger="click"
    popper-class="notification-popover"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0">
        <el-button :icon="Bell" circle />
      </el-badge>
    </template>

    <div class="notification-center">
      <div class="notification-header">
        <h3>通知中心</h3>
        <el-button
          v-if="notifications.length > 0"
          type="primary"
          link
          @click="markAllAsRead"
        >
          全部标记为已读
        </el-button>
      </div>

      <div class="notification-list" v-loading="loading">
        <template v-if="notifications.length > 0">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <el-icon class="notification-icon">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
            <div class="notification-content">
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">
                {{ formatTime(notification.created_at) }}
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else description="暂无通知" />
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bell, Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Notification {
  id: number
  type: string
  message: string
  related_id?: string
  created_at: string
  read: boolean
}

const notifications = ref<Notification[]>([])
const loading = ref(false)

// 获取未读通知数量
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 获取通知列表
const fetchNotifications = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/notifications')
    if (!response.ok) {
      throw new Error('获取通知失败')
    }
    notifications.value = await response.json()
  } catch (error) {
    console.error('获取通知失败:', error)
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

// 标记通知为已读
const markAsRead = async (notificationId: number) => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
    if (!response.ok) {
      throw new Error('标记通知已读失败')
    }
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  } catch (error) {
    console.error('标记通知已读失败:', error)
    ElMessage.error('标记通知已读失败')
  }
}

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT'
    })
    if (!response.ok) {
      throw new Error('标记所有通知已读失败')
    }
    notifications.value.forEach(notification => {
      notification.read = true
    })
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('标记所有通知已读失败:', error)
    ElMessage.error('标记所有通知已读失败')
  }
}

// 处理通知点击事件
const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read) {
    await markAsRead(notification.id)
  }
  
  // 如果是付款提醒，跳转到相应的付款计划
  if (notification.type === 'payment_reminder' && notification.related_id) {
    // TODO: 实现跳转到付款计划详情的逻辑
  }
}

// 获取通知图标
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'payment_reminder':
      return Timer
    default:
      return Bell
  }
}

// 格式化时间
const formatTime = (time: string) => {
  return formatDistanceToNow(new Date(time), {
    addSuffix: true,
    locale: zhCN
  })
}

// 组件挂载时获取通知
onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notification-center {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
}

.notification-icon {
  margin-right: 12px;
  font-size: 20px;
  color: #409eff;
}

.notification-content {
  flex: 1;
}

.notification-message {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}
</style>