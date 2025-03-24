<template>
  <div class="security-settings-panel" v-loading="loading">
    <el-form :model="securitySettings" label-width="160px" class="settings-form">
      <el-form-item label="密码最小长度">
        <el-input v-model="securitySettings.passwordMinLength" type="number" min="6" max="20" />
      </el-form-item>
      
      <el-form-item label="要求特殊字符">
        <el-switch v-model="securitySettings.passwordRequireSpecial" />
      </el-form-item>
      
      <el-form-item label="要求数字">
        <el-switch v-model="securitySettings.passwordRequireNumbers" />
      </el-form-item>
      
      <el-form-item label="要求大写字母">
        <el-switch v-model="securitySettings.passwordRequireUppercase" />
      </el-form-item>
      
      <el-form-item label="会话超时(分钟)">
        <el-input v-model="securitySettings.sessionTimeout" type="number" min="1" max="1440" />
      </el-form-item>
      
      <el-form-item label="允许登录尝试次数">
        <el-input v-model="securitySettings.allowedLoginAttempts" type="number" min="1" max="10" />
      </el-form-item>
      
      <el-form-item label="锁定持续时间(分钟)">
        <el-input v-model="securitySettings.lockoutDuration" type="number" min="1" max="60" />
      </el-form-item>
      
      <el-form-item label="双因素认证">
        <el-switch v-model="securitySettings.twoFactorAuth" />
      </el-form-item>
      
      <el-form-item label="IP限制">
        <el-switch v-model="securitySettings.ipRestriction" />
      </el-form-item>
      
      <el-form-item label="允许的IP地址" v-if="securitySettings.ipRestriction">
        <el-input 
          v-model="allowedIPsInput" 
          type="textarea" 
          rows="3"
          placeholder="每行输入一个IP地址或IP范围"
          @change="updateAllowedIPs"
        />
        <div class="form-help">每行输入一个IP地址，支持IP范围格式（例如：192.168.1.0/24）</div>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="saveSecuritySettings" :loading="isSubmitting">保存设置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '../../stores/settings'

// 接收父组件传递的加载状态
const props = defineProps<{
  loading: boolean
}>()

const settingsStore = useSettingsStore()
const isSubmitting = ref(false)

// 安全设置数据
const securitySettings = computed(() => settingsStore.securitySettings)

// 允许的IP地址
const allowedIPsInput = ref('')

// 初始化IP地址输入框
onMounted(() => {
  if (securitySettings.value.allowedIPs && securitySettings.value.allowedIPs.length > 0) {
    allowedIPsInput.value = securitySettings.value.allowedIPs.join('\n')
  }
})

// 更新允许的IP地址
const updateAllowedIPs = () => {
  // 从文本框分割每行，并过滤掉空行
  const ips = allowedIPsInput.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)
  
  securitySettings.value.allowedIPs = ips
}

// 保存安全设置
const saveSecuritySettings = async () => {
  try {
    isSubmitting.value = true
    
    // 确保IP限制设置正确
    if (securitySettings.value.ipRestriction) {
      updateAllowedIPs()
    }
    
    await settingsStore.saveSecuritySettings(securitySettings.value)
    ElMessage.success('保存安全设置成功')
  } catch (error) {
    ElMessage.error('保存安全设置失败')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.security-settings-panel {
  padding: 20px;
}

.settings-form {
  max-width: 600px;
}

.form-help {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style> 