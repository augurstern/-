<template>
  <div class="notification-badge-container">
    <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" :is-dot="isDot">
      <el-tooltip :content="hasUnread ? `您有 ${unreadCount} 条未读通知` : '暂无未读通知'" placement="bottom">
        <el-button
          class="notification-button"
          :type="hasUnread ? 'danger' : 'default'"
          :size="size"
          :icon="icon"
          @click="toggleNotificationPanel"
        />
      </el-tooltip>
    </el-badge>
    
    <notification-panel 
      v-if="showPanel" 
      :visible="showPanel" 
      @close="closePanel"
      @read="handleRead"
      @view="handleView"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notification'
import NotificationPanel from './NotificationPanel.vue'

const props = defineProps({
  // 是否只显示点标记，而不显示具体数字
  isDot: {
    type: Boolean,
    default: false
  },
  // 按钮大小
  size: {
    type: String,
    default: 'default'
  },
  // 图标
  icon: {
    type: Object,
    default: () => Bell
  }
})

const notificationStore = useNotificationStore()
const showPanel = ref(false)

// 未读通知数量
const unreadCount = computed(() => notificationStore.unreadCount)

// 是否有未读通知
const hasUnread = computed(() => notificationStore.hasUnread)

// 是否有新通知（最近收到的）
const hasNewNotifications = computed(() => notificationStore.hasNewNotifications)

// 切换通知面板显示状态
const toggleNotificationPanel = () => {
  showPanel.value = !showPanel.value
}

// 关闭通知面板
const closePanel = () => {
  showPanel.value = false
}

// 处理通知已读
const handleRead = (id: string) => {
  // 处理通知已读事件
  console.log('已标记为已读:', id)
}

// 处理通知点击查看
const handleView = (notification: any) => {
  // 处理通知点击查看事件
  console.log('查看通知:', notification)
  
  // 关闭面板
  showPanel.value = false
}

// 初始化
onMounted(() => {
  // 初始化通知数据
  if (!notificationStore.initialized) {
    notificationStore.initNotifications()
  }
})
</script>

<style scoped>
.notification-badge-container {
  position: relative;
  display: inline-block;
}

.notification-button {
  padding: 6px;
  margin: 0;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

:deep(.el-badge__content.is-fixed) {
  animation: pulse 2s infinite ease-in-out;
}

:deep(.el-badge__content.is-fixed.is-dot) {
  animation: pulse 2s infinite ease-in-out;
}
</style> 