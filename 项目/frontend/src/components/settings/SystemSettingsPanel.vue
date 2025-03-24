<template>
  <div class="system-settings-panel" v-loading="loading">
    <el-form :model="systemSettings" label-width="120px" class="settings-form">
      <el-form-item label="系统名称">
        <el-input 
          v-model="systemSettings.systemName" 
          placeholder="输入系统名称" 
          data-test="system-name-input"
        />
      </el-form-item>
      
      <el-form-item label="公司名称">
        <el-input 
          v-model="systemSettings.companyName" 
          placeholder="输入公司名称" 
          data-test="company-name-input"
        />
      </el-form-item>
      
      <el-form-item label="系统Logo">
        <el-input v-model="systemSettings.logo" />
      </el-form-item>
      
      <el-form-item label="允许注册">
        <el-switch v-model="systemSettings.allowRegistration" />
      </el-form-item>
      
      <el-form-item label="默认语言">
        <el-select v-model="systemSettings.defaultLanguage" style="width: 100%">
          <el-option 
            v-for="item in languageOptions" 
            :key="item.value" 
            :label="item.label" 
            :value="item.value" 
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="界面主题">
        <el-select v-model="systemSettings.theme" style="width: 100%">
          <el-option
            v-for="item in themeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="日期格式">
        <el-input v-model="systemSettings.dateFormat" />
      </el-form-item>
      
      <el-form-item label="时间格式">
        <el-input v-model="systemSettings.timeFormat" />
      </el-form-item>
      
      <el-form-item>
        <el-button 
          type="primary" 
          @click="saveSystemSettings"
          :loading="isSubmitting" 
          data-test="save-settings-button"
        >
          保存设置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '../../stores/settings'

// 接收父组件传递的加载状态
const props = defineProps<{
  loading: boolean
}>()

const settingsStore = useSettingsStore()
const isSubmitting = ref(false)

// 系统设置数据
const systemSettings = computed(() => settingsStore.systemSettings)

// 语言选项
const languageOptions = [
  {
    value: 'zh-CN',
    label: '简体中文'
  },
  {
    value: 'en-US',
    label: 'English (US)'
  }
]

// 主题选项
const themeOptions = [
  {
    value: 'light',
    label: '明亮'
  },
  {
    value: 'dark',
    label: '暗黑'
  },
  {
    value: 'auto',
    label: '自动'
  }
]

// 保存系统设置
const saveSystemSettings = async () => {
  try {
    isSubmitting.value = true
    await settingsStore.saveSystemSettings(systemSettings.value)
    ElMessage.success('保存系统设置成功')
  } catch (error) {
    ElMessage.error('保存系统设置失败')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.system-settings-panel {
  padding: 20px;
}

.settings-form {
  max-width: 600px;
}
</style> 