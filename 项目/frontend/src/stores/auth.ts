import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import router from '../router'
import * as authApi from '../api/auth'
import type { LoginCredentials, User } from '../api/auth'

// 模拟API基础URL
const API_BASE_URL = '/api'

export interface AuthState {
  token: string | null
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

// 使用选项API方式定义store
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    let user = null
    
    try {
      if (userStr) {
        user = JSON.parse(userStr)
      }
    } catch (e) {
      // 处理解析错误
      localStorage.removeItem('user')
    }
    
    return {
      token,
      user,
      isLoggedIn: !!token,
      loading: false,
      error: null
    }
  },
  
  getters: {
    isAuthenticated: (state) => state.isLoggedIn && !!state.token,
    userRole: (state) => state.user?.role || 'guest',
    userName: (state) => state.user?.name || state.user?.username || '用户',
    permissions: (state) => state.user?.permissions || []
  },
  
  actions: {
    setLoading(status: boolean) {
      this.loading = status
    },
    
    setError(error: string | null) {
      this.error = error
    },
    
    setAuth(token: string, user: User) {
      this.token = token
      this.user = user
      this.isLoggedIn = true
      
      // 保存到本地存储
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    
    clearAuth() {
      this.token = null
      this.user = null
      this.isLoggedIn = false
      
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    async login(credentials: LoginCredentials) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const { token, user } = await authApi.login(credentials)
        this.setAuth(token, user)
        
        ElMessage.success(`欢迎回来，${user.name || user.username}`)
        
        // 跳转到仪表盘或指定的路由
        const redirectPath = router.currentRoute.value.query.redirect as string || '/dashboard'
        router.push(redirectPath)
        
        return true
      } catch (error: any) {
        this.setError(error?.message || '登录失败，请检查用户名和密码')
        ElMessage.error(this.error || '登录失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    async logout() {
      this.setLoading(true)
      
      try {
        await authApi.logout()
        this.clearAuth()
        
        // 跳转到登录页
        router.push('/login')
        ElMessage.success('已成功退出登录')
      } catch (error) {
        console.error('登出错误:', error)
      } finally {
        this.setLoading(false)
      }
    },
    
    async fetchCurrentUser() {
      if (!this.token) return false
      
      this.setLoading(true)
      
      try {
        const user = await authApi.getCurrentUser()
        this.user = user
        return true
      } catch (error: any) {
        this.setError(error?.message || '获取用户信息失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    async updateProfile(userData: Partial<User>) {
      if (!this.token) return false
      
      this.setLoading(true)
      
      try {
        const updatedUser = await authApi.updateUserProfile(userData)
        this.user = updatedUser
        localStorage.setItem('user', JSON.stringify(updatedUser))
        ElMessage.success('个人信息已更新')
        return true
      } catch (error: any) {
        this.setError(error?.message || '更新个人信息失败')
        ElMessage.error(this.error || '更新失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    async changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
      if (!this.token) return false
      
      // 验证新密码
      if (newPassword !== confirmPassword) {
        this.setError('新密码与确认密码不匹配')
        ElMessage.error(this.error)
        return false
      }
      
      this.setLoading(true)
      
      try {
        await authApi.changePassword({ oldPassword, newPassword, confirmPassword })
        ElMessage.success('密码已成功修改，请重新登录')
        
        // 退出登录
        this.logout()
        return true
      } catch (error: any) {
        this.setError(error?.message || '密码修改失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    async uploadAvatar(file: File) {
      if (!this.token || !this.user) return false
      
      this.setLoading(true)
      
      try {
        const { url } = await authApi.uploadAvatar(file)
        
        // 更新用户头像
        if (this.user) {
          this.user.avatar = url
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        
        ElMessage.success('头像已更新')
        return true
      } catch (error: any) {
        this.setError(error?.message || '上传头像失败')
        ElMessage.error(this.error || '上传失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    async initAuth() {
      const token = localStorage.getItem('token')
      if (!token) return false
      
      this.setLoading(true)
      
      try {
        // 验证token有效性
        const isValid = await authApi.validateToken(token)
        
        if (!isValid) {
          // token无效，清除认证状态
          this.clearAuth()
          return false
        }
        
        // 获取当前用户信息
        await this.fetchCurrentUser()
        return true
      } catch (error) {
        // 发生错误，清除认证状态
        this.clearAuth()
        return false
      } finally {
        this.setLoading(false)
      }
    }
  }
}) 