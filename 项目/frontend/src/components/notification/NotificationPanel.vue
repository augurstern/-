<template>
  <div class="notification-panel-wrapper" v-if="visible">
    <div class="notification-panel-overlay" @click="close"></div>
    <div class="notification-panel">
      <div class="notification-panel-header">
        <h3>通知中心</h3>
        <div class="notification-panel-actions">
          <el-tooltip content="全部标为已读" placement="bottom">
            <el-button
              type="text"
              :icon="Check"
              :disabled="!hasUnread"
              @click="markAllAsRead"
            />
          </el-tooltip>
          <el-tooltip content="设置" placement="bottom">
            <el-button
              type="text"
              :icon="Setting"
              @click="goToSettings"
            />
          </el-tooltip>
          <el-tooltip content="关闭" placement="bottom">
            <el-button
              type="text"
              :icon="Close"
              @click="close"
            />
          </el-tooltip>
        </div>
      </div>
      
      <div class="notification-panel-filter">
        <el-radio-group v-model="activeStatus" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="unread">未读</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="activeType" placeholder="类型" size="small" clearable>
          <el-option label="全部类型" value="" />
          <el-option v-for="type in types" :key="type.value" :label="type.label" :value="type.value" />
        </el-select>
      </div>
      
      <div class="notification-panel-content" v-loading="loading">
        <notification-list
          :notifications="filteredNotifications"
          :loading="loading"
          @read="markAsRead"
          @view="handleView"
        />
        
        <div v-if="!loading && filteredNotifications.length === 0" class="notification-empty">
          <el-empty description="暂无通知" />
        </div>
        
        <div class="notification-pagination" v-if="totalCount > pageSize">
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="totalCount"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Check, Setting, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { NotificationStatus, NotificationType } from '@/api/notification'
import NotificationList from './NotificationList.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'read', 'view'])

const router = useRouter()
const notificationStore = useNotificationStore()

// 状态变量
const activeStatus = ref('all')
const activeType = ref('')

// 从store获取数据
const loading = computed(() => notificationStore.loading)
const notifications = computed(() => notificationStore.notifications)
const totalCount = computed(() => notificationStore.totalCount)
const page = computed(() => notificationStore.page)
const pageSize = computed(() => notificationStore.pageSize)
const hasUnread = computed(() => notificationStore.hasUnread)

// 通知类型选项
const types = [
  { label: '系统通知', value: NotificationType.SYSTEM },
  { label: '合同相关', value: NotificationType.CONTRACT },
  { label: '任务提醒', value: NotificationType.TASK },
  { label: '审批事项', value: NotificationType.APPROVAL },
  { label: '消息通知', value: NotificationType.MESSAGE }
]

// 过滤后的通知
const filteredNotifications = computed(() => {
  return notifications.value
})

// 关闭面板
const close = () => {
  emit('close')
}

// 标记单个通知为已读
const markAsRead = async (id: string) => {
  await notificationStore.markNotificationAsRead(id)
  emit('read', id)
}

// 标记所有通知为已读
const markAllAsRead = async () => {
  await notificationStore.markAllNotificationsAsRead()
}

// 处理通知点击查看
const handleView = (notification: any) => {
  // 如果是未读，标记为已读
  if (notification.status === NotificationStatus.UNREAD) {
    markAsRead(notification.id)
  }
  
  emit('view', notification)
  
  // 如果有链接，导航到对应页面
  if (notification.link) {
    close()
    router.push(notification.link)
  }
}

// 处理页码变化
const handlePageChange = (newPage: number) => {
  fetchNotifications({ page: newPage })
}

// 获取通知列表
const fetchNotifications = (query = {}) => {
  const params: any = { ...query }
  
  // 添加筛选条件
  if (activeStatus.value === 'unread') {
    params.status = NotificationStatus.UNREAD
  }
  
  if (activeType.value) {
    params.type = activeType.value
  }
  
  return notificationStore.fetchNotifications(params)
}

// 前往通知设置页面
const goToSettings = () => {
  close()
  router.push('/profile/notification-settings')
}

// 监听过滤条件变化，重新获取数据
watch([activeStatus, activeType], () => {
  fetchNotifications({ page: 1 })
})

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchNotifications()
  }
})

// 初始化
onMounted(() => {
  if (props.visible) {
    fetchNotifications()
  }
})
</script>

<style scoped>
.notification-panel-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.notification-panel-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.notification-panel {
  position: relative;
  width: 400px;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.notification-panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.notification-panel-actions {
  display: flex;
  gap: 8px;
}

.notification-panel-filter {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.notification-empty {
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notification-pagination {
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}
</style> 