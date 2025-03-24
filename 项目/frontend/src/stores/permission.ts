import { defineStore } from 'pinia'
import * as permissionApi from '@/api/permission'
import type { Permission, Role } from '@/api/permission'
import { useAuthStore } from './auth'

// 定义权限状态接口
interface PermissionState {
  // 当前用户拥有的权限列表
  permissions: Permission[];
  // 权限码的集合，方便快速检查
  permissionCodes: Set<string>;
  // 系统中所有可用角色
  roles: Role[];
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 权限缓存是否已初始化
  initialized: boolean;
}

// 使用缓存权限码的键
const PERMISSION_CACHE_KEY = 'app_permissions'

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    permissions: [],
    permissionCodes: new Set<string>(),
    roles: [],
    loading: false,
    error: null,
    initialized: false
  }),

  getters: {
    /**
     * 是否具有指定的权限码
     * @param state 状态
     */
    hasPermission: (state) => (permissionCode: string) => {
      if (!state.initialized) {
        return false
      }
      
      // 权限码可以是单个权限或多个权限（用逗号分隔，表示或的关系）
      if (permissionCode.includes(',')) {
        return permissionCode
          .split(',')
          .some(code => state.permissionCodes.has(code.trim()))
      }
      
      return state.permissionCodes.has(permissionCode)
    },
    
    /**
     * 是否具有指定的所有权限码（与的关系）
     * @param state 状态
     */
    hasAllPermissions: (state) => (permissionCodes: string[]) => {
      if (!state.initialized) {
        return false
      }
      
      return permissionCodes.every(code => state.permissionCodes.has(code))
    },
    
    /**
     * 检查是否具有指定的按钮权限
     * @param state 状态
     */
    hasButtonPermission: (state) => (permissionCode: string) => {
      const buttonPermission = state.permissions.find(
        p => p.code === permissionCode && p.type === 'button'
      )
      return !!buttonPermission
    },
    
    /**
     * 获取按指定类型分组的权限
     * @param state 状态
     */
    permissionsByType: (state) => (type: string) => {
      return state.permissions.filter(p => p.type === type)
    }
  },

  actions: {
    /**
     * 设置加载状态
     */
    setLoading(status: boolean) {
      this.loading = status
    },
    
    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error
    },
    
    /**
     * 更新权限列表
     */
    setPermissions(permissions: Permission[]) {
      this.permissions = permissions
      // 更新权限码集合
      this.permissionCodes = new Set(permissions.map(p => p.code))
      this.initialized = true
      
      // 缓存权限码到本地存储
      try {
        localStorage.setItem(PERMISSION_CACHE_KEY, JSON.stringify([...this.permissionCodes]))
      } catch (error) {
        console.error('权限缓存失败:', error)
      }
    },
    
    /**
     * 从缓存恢复权限码
     */
    restoreFromCache() {
      try {
        const cachedCodes = localStorage.getItem(PERMISSION_CACHE_KEY)
        if (cachedCodes) {
          const codes = JSON.parse(cachedCodes)
          if (Array.isArray(codes)) {
            this.permissionCodes = new Set(codes)
            this.initialized = true
            return true
          }
        }
      } catch (error) {
        console.error('恢复权限缓存失败:', error)
      }
      return false
    },
    
    /**
     * 清除权限信息
     */
    clearPermissions() {
      this.permissions = []
      this.permissionCodes = new Set()
      this.initialized = false
      localStorage.removeItem(PERMISSION_CACHE_KEY)
    },
    
    /**
     * 初始化权限数据
     */
    async initPermissions() {
      // 检查是否已初始化
      if (this.initialized) {
        return true
      }
      
      // 检查用户是否已登录
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        return false
      }
      
      // 尝试从缓存恢复
      if (this.restoreFromCache()) {
        // 异步加载完整权限信息
        this.fetchCurrentUserPermissions().catch(error => {
          console.error('加载权限信息失败:', error)
        })
        return true
      }
      
      // 从服务器获取权限信息
      return await this.fetchCurrentUserPermissions()
    },
    
    /**
     * 获取当前用户的所有权限
     */
    async fetchCurrentUserPermissions() {
      this.setLoading(true)
      
      try {
        const permissions = await permissionApi.getCurrentUserPermissions()
        this.setPermissions(permissions)
        return true
      } catch (error: any) {
        console.error('获取权限信息失败:', error)
        this.setError(error?.message || '获取权限信息失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    /**
     * 获取所有角色列表
     */
    async fetchAllRoles() {
      this.setLoading(true)
      
      try {
        const roles = await permissionApi.getAllRoles()
        this.roles = roles
        return roles
      } catch (error: any) {
        console.error('获取角色列表失败:', error)
        this.setError(error?.message || '获取角色列表失败')
        return []
      } finally {
        this.setLoading(false)
      }
    },
    
    /**
     * 检查指定权限码
     * 直接调用API进行权限检查，用于实时验证
     */
    async checkPermission(permissionCode: string) {
      try {
        return await permissionApi.checkPermission(permissionCode)
      } catch (error) {
        console.error('权限检查失败:', error)
        return false
      }
    },
    
    /**
     * 验证是否有访问某个路由的权限
     */
    hasRoutePermission(route: any) {
      // 检查路由是否需要权限
      if (!route.meta || !route.meta.permission) {
        return true
      }
      
      // 检查是否需要角色权限
      if (route.meta.roles && route.meta.roles.length > 0) {
        const authStore = useAuthStore()
        const userRole = authStore.userRole
        
        if (!userRole || !route.meta.roles.includes(userRole)) {
          return false
        }
      }
      
      // 检查是否需要特定权限码
      if (route.meta.permission) {
        return this.hasPermission(route.meta.permission)
      }
      
      return true
    }
  }
}) 