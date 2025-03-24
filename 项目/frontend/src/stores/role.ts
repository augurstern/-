import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import * as roleApi from '../api/role'
import type { 
  Role, 
  RoleQueryParams, 
  RoleCreatePayload, 
  RoleUpdatePayload,
  Permission,
  PermissionModule
} from '../api/role'

interface RoleState {
  roleList: Role[]
  total: number
  currentRole: Role | null
  loading: boolean
  error: string | null
  queryParams: RoleQueryParams
  permissions: PermissionModule[]
}

export const useRoleStore = defineStore('role', {
  state: (): RoleState => ({
    roleList: [],
    total: 0,
    currentRole: null,
    loading: false,
    error: null,
    queryParams: {
      page: 1,
      pageSize: 10
    },
    permissions: []
  }),
  
  getters: {
    // 角色总数
    roleCount: (state) => state.total,
    
    // 获取分页参数
    pagination: (state) => ({
      currentPage: state.queryParams.page,
      pageSize: state.queryParams.pageSize,
      total: state.total
    }),
    
    // 获取查询参数
    filters: (state) => ({
      keyword: state.queryParams.keyword || '',
      status: state.queryParams.status || ''
    })
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
    setQueryParams(params: Partial<RoleQueryParams>): void {
      this.queryParams = { ...this.queryParams, ...params }
    },
    
    // 重置查询参数
    resetQueryParams(): void {
      this.queryParams = {
        page: 1,
        pageSize: 10
      }
    },
    
    // 获取角色列表
    async fetchRoles(params?: Partial<RoleQueryParams>): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      if (params) {
        this.setQueryParams(params)
      }
      
      try {
        const { items, total } = await roleApi.getRoles(this.queryParams)
        this.roleList = items
        this.total = total
      } catch (error: any) {
        this.setError(error?.message || '获取角色列表失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取单个角色信息
    async fetchRole(id: string): Promise<Role | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const role = await roleApi.getRole(id)
        this.currentRole = role
        return role
      } catch (error: any) {
        this.setError(error?.message || '获取角色信息失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 创建角色
    async createRole(roleData: RoleCreatePayload): Promise<Role | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const role = await roleApi.createRole(roleData)
        // 添加到列表首位
        if (this.roleList.length > 0) {
          this.roleList.unshift(role)
          this.total += 1
        }
        ElMessage.success('角色创建成功')
        return role
      } catch (error: any) {
        this.setError(error?.message || '创建角色失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 更新角色
    async updateRole(id: string, roleData: RoleUpdatePayload): Promise<Role | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedRole = await roleApi.updateRole(id, roleData)
        
        // 更新列表中的角色数据
        const index = this.roleList.findIndex(role => role.id === id)
        if (index !== -1) {
          this.roleList[index] = updatedRole
        }
        
        // 如果当前查看的角色是被更新的角色，也更新当前角色
        if (this.currentRole && this.currentRole.id === id) {
          this.currentRole = updatedRole
        }
        
        ElMessage.success('角色信息更新成功')
        return updatedRole
      } catch (error: any) {
        this.setError(error?.message || '更新角色失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除角色
    async deleteRole(id: string): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await roleApi.deleteRole(id)
        
        // 从列表中移除角色
        this.roleList = this.roleList.filter(role => role.id !== id)
        this.total -= 1
        
        // 如果当前查看的角色是被删除的角色，清空当前角色
        if (this.currentRole && this.currentRole.id === id) {
          this.currentRole = null
        }
        
        ElMessage.success('角色删除成功')
        return true
      } catch (error: any) {
        this.setError(error?.message || '删除角色失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 修改角色状态
    async toggleRoleStatus(id: string, status: 'active' | 'inactive'): Promise<Role | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedRole = await roleApi.toggleRoleStatus(id, status)
        
        // 更新列表中的角色数据
        const index = this.roleList.findIndex(role => role.id === id)
        if (index !== -1) {
          this.roleList[index] = updatedRole
        }
        
        // 如果当前查看的角色是被更新的角色，也更新当前角色
        if (this.currentRole && this.currentRole.id === id) {
          this.currentRole = updatedRole
        }
        
        ElMessage.success(`角色状态已更新为${status === 'active' ? '启用' : '禁用'}`)
        return updatedRole
      } catch (error: any) {
        this.setError(error?.message || '更新角色状态失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取权限列表
    async fetchPermissions(): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        this.permissions = await roleApi.getPermissions()
      } catch (error: any) {
        this.setError(error?.message || '获取权限列表失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取角色的权限
    async fetchRolePermissions(roleId: string): Promise<string[] | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const permissions = await roleApi.getRolePermissions(roleId)
        return permissions
      } catch (error: any) {
        this.setError(error?.message || '获取角色权限失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 更新角色权限
    async updateRolePermissions(roleId: string, permissions: string[]): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await roleApi.updateRolePermissions(roleId, permissions)
        ElMessage.success('角色权限更新成功')
        return true
      } catch (error: any) {
        this.setError(error?.message || '更新角色权限失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    }
  }
}) 