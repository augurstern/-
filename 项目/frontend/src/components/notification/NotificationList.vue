<template>
  <div class="notification-list" v-loading="loading">
    <template v-if="notifications.length > 0">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification-item"
        :class="{
          'is-unread': notification.status === 'unread',
          [`is-${notification.level}`]: true
        }"
        @click="viewNotification(notification)"
      >
        <div class="notification-item-content">
          <div class="notification-header">
            <span class="notification-type">{{ getTypeLabel(notification.type) }}</span>
            <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
          </div>
          
          <div class="notification-title">
            <span>{{ notification.title }}</span>
          </div>
          
          <div class="notification-body">
            {{ notification.content }}
          </div>
          
          <div v-if="notification.sender" class="notification-sender">
            <el-avatar 
              :size="20" 
              :src="notification.sender.avatar" 
              :alt="notification.sender.name"
            >
              {{ getInitials(notification.sender.name) }}
            </el-avatar>
            <span>{{ notification.sender.name }}</span>
          </div>
        </div>
        
        <div class="notification-actions">
          <el-tooltip 
            content="标记为已读" 
            placement="top" 
            v-if="notification.status === 'unread'"
          >
            <el-button
              type="text"
              :icon="Check"
              @click.stop="markAsRead(notification.id)"
            />
          </el-tooltip>
          
          <el-tooltip content="删除" placement="top">
            <el-button
              type="text"
              :icon="Delete"
              @click.stop="deleteNotification(notification.id)"
            />
          </el-tooltip>
        </div>
      </div>
    </template>
    
    <div v-else-if="!loading" class="no-data">
      <el-empty description="暂无通知" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useNotificationStore } from '@/stores/notification'
import { NotificationType, NotificationItem } from '@/api/notification'

const props = defineProps({
  notifications: {
    type: Array as () => NotificationItem[],
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['read', 'view'])

const notificationStore = useNotificationStore()

// 获取通知类型标签
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    [NotificationType.SYSTEM]: '系统',
    [NotificationType.CONTRACT]: '合同',
    [NotificationType.TASK]: '任务',
    [NotificationType.APPROVAL]: '审批',
    [NotificationType.MESSAGE]: '消息'
  }
  
  return typeMap[type] || '通知'
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  
  // 超过7天显示具体日期
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // 如果是今年，只显示月日
  if (year === now.getFullYear()) {
    return `${month}月${day}日`
  }
  
  return `${year}年${month}月${day}日`
}

// 获取姓名首字母作为头像
const getInitials = (name: string) => {
  return name ? name.charAt(0) : '?'
}

// 标记为已读
const markAsRead = async (id: string) => {
  await notificationStore.markNotificationAsRead(id)
  emit('read', id)
}

// 删除通知
const deleteNotification = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除此通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里可以调用notificationStore中的删除方法
    // 目前API可能还没有实现
    console.log('删除通知', id)
  } catch (e) {
    // 用户取消操作
  }
}

// 查看通知
const viewNotification = (notification: NotificationItem) => {
  emit('view', notification)
}
</script>

<style scoped>
.notification-list {
  width: 100%;
  overflow-y: auto;
}

.notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.is-unread {
  background-color: #ecf5ff;
}

.notification-item.is-unread:hover {
  background-color: #e5f1ff;
}

.notification-item.is-important .notification-type {
  color: #e6a23c;
}

.notification-item.is-critical .notification-type {
  color: #f56c6c;
}

.notification-item-content {
  flex: 1;
  margin-right: 12px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-type {
  font-size: 12px;
  padding: 2px 8px;
  background-color: #f0f0f0;
  border-radius: 10px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.notification-item.is-unread .notification-title {
  font-weight: 600;
}

.notification-body {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.notification-sender {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.notification-sender .el-avatar {
  margin-right: 4px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.no-data {
  padding: 40px 0;
  text-align: center;
}
</style> 