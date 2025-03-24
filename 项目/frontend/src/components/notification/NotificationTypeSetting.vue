<template>
  <div class="notification-type-setting">
    <el-form-item label="启用此类通知">
      <el-switch v-model="enabledValue" @change="updateEnabled" />
    </el-form-item>
    
    <template v-if="enabledValue">
      <el-form-item label="通知渠道">
        <el-checkbox-group v-model="channelsValue" @change="updateChannels">
          <el-checkbox-button label="site">站内通知</el-checkbox-button>
          <el-checkbox-button label="email">邮件通知</el-checkbox-button>
          <el-checkbox-button label="sms">短信通知</el-checkbox-button>
          <el-checkbox-button label="push">推送通知</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item label="通知级别">
        <el-radio-group v-model="level">
          <el-radio-button label="all">所有消息</el-radio-button>
          <el-radio-button label="important">重要消息</el-radio-button>
          <el-radio-button label="critical">紧急消息</el-radio-button>
        </el-radio-group>
        <div class="setting-description">设置哪些级别的消息可以通知您</div>
      </el-form-item>
      
      <el-divider content-position="left">通知项目设置</el-divider>
      
      <div class="notification-items">
        <div v-for="(item, index) in notificationItems" :key="index" class="notification-item">
          <el-form-item :label="item.title">
            <el-checkbox v-model="item.enabled">启用</el-checkbox>
            <div class="setting-description">{{ item.description }}</div>
          </el-form-item>
          
          <div v-if="item.enabled" class="notification-item-settings">
            <el-form-item label="通知渠道">
              <el-checkbox-group v-model="item.channels">
                <el-checkbox-button v-for="channel in channelsValue" :key="channel" :label="channel">
                  {{ getChannelText(channel) }}
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

// 组件属性
const props = defineProps({
  enabled: {
    type: Boolean,
    default: true
  },
  channels: {
    type: Array as () => string[],
    default: () => ['site', 'email']
  }
})

// 组件事件
const emit = defineEmits(['update:enabled', 'update:channels'])

// 本地状态
const enabledValue = ref(props.enabled)
const channelsValue = ref(props.channels)
const level = ref('all')

// 不同类型的通知项目
const notificationItems = ref([
  {
    title: '创建操作',
    description: '当新项目被创建时发送通知',
    enabled: true,
    channels: ['site', 'email']
  },
  {
    title: '更新操作',
    description: '当项目被更新时发送通知',
    enabled: true,
    channels: ['site']
  },
  {
    title: '到期提醒',
    description: '当项目即将到期时发送提醒',
    enabled: true,
    channels: ['site', 'email', 'sms']
  },
  {
    title: '评论和回复',
    description: '当有新的评论或回复时发送通知',
    enabled: true,
    channels: ['site', 'push']
  },
  {
    title: '分享和协作',
    description: '当项目被分享或添加协作者时发送通知',
    enabled: true,
    channels: ['site', 'email']
  }
])

// 监听prop变化
watch(() => props.enabled, (newVal) => {
  enabledValue.value = newVal
})

watch(() => props.channels, (newVal) => {
  channelsValue.value = newVal
})

// 更新值方法
const updateEnabled = (value: boolean) => {
  emit('update:enabled', value)
}

const updateChannels = (value: string[]) => {
  emit('update:channels', value)
}

// 获取渠道显示文本
const getChannelText = (channel: string) => {
  const channelMap: Record<string, string> = {
    'site': '站内通知',
    'email': '邮件通知',
    'sms': '短信通知',
    'push': '推送通知'
  }
  return channelMap[channel] || channel
}
</script>

<style scoped>
.notification-type-setting {
  padding: 10px 0;
}

.setting-description {
  margin-top: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.notification-items {
  margin-top: 15px;
}

.notification-item {
  padding: 15px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: var(--el-bg-color-page);
}

.notification-item-settings {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .notification-item {
    padding: 10px;
  }
  
  .el-checkbox-group .el-checkbox-button {
    margin-bottom: 10px;
  }
}
</style> 