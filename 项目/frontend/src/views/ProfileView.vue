<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Lock, 
  Message, 
  Iphone, 
  StarFilled, 
  Warning, 
  Bell,
  UserFilled
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const activeTab = ref('basic')
const loading = ref(false)
const avatarUrl = ref('')
const saveLoading = ref(false)
const passwordLoading = ref(false)

// 用户信息表单
const userForm = reactive({
  username: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  position: ''
})

// 密码修改表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 用户设置
const userSettings = reactive({
  theme: 'light',
  language: 'zh-CN',
  notifications: {
    email: true,
    browser: true,
    contractExpiry: true,
    approvalRequest: true,
    systemUpdates: false
  },
  defaultView: 'dashboard'
})

// 语言选项
const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English(US)', value: 'en-US' }
]

// 主题选项
const themeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'auto' }
]

// 默认视图选项
const viewOptions = [
  { label: '仪表盘', value: 'dashboard' },
  { label: '合同列表', value: 'contracts' },
  { label: '待审批合同', value: 'approvals' }
]

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    loading.value = true
    const user = await authStore.fetchCurrentUser()
    
    if (user) {
      userForm.username = user.username
      userForm.name = user.name || ''
      userForm.email = user.email || ''
      userForm.phone = user.phone || ''
      userForm.department = user.department || ''
      userForm.position = user.position || ''
      
      avatarUrl.value = user.avatar || ''
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 保存用户信息
const saveUserInfo = async () => {
  try {
    saveLoading.value = true
    
    await authStore.updateProfile({
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone,
      department: userForm.department,
      position: userForm.position
    })
    
    ElMessage.success('个人信息更新成功')
  } catch (error) {
    ElMessage.error('更新个人信息失败')
  } finally {
    saveLoading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  // 表单验证
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入当前密码')
    return
  }
  
  if (!passwordForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  try {
    passwordLoading.value = true
    
    await authStore.changePassword(
      passwordForm.oldPassword, 
      passwordForm.newPassword, 
      passwordForm.confirmPassword
    )
    
    // 清空表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 保存用户设置
const saveUserSettings = () => {
  localStorage.setItem('userSettings', JSON.stringify(userSettings))
  
  // 应用主题
  document.documentElement.setAttribute('data-theme', userSettings.theme)
  
  ElMessage.success('设置已保存')
}

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  avatarUrl.value = response.url
  ElMessage.success('头像上传成功')
}

// 头像上传之前的钩子
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  
  return true
}

// 加载保存的用户设置
const loadUserSettings = () => {
  const savedSettings = localStorage.getItem('userSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    Object.assign(userSettings, settings)
  }
}

onMounted(() => {
  fetchUserInfo()
  loadUserSettings()
})
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <div class="title-section">
        <h2>个人资料</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>个人资料</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <el-card class="profile-card">
      <el-tabs>
        <el-tab-pane label="基本信息">
          <el-form
            ref="profileForm"
            :model="userForm"
            :rules="rules"
            label-width="100px"
            label-position="right"
            class="profile-form"
          >
            <el-form-item label="头像">
              <el-avatar :size="80" :src="avatarUrl">
                <UserFilled />
              </el-avatar>
              <el-button type="primary" plain class="upload-btn">
                更换头像
              </el-button>
            </el-form-item>

            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userForm.username"
                placeholder="请输入用户名"
                disabled
              />
            </el-form-item>

            <el-form-item label="真实姓名" prop="name">
              <el-input
                v-model="userForm.name"
                placeholder="请输入真实姓名"
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="userForm.email"
                placeholder="请输入邮箱"
              />
            </el-form-item>

            <el-form-item label="手机号码" prop="phone">
              <el-input
                v-model="userForm.phone"
                placeholder="请输入手机号码"
              />
            </el-form-item>

            <el-form-item label="部门" prop="department">
              <el-input
                v-model="userForm.department"
                placeholder="请输入部门"
              />
            </el-form-item>

            <el-form-item label="职位" prop="position">
              <el-input
                v-model="userForm.position"
                placeholder="请输入职位"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveUserInfo" :loading="saveLoading">保存修改</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码">
          <el-form
            ref="passwordForm"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            class="password-form"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请确认新密码"
                show-password
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="passwordLoading">修改密码</el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-section h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-form,
.password-form {
  max-width: 600px;
  margin: 0 auto;
  padding-top: 20px;
}

.upload-btn {
  margin-left: 15px;
}

@media (max-width: 768px) {
  .profile-form,
  .password-form {
    max-width: 100%;
  }
}
</style> 