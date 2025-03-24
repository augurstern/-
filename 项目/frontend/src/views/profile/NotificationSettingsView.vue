<template>
  <div class="notification-settings-container">
    <el-card class="settings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>通知设置</h2>
          <div class="header-actions">
            <el-button 
              type="primary" 
              :loading="loading" 
              @click="saveSettings"
            >
              保存设置
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="settings" label-position="top" ref="formRef">
        <!-- 通知渠道设置 -->
        <div class="settings-section">
          <h3 class="section-title">通知渠道设置</h3>
          <div class="section-content">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="站内通知">
                  <el-switch v-model="settings.siteEnabled" />
                  <div class="setting-description">在系统内接收通知</div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="邮件通知">
                  <el-switch v-model="settings.emailEnabled" />
                  <div class="setting-description">以邮件形式接收通知</div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="短信通知">
                  <el-switch v-model="settings.smsEnabled" />
                  <div class="setting-description">以短信形式接收通知</div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="推送通知">
                  <el-switch v-model="settings.pushEnabled" />
                  <div class="setting-description">接收移动设备推送通知</div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 免打扰时段设置 -->
        <div class="settings-section">
          <h3 class="section-title">免打扰设置</h3>
          <div class="section-content">
            <el-form-item label="开启勿扰模式">
              <el-switch v-model="settings.muteAll" />
              <div class="setting-description">开启后，将在设定的时间段内不接收任何通知</div>
            </el-form-item>

            <el-form-item v-if="settings.muteAll" label="免打扰时段">
              <el-time-picker
                v-model="muteTimeRange"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
                :disabled-hours="disabledHours"
                @change="updateMuteTimeRange"
              />
              <div class="setting-description">在此时间段内不接收任何通知</div>
            </el-form-item>
          </div>
        </div>

        <!-- 通知类型设置 -->
        <div class="settings-section">
          <h3 class="section-title">通知类型设置</h3>
          <el-tabs type="border-card">
            <el-tab-pane label="系统通知" name="system">
              <notification-type-setting
                v-model:enabled="settings.typeSettings.system.enabled"
                v-model:channels="settings.typeSettings.system.channels"
              />
            </el-tab-pane>
            <el-tab-pane label="合同通知" name="contract">
              <notification-type-setting
                v-model:enabled="settings.typeSettings.contract.enabled"
                v-model:channels="settings.typeSettings.contract.channels"
              />
            </el-tab-pane>
            <el-tab-pane label="任务通知" name="task">
              <notification-type-setting
                v-model:enabled="settings.typeSettings.task.enabled"
                v-model:channels="settings.typeSettings.task.channels"
              />
            </el-tab-pane>
            <el-tab-pane label="审批通知" name="approval">
              <notification-type-setting
                v-model:enabled="settings.typeSettings.approval.enabled"
                v-model:channels="settings.typeSettings.approval.channels"
              />
            </el-tab-pane>
            <el-tab-pane label="消息通知" name="message">
              <notification-type-setting
                v-model:enabled="settings.typeSettings.message.enabled"
                v-model:channels="settings.typeSettings.message.channels"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useNotificationStore } from '@/stores/notification'
import { NotificationType, NotificationChannel } from '@/api/notification'
import NotificationTypeSetting from '@/components/notification/NotificationTypeSetting.vue'

// 通知存储
const notificationStore = useNotificationStore()

// 状态
const loading = ref(false)
const formRef = ref()

// 免打扰时间段
const muteTimeRange = ref<[Date | null, Date | null]>([null, null])

// 声明TypeScript类型
interface TypeSetting {
  enabled: boolean;
  channels: NotificationChannel[];
}

interface NotificationTypeSettings {
  [key: string]: TypeSetting;
}

interface SettingsForm {
  siteEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  muteAll: boolean;
  muteStartTime: string;
  muteEndTime: string;
  typeSettings: NotificationTypeSettings;
}

// 通知设置表单数据
const settings = reactive<SettingsForm>({
  siteEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
  muteAll: false,
  muteStartTime: '22:00',
  muteEndTime: '07:00',
  typeSettings: {
    system: {
      enabled: true,
      channels: [NotificationChannel.SITE, NotificationChannel.EMAIL]
    },
    contract: {
      enabled: true,
      channels: [NotificationChannel.SITE, NotificationChannel.EMAIL]
    },
    task: {
      enabled: true,
      channels: [NotificationChannel.SITE, NotificationChannel.EMAIL]
    },
    approval: {
      enabled: true,
      channels: [NotificationChannel.SITE, NotificationChannel.EMAIL, NotificationChannel.SMS]
    },
    message: {
      enabled: true,
      channels: [NotificationChannel.SITE]
    }
  }
})

// 禁用的小时选择（为了防止设置无效的时间范围）
const disabledHours = () => {
  return []
}

