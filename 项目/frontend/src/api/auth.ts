import { get, post } from './index'
import axios, { AxiosResponse } from 'axios'

// 基础API路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 请求实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 用户接口
export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  position?: string;
  permissions: string[];
  createTime: string;
  lastLoginTime?: string;
}

// 登录请求接口
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: User;
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface PasswordResetRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 用户登录
 */
export const login = (credentials: LoginCredentials): Promise<LoginResponse> => {
  return post<LoginResponse>('/auth/login', credentials)
}

/**
 * 用户注册
 */
export const register = async (userData: RegisterRequest): Promise<User> => {
  try {
    const response: AxiosResponse = await apiClient.post('/auth/register', userData)
    return response.data
  } catch (error) {
    console.error('注册失败:', error)
    throw error
  }
}

/**
 * 用户注销
 */
export const logout = (): Promise<void> => {
  return post<void>('/auth/logout', {})
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): Promise<User> => {
  return get<User>('/auth/current-user')
}

/**
 * 验证token是否有效
 */
export const validateToken = (token: string): Promise<boolean> => {
  return post<boolean>('/auth/validate-token', { token })
}

/**
 * 修改密码
 */
export const changePassword = (data: PasswordResetRequest): Promise<void> => {
  return post<void>('/auth/change-password', data)
}

/**
 * 更新用户信息
 */
export const updateUserProfile = (data: Partial<User>): Promise<User> => {
  return post<User>('/auth/update-profile', data)
}

/**
 * 上传用户头像
 */
export const uploadAvatar = (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('avatar', file)
  
  return post<{ url: string }>('/auth/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 