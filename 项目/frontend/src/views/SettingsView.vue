<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '../stores/settings'
import SystemSettingsPanel from '../components/settings/SystemSettingsPanel.vue'
import SecuritySettingsPanel from '../components/settings/SecuritySettingsPanel.vue'
import BackupSettingsPanel from '../components/settings/BackupSettingsPanel.vue'
import LogsPanel from '../components/settings/LogsPanel.vue'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

// 状态变量
const loading = ref(false)
const activeTab = ref('system')

// 根据路由参数切换标签页
onMounted(() => {
  // 初始化设置数据
  loadSettingsData()
  
  // 从路由参数中读取激活的标签
  const tab = route.query.tab as string
  if (tab && ['system', 'security', 'backup', 'logs'].includes(tab)) {
    activeTab.value = tab
  }
})

// 监听标签变化，更新路由参数
watch(activeTab, (newTab) => {
  router.replace({ 
    path: route.path, 
    query: { ...route.query, tab: newTab } 
  })
})

// 加载所有设置数据
const loadSettingsData = async () => {
  loading.value = true
  
  try {
    // 并行请求所有设置
    await Promise.all([
      settingsStore.fetchSystemSettings(),
      settingsStore.fetchSecuritySettings(),
      settingsStore.fetchBackupSettings()
    ])
  } catch (error) {
    console.error('加载设置数据失败:', error)
    ElMessage.error('加载设置数据失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>系统设置</h2>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="系统设置" name="system">
          <system-settings-panel :loading="loading" />
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <security-settings-panel :loading="loading" />
        </el-tab-pane>
        
        <el-tab-pane label="备份管理" name="backup">
          <backup-settings-panel :loading="loading" />
        </el-tab-pane>
        
        <el-tab-pane label="系统日志" name="logs">
          <logs-panel :loading="loading" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 20px;
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
  color: #303133;
}

:deep(.el-tabs__content) {
  padding: 20px;
}
</style> 