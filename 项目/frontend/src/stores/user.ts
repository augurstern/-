import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import * as userApi from '../api/user'
import type { User, UserQueryParams, UserCreatePayload, UserUpdatePayload } from '../api/user'

interface UserState {
  userList: User[]
  total: number
  currentUser: User | null
  loading: boolean
  error: string | null
  queryParams: UserQueryParams
  roles: { id: string; name: string; description: string }[]
  departments: { id: string; name: string; parentId?: string }[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userList: [],
    total: 0,
    currentUser: null,
    loading: false,
    error: null,
    queryParams: {
      page: 1,
      pageSize: 10
    },
    roles: [],
    departments: []
  }),
  
  getters: {
    // 用户总数
    userCount: (state) => state.total,
    
    // 获取分页参数
    pagination: (state) => ({
      currentPage: state.queryParams.page,
      pageSize: state.queryParams.pageSize,
      total: state.total
    }),
    
    // 获取查询参数
    filters: (state) => ({
      keyword: state.queryParams.keyword || '',
      role: state.queryParams.role || '',
      status: state.queryParams.status || '',
      department: state.queryParams.department || ''
    }),
    
    // 获取角色名称映射
    roleMap: (state) => {
      const map: Record<string, string> = {}
      state.roles.forEach(role => {
        map[role.id] = role.name
      })
      return map
    },
    
    // 获取部门名称映射
    departmentMap: (state) => {
      const map: Record<string, string> = {}
      state.departments.forEach(dept => {
        map[dept.id] = dept.name
      })
      return map
    }
  },
  
  actions: {
    // 设置加载状态
    setLoading(status: boolean): void {
      this.loading = status
    },
    
    // 设置错误信息
    setError(error: string | null): void {
      this.error = error
    },
    
    // 设置查询参数
    setQueryParams(params: Partial<UserQueryParams>): void {
      this.queryParams = { ...this.queryParams, ...params }
    },
    
    // 重置查询参数
    resetQueryParams(): void {
      this.queryParams = {
        page: 1,
        pageSize: 10
      }
    },
    
    // 获取用户列表
    async fetchUsers(params?: Partial<UserQueryParams>): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      if (params) {
        this.setQueryParams(params)
      }
      
      try {
        const { items, total } = await userApi.getUsers(this.queryParams)
        this.userList = items
        this.total = total
      } catch (error: any) {
        this.setError(error?.message || '获取用户列表失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取单个用户信息
    async fetchUser(id: string): Promise<User | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const user = await userApi.getUser(id)
        this.currentUser = user
        return user
      } catch (error: any) {
        this.setError(error?.message || '获取用户信息失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 创建用户
    async createUser(userData: UserCreatePayload): Promise<User | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const user = await userApi.createUser(userData)
        // 添加到列表首位
        if (this.userList.length > 0) {
          this.userList.unshift(user)
          this.total += 1
        }
        ElMessage.success('用户创建成功')
        return user
      } catch (error: any) {
        this.setError(error?.message || '创建用户失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 更新用户
    async updateUser(id: string, userData: UserUpdatePayload): Promise<User | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedUser = await userApi.updateUser(id, userData)
        
        // 更新列表中的用户数据
        const index = this.userList.findIndex(user => user.id === id)
        if (index !== -1) {
          this.userList[index] = updatedUser
        }
        
        // 如果当前查看的用户是被更新的用户，也更新当前用户
        if (this.currentUser && this.currentUser.id === id) {
          this.currentUser = updatedUser
        }
        
        ElMessage.success('用户信息更新成功')
        return updatedUser
      } catch (error: any) {
        this.setError(error?.message || '更新用户失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除用户
    async deleteUser(id: string): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await userApi.deleteUser(id)
        
        // 从列表中移除用户
        this.userList = this.userList.filter(user => user.id !== id)
        this.total -= 1
        
        // 如果当前查看的用户是被删除的用户，清空当前用户
        if (this.currentUser && this.currentUser.id === id) {
          this.currentUser = null
        }
        
        ElMessage.success('用户删除成功')
        return true
      } catch (error: any) {
        this.setError(error?.message || '删除用户失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 批量删除用户
    async batchDeleteUsers(ids: string[]): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await userApi.batchDeleteUsers(ids)
        
        // 从列表中移除被删除的用户
        this.userList = this.userList.filter(user => !ids.includes(user.id))
        this.total -= ids.length
        
        // 如果当前查看的用户在被删除列表中，清空当前用户
        if (this.currentUser && ids.includes(this.currentUser.id)) {
          this.currentUser = null
        }
        
        ElMessage.success('批量删除用户成功')
        return true
      } catch (error: any) {
        this.setError(error?.message || '批量删除用户失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 修改用户状态
    async toggleUserStatus(id: string, status: 'active' | 'inactive' | 'locked'): Promise<User | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedUser = await userApi.toggleUserStatus(id, status)
        
        // 更新列表中的用户数据
        const index = this.userList.findIndex(user => user.id === id)
        if (index !== -1) {
          this.userList[index] = updatedUser
        }
        
        // 如果当前查看的用户是被更新的用户，也更新当前用户
        if (this.currentUser && this.currentUser.id === id) {
          this.currentUser = updatedUser
        }
        
        ElMessage.success(`用户状态已更新为${status === 'active' ? '启用' : status === 'inactive' ? '禁用' : '锁定'}`)
        return updatedUser
      } catch (error: any) {
        this.setError(error?.message || '更新用户状态失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取角色列表
    async fetchRoles(): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        this.roles = await userApi.getUserRoles()
      } catch (error: any) {
        this.setError(error?.message || '获取角色列表失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取部门列表
    async fetchDepartments(): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        this.departments = await userApi.getDepartments()
      } catch (error: any) {
        this.setError(error?.message || '获取部门列表失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 重置用户密码
    async resetUserPassword(id: string): Promise<string | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const result = await userApi.resetUserPassword(id)
        ElMessage.success('用户密码重置成功')
        return result.temporaryPassword || null
      } catch (error: any) {
        this.setError(error?.message || '重置用户密码失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    }
  }
}) 