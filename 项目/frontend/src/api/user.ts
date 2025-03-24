import { get, post, put, del } from './index'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: string
  department?: string
  position?: string
  phone?: string
  status: 'active' | 'inactive' | 'locked'
  createdAt: string
  lastLogin?: string
}

export interface UserQueryParams {
  keyword?: string
  role?: string
  status?: string
  department?: string
  page: number
  pageSize: number
}

export interface UserCreatePayload {
  username: string
  email: string
  password: string
  role: string
  department?: string
  position?: string
  phone?: string
  status?: 'active' | 'inactive'
}

export interface UserUpdatePayload {
  username?: string
  email?: string
  role?: string
  department?: string
  position?: string
  phone?: string
  status?: 'active' | 'inactive' | 'locked'
}

export interface PasswordChangePayload {
  userId: string
  newPassword: string
  requireReset?: boolean
}

export interface UserProfileUpdatePayload {
  email?: string
  avatar?: string
  phone?: string
  department?: string
  position?: string
  bio?: string
}

/**
 * 获取用户列表
 */
export async function getUsers(params: UserQueryParams): Promise<{
  items: User[]
  total: number
}> {
  return get('/users', params)
}

/**
 * 获取单个用户信息
 */
export async function getUser(id: string): Promise<User> {
  return get(`/users/${id}`)
}

/**
 * 创建新用户
 */
export async function createUser(userData: UserCreatePayload): Promise<User> {
  return post('/users', userData)
}

/**
 * 更新用户信息
 */
export async function updateUser(id: string, userData: UserUpdatePayload): Promise<User> {
  return put(`/users/${id}`, userData)
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
  return del(`/users/${id}`)
}

/**
 * 批量删除用户
 */
export async function batchDeleteUsers(ids: string[]): Promise<{ success: boolean; message: string }> {
  return post('/users/batch-delete', { ids })
}

/**
 * 修改用户密码（管理员）
 */
export async function changeUserPassword(payload: PasswordChangePayload): Promise<{ success: boolean; message: string }> {
  return post('/users/change-password', payload)
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(id: string): Promise<{ success: boolean; message: string; temporaryPassword?: string }> {
  return post(`/users/${id}/reset-password`)
}

/**
 * 启用/禁用用户
 */
export async function toggleUserStatus(id: string, status: 'active' | 'inactive' | 'locked'): Promise<User> {
  return put(`/users/${id}/status`, { status })
}

/**
 * 获取用户所有可分配的角色
 */
export async function getUserRoles(): Promise<{ id: string; name: string; description: string }[]> {
  return get('/roles')
}

/**
 * 获取部门列表
 */
export async function getDepartments(): Promise<{ id: string; name: string; parentId?: string }[]> {
  return get('/departments')
}

/**
 * 更新当前用户个人资料
 */
export async function updateProfile(profileData: UserProfileUpdatePayload): Promise<User> {
  return put('/users/profile', profileData)
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(formData: FormData): Promise<{ url: string }> {
  return post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取用户统计数据
 */
export async function getUserStats(): Promise<{
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  lockedUsers: number
  newUsersThisMonth: number
}> {
  return get('/users/stats')
} 