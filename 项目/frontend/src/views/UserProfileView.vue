<template>
  <div class="profile-container">
    <el-card class="profile-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
          <div class="header-actions">
            <el-button v-if="!isEditing" type="primary" @click="startEditing">编辑资料</el-button>
            <template v-else>
              <el-button type="primary" @click="saveProfile">保存</el-button>
              <el-button @click="cancelEditing">取消</el-button>
            </template>
          </div>
        </div>
      </template>
      
      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="100" :src="userData.avatar">
            {{ userData.name ? userData.name.charAt(0).toUpperCase() : 'U' }}
          </el-avatar>
          <el-upload
            v-if="isEditing"
            class="avatar-uploader"
            action="/api/user/avatar"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :headers="uploadHeaders"
          >
            <el-button type="primary" size="small" plain class="mt-2">更换头像</el-button>
          </el-upload>
        </div>
        
        <!-- 个人信息表单 -->
        <div class="info-section">
          <el-form 
            :model="userData" 
            label-position="top" 
            :disabled="!isEditing"
          >
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="用户名">
                  <el-input v-model="userData.username" placeholder="用户名" :disabled="true" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="姓名">
                  <el-input v-model="userData.name" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="电子邮箱">
                  <el-input v-model="userData.email" placeholder="请输入电子邮箱" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="手机号码">
                  <el-input v-model="userData.phone" placeholder="请输入手机号码" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="部门">
                  <el-select v-model="userData.department" placeholder="请选择部门" style="width: 100%">
                    <el-option label="管理部" value="管理部" />
                    <el-option label="财务部" value="财务部" />
                    <el-option label="法务部" value="法务部" />
                    <el-option label="技术部" value="技术部" />
                    <el-option label="销售部" value="销售部" />
                    <el-option label="人力资源部" value="人力资源部" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="职位">
                  <el-input v-model="userData.position" placeholder="请输入职位" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="个人简介">
              <el-input 
                v-model="userData.bio" 
                type="textarea" 
                :rows="4" 
                placeholder="请输入个人简介"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <!-- 安全设置部分 -->
      <div class="security-section">
        <el-divider content-position="left">安全设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="security-item">
              <div class="security-info">
                <h4>密码</h4>
                <p>上次更新: {{ userData.passwordLastChanged || '从未修改' }}</p>
              </div>
              <el-button type="primary" plain @click="showPasswordDialog = true">修改密码</el-button>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 登录信息 -->
      <div class="login-info">
        <el-divider content-position="left">登录信息</el-divider>
        <el-row>
          <el-col :span="24">
            <p class="info-item">
              <span class="info-label">最近登录时间:</span>
              <span>{{ userData.lastLoginTime || '暂无记录' }}</span>
            </p>
            <p class="info-item">
              <span class="info-label">最近登录IP:</span>
              <span>{{ userData.lastLoginIp || '暂无记录' }}</span>
            </p>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="500px"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
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
            placeholder="请再次输入新密码" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="changePassword" :loading="passwordLoading">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

// 用户接口定义
interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  bio?: string;
  role?: string;
  passwordLastChanged?: string;
  lastLoginTime?: string;
  lastLoginIp?: string;
}

const authStore = useAuthStore()

// 页面状态
const loading = ref(false)
const isEditing = ref(false)
const showPasswordDialog = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref()

// 用户数据
const userData = reactive<User>({
  id: '',
  username: '',
  name: '',
  email: '',
  phone: '',
  avatar: '',
  department: '',
  position: '',
  bio: '',
  role: '',
  passwordLastChanged: '',
  lastLoginTime: '',
  lastLoginIp: ''
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 文件上传配置
const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

// 获取用户资料
const fetchUserProfile = async () => {
  loading.value = true
  try {
    // 实际环境中应该调用API获取用户资料
    // const { data } = await userApi.getProfile()
    
    // 使用模拟数据
    setTimeout(() => {
      // 确保类型安全
      const userInfo = authStore.user || {} as User
      
      // 创建临时对象，不包含类型错误的属性
      const tempUserData = {
        id: userInfo.id || '1',
        username: userInfo.username || 'admin',
        name: userInfo.name || '管理员',
        email: userInfo.email || 'admin@example.com',
        phone: userInfo.phone || '13800138000',
        avatar: userInfo.avatar || '',
        department: userInfo.department || '管理部',
        position: userInfo.position || '系统管理员',
        role: userInfo.role || 'admin',
        // 新增自定义属性
        bio: '负责系统管理和维护工作', // 不从userInfo获取
        passwordLastChanged: '2023-05-10 15:30:22',
        lastLoginTime: userInfo.lastLoginTime || '2023-08-21 09:45:13',
        lastLoginIp: '192.168.1.100'
      }
      
      // 安全地复制属性
      Object.assign(userData, tempUserData)
      loading.value = false
    }, 600)
  } catch (error) {
    ElMessage.error('获取用户资料失败')
    loading.value = false
  }
}

// 进入编辑模式
const startEditing = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false
  fetchUserProfile() // 重新获取数据，放弃修改
}

// 保存用户资料
const saveProfile = async () => {
  loading.value = true
  try {
    // 实际环境中应该调用API保存用户资料
    // await userApi.updateProfile(userData)
    
    // 使用模拟数据
    setTimeout(() => {
      ElMessage.success('个人资料已更新')
      isEditing.value = false
      loading.value = false
    }, 600)
  } catch (error) {
    ElMessage.error('保存个人资料失败')
    loading.value = false
  }
}

// 处理头像上传成功
const handleAvatarSuccess = (response: any) => {
  if (response.success) {
    userData.avatar = response.data.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response.message || '头像上传失败')
  }
}

// 修改密码
const changePassword = async () => {
  passwordLoading.value = true
  try {
    // 先验证表单
    await passwordFormRef.value.validate()
    
    // 实际环境中应该调用API修改密码
    // await userApi.changePassword(passwordForm)
    
    // 使用模拟数据
    setTimeout(() => {
      ElMessage.success('密码修改成功')
      showPasswordDialog.value = false
      // 清空表单
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      passwordLoading.value = false
    }, 600)
  } catch (error) {
    passwordLoading.value = false
    // 表单验证失败不需要提示
    if (error !== 'validateError') {
      ElMessage.error('密码修改失败')
    }
  }
}

// 页面加载时获取用户资料
onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.profile-content {
  display: flex;
  margin-bottom: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40px;
}

.info-section {
  flex: 1;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.security-item:last-child {
  border-bottom: none;
}

.security-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.security-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.login-info {
  margin-top: 24px;
}

.info-item {
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.info-label {
  color: #909399;
  margin-right: 8px;
}

.mt-2 {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .avatar-section {
    margin-right: 0;
    margin-bottom: 24px;
  }
}
</style> 