// 更新免打扰时间范围
const updateMuteTimeRange = (range: [Date | null, Date | null]) => {
  if (range[0] && range[1]) {
    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    
    settings.muteStartTime = formatTime(range[0])
    settings.muteEndTime = formatTime(range[1])
  }
}

// 初始化时间范围
const initMuteTimeRange = () => {
  if (settings.muteStartTime && settings.muteEndTime) {
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date
    }
    
    muteTimeRange.value = [
      parseTime(settings.muteStartTime),
      parseTime(settings.muteEndTime)
    ]
  }
}

// 加载用户通知设置
const loadSettings = async () => {
  loading.value = true
  try {
    const userSettings = await notificationStore.fetchUserSettings()
    if (userSettings) {
      // 将用户设置合并到表单数据
      settings.siteEnabled = userSettings.siteEnabled
      settings.emailEnabled = userSettings.emailEnabled
      settings.smsEnabled = userSettings.smsEnabled
      settings.pushEnabled = userSettings.pushEnabled
      settings.muteAll = userSettings.muteAll
      
      if (userSettings.muteStartTime) {
        settings.muteStartTime = userSettings.muteStartTime
      }
      
      if (userSettings.muteEndTime) {
        settings.muteEndTime = userSettings.muteEndTime
      }
      
      // 合并通知类型设置
      if (userSettings.typeSettings) {
        const typeKeys = ['system', 'contract', 'task', 'approval', 'message']
        typeKeys.forEach(type => {
          if (
            type in userSettings.typeSettings && 
            type in settings.typeSettings && 
            userSettings.typeSettings[type]
          ) {
            settings.typeSettings[type].enabled = userSettings.typeSettings[type].enabled
            settings.typeSettings[type].channels = [...userSettings.typeSettings[type].channels]
          }
        })
      }
      
      // 初始化免打扰时间范围
      initMuteTimeRange()
    }
  } catch (error) {
    console.error('加载通知设置失败', error)
    ElMessage.error('加载通知设置失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 保存设置
const saveSettings = async () => {
  loading.value = true
  
  try {
    // 创建要保存的设置对象
    const settingsToSave = {
      siteEnabled: settings.siteEnabled,
      emailEnabled: settings.emailEnabled,
      smsEnabled: settings.smsEnabled,
      pushEnabled: settings.pushEnabled,
      muteAll: settings.muteAll,
      muteStartTime: settings.muteStartTime,
      muteEndTime: settings.muteEndTime,
      typeSettings: settings.typeSettings
    }
    
    // 调用存储方法保存设置
    await notificationStore.saveUserSettings(settingsToSave)
    
    ElMessage.success('通知设置已保存')
  } catch (error) {
    console.error('保存设置失败', error)
    ElMessage.error('保存设置失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听频道全局开关
watch(() => settings.siteEnabled, (enabled) => {
  if (!enabled) {
    // 如果禁用了站内通知，需要调整所有通知类型中的频道设置
    for (const type in settings.typeSettings) {
      const channels = settings.typeSettings[type].channels
      const index = channels.indexOf(NotificationChannel.SITE)
      if (index !== -1) {
        channels.splice(index, 1)
      }
    }
  }
})

watch(() => settings.emailEnabled, (enabled) => {
  if (!enabled) {
    // 如果禁用了邮件通知，需要调整所有通知类型中的频道设置
    for (const type in settings.typeSettings) {
      const channels = settings.typeSettings[type].channels
      const index = channels.indexOf(NotificationChannel.EMAIL)
      if (index !== -1) {
        channels.splice(index, 1)
      }
    }
  }
})

watch(() => settings.smsEnabled, (enabled) => {
  if (!enabled) {
    // 如果禁用了短信通知，需要调整所有通知类型中的频道设置
    for (const type in settings.typeSettings) {
      const channels = settings.typeSettings[type].channels
      const index = channels.indexOf(NotificationChannel.SMS)
      if (index !== -1) {
        channels.splice(index, 1)
      }
    }
  }
})

watch(() => settings.pushEnabled, (enabled) => {
  if (!enabled) {
    // 如果禁用了推送通知，需要调整所有通知类型中的频道设置
    for (const type in settings.typeSettings) {
      const channels = settings.typeSettings[type].channels
      const index = channels.indexOf(NotificationChannel.PUSH)
      if (index !== -1) {
        channels.splice(index, 1)
      }
    }
  }
})

// 生命周期钩子
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.notification-settings-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.settings-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.section-content {
  padding: 0 10px;
}

.setting-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
}

@media (max-width: 768px) {
  .notification-settings-container {
    padding: 10px;
  }
  
  .settings-section {
    margin-bottom: 20px;
  }
  
  .section-content {
    padding: 0;
  }
}
</style> 