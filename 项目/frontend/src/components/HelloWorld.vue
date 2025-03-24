<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const form = reactive({
  username: '',
  password: ''
})

const router = useRouter()
const loading = ref(false)

const handleLogin = () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  
  // 模拟登录请求
  setTimeout(() => {
    loading.value = false
    
    // 简单模拟登录逻辑，实际项目中应当调用API
    if (form.username === 'admin' && form.password === 'admin') {
      // 存储token
      localStorage.setItem('token', 'mock-token-12345')
      ElMessage.success('登录成功')
      
      // 登录成功后跳转到首页
      router.push('/')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  }, 1000)
}
</script>

<template>
  <div class="login-container">
    <h1>合同管理系统</h1>
    
    <el-form :model="form" class="login-form">
      <el-form-item>
        <el-input 
          v-model="form.username" 
          placeholder="用户名" 
          prefix-icon="el-icon-user"
        />
      </el-form-item>
      
      <el-form-item>
        <el-input 
          v-model="form.password" 
          type="password" 
          placeholder="密码" 
          prefix-icon="el-icon-lock"
          @keyup.enter="handleLogin"
        />
      </el-form-item>
      
      <el-form-item>
        <el-button 
          type="primary" 
          :loading="loading" 
          class="login-button" 
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form-item>
      
      <p class="login-tips">默认用户名：admin，密码：admin</p>
    </el-form>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-form {
  width: 300px;
  padding: 25px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-button {
  width: 100%;
}

.login-tips {
  font-size: 12px;
  color: #888;
  text-align: center;
  margin-top: 10px;
}
</style>
