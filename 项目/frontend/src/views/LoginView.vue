<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElCheckbox } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { login } from '../api/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20之间', trigger: 'blur' }
  ]
}

const formRef = ref<InstanceType<typeof ElForm> | null>(null)
const loading = ref(false)
const passwordVisible = ref(false)

// 从本地存储中恢复用户名
onMounted(() => {
  const savedUsername = localStorage.getItem('rememberedUsername')
  if (savedUsername) {
    loginForm.username = savedUsername
    loginForm.rememberMe = true
  }
})

// 处理登录
const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    // 表单验证
    await formRef.value.validate()
    
    loading.value = true
    
    try {
      // 直接使用API登录
      const response = await login({
        username: loginForm.username,
        password: loginForm.password
      })
      
      // 更新状态管理中的用户信息
      authStore.setAuth(response.token, response.user)
      
      // 记住用户名
      if (loginForm.rememberMe) {
        localStorage.setItem('rememberedUsername', loginForm.username)
      } else {
        localStorage.removeItem('rememberedUsername')
      }
      
      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      // 登录失败
      ElMessage.error('登录失败，请检查用户名和密码')
      console.error('登录错误:', error)
    }
  } catch (validationError) {
    // 表单验证失败
    ElMessage.warning('请正确填写表单信息')
  } finally {
    loading.value = false
  }
}

// 按回车键提交表单
const handleEnterKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">合同管理系统</h2>
      
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            :prefix-icon="User"
            data-test="username-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <div class="password-input-wrapper">
            <el-input
              v-model="loginForm.password"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="密码"
              :prefix-icon="Lock"
              data-test="password-input"
              :show-password="!passwordVisible"
              @keyup.enter="handleLogin"
            >
              <template #suffix>
                <el-icon 
                  class="password-icon" 
                  @click="passwordVisible = !passwordVisible"
                >
                  <component :is="passwordVisible ? 'View' : 'Hide'" />
                </el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>
        
        <div class="login-options">
          <el-checkbox v-model="loginForm.rememberMe">记住用户名</el-checkbox>
        </div>
        
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            data-test="login-button"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <p class="login-tips">
        提示: 默认用户名和密码都是 admin
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  background-image: linear-gradient(45deg, rgba(0,123,255,0.1) 0%, rgba(0,0,0,0.02) 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 6px 25px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-5px);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #409EFF;
  font-size: 28px;
  font-weight: 500;
}

.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  margin-top: 10px;
}

.login-tips {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-top: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
}

.password-icon {
  cursor: pointer;
  font-size: 16px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 30px 20px;
  }
}
</style> 