import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// API基础配置
const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TIMEOUT = 10000

// 创建axios实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 如果存在token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 统一处理错误
    if (error.response) {
      const { status, data } = error.response
      
      // 根据状态码处理错误
      switch (status) {
        case 400:
          ElMessage.error(data.message || '请求参数错误')
          break
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          // 清除token
          localStorage.removeItem('token')
          // 跳转到登录页
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问此资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data.message || '未知错误')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求发生错误')
    }
    
    return Promise.reject(error)
  }
)

// GET请求
export const get = async <T>(url: string, params?: any): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.get(url, { params })
    return response.data
  } catch (error) {
    throw error
  }
}

// POST请求
export const post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.post(url, data, config)
    return response.data
  } catch (error) {
    throw error
  }
}

// PUT请求
export const put = async <T>(url: string, data?: any): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.put(url, data)
    return response.data
  } catch (error) {
    throw error
  }
}

// DELETE请求
export const del = async <T>(url: string): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.delete(url)
    return response.data
  } catch (error) {
    throw error
  }
}

// 下载文件
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob'
    })
    
    // 从响应头中获取文件名
    const defaultFilename = getFilenameFromHeaders(response.headers) || filename || 'download'
    
    // 创建Blob URL
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    
    // 创建一个临时链接并点击下载
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = defaultFilename
    document.body.appendChild(link)
    link.click()
    
    // 清理
    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(link)
  } catch (error) {
    ElMessage.error('文件下载失败')
    throw error
  }
}

// 从响应头中提取文件名
const getFilenameFromHeaders = (headers: any): string | null => {
  const contentDisposition = headers['content-disposition']
  
  if (!contentDisposition) {
    return null
  }
  
  const filenameMatch = contentDisposition.match(/filename=(?:\"?)([^\";\n]*)(?:\"?)/i)
  return filenameMatch ? filenameMatch[1] : null
}

// 导出API客户端，允许直接访问底层实例
export { apiClient }

// 默认导出所有方法
export default {
  get,
  post,
  put,
  del,
  downloadFile,
  apiClient
} 