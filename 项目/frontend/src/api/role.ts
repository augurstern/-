import { get, post, put, del } from './index'

export interface Role {
  id: string
  name: string
  code: string
  description: string
  permissions: string[]
  status: 'active' | 'inactive'
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface RoleQueryParams {
  keyword?: string
  status?: string
  page: number
  pageSize: number
}

export interface RoleCreatePayload {
  name: string
  code: string
  description?: string
  permissions: string[]
  status?: 'active' | 'inactive'
}

export interface RoleUpdatePayload {
  name?: string
  description?: string
  permissions?: string[]
  status?: 'active' | 'inactive'
}

export interface Permission {
  id: string
  name: string
  code: string
  description: string
  module: string
  type: 'menu' | 'operation' | 'data'
}

export interface PermissionModule {
  module: string
  name: string
  permissions: Permission[]
}

/**
 * 获取角色列表
 */
export async function getRoles(params: RoleQueryParams): Promise<{
  items: Role[]
  total: number
}> {
  return get('/roles', params)
}

/**
 * 获取单个角色信息
 */
export async function getRole(id: string): Promise<Role> {
  return get(`/roles/${id}`)
}

/**
 * 创建新角色
 */
export async function createRole(roleData: RoleCreatePayload): Promise<Role> {
  return post('/roles', roleData)
}

/**
 * 更新角色信息
 */
export async function updateRole(id: string, roleData: RoleUpdatePayload): Promise<Role> {
  return put(`/roles/${id}`, roleData)
}

/**
 * 删除角色
 */
export async function deleteRole(id: string): Promise<{ success: boolean; message: string }> {
  return del(`/roles/${id}`)
}

/**
 * 获取权限列表
 */
export async function getPermissions(): Promise<PermissionModule[]> {
  return get('/permissions')
}

/**
 * 获取特定角色的权限
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  return get(`/roles/${roleId}/permissions`)
}

/**
 * 更新角色权限
 */
export async function updateRolePermissions(roleId: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
  return put(`/roles/${roleId}/permissions`, { permissions })
}

/**
 * 启用/禁用角色
 */
export async function toggleRoleStatus(id: string, status: 'active' | 'inactive'): Promise<Role> {
  return put(`/roles/${id}/status`, { status })
}

/**
 * 获取分配了指定角色的用户数量
 */
export async function getRoleUserCount(roleId: string): Promise<{ count: number }> {
  return get(`/roles/${roleId}/users/count`)
} 