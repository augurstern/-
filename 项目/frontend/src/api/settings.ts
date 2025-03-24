import axios from 'axios'
import { 
  SystemSettings, 
  SecuritySettings, 
  BackupSettings,
  BackupHistory
} from '../stores/settings'

// 创建API客户端
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加授权头
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * 获取系统设置
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const response = await apiClient.get('/settings/system')
    return response.data
  } catch (error) {
    console.error('获取系统设置失败:', error)
    throw error
  }
}

/**
 * 更新系统设置
 */
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  try {
    const response = await apiClient.put('/settings/system', settings)
    return response.data
  } catch (error) {
    console.error('更新系统设置失败:', error)
    throw error
  }
}

/**
 * 获取安全设置
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const response = await apiClient.get('/settings/security')
    return response.data
  } catch (error) {
    console.error('获取安全设置失败:', error)
    throw error
  }
}

/**
 * 更新安全设置
 */
export async function updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
  try {
    const response = await apiClient.put('/settings/security', settings)
    return response.data
  } catch (error) {
    console.error('更新安全设置失败:', error)
    throw error
  }
}

/**
 * 获取备份设置
 */
export async function getBackupSettings(): Promise<BackupSettings> {
  try {
    const response = await apiClient.get('/settings/backup')
    return response.data
  } catch (error) {
    console.error('获取备份设置失败:', error)
    throw error
  }
}

/**
 * 更新备份设置
 */
export async function updateBackupSettings(settings: Partial<BackupSettings>): Promise<BackupSettings> {
  try {
    const response = await apiClient.put('/settings/backup', settings)
    return response.data
  } catch (error) {
    console.error('更新备份设置失败:', error)
    throw error
  }
}

/**
 * 执行手动备份
 */
export async function runManualBackup(): Promise<{ id: string; message: string }> {
  try {
    const response = await apiClient.post('/backup/manual')
    return response.data
  } catch (error) {
    console.error('执行手动备份失败:', error)
    throw error
  }
}

/**
 * 获取备份历史
 */
export async function getBackupHistory(params: { page: number; pageSize: number }): Promise<{ items: BackupHistory[]; total: number }> {
  try {
    const response = await apiClient.get('/backup/history', { params })
    return response.data
  } catch (error) {
    console.error('获取备份历史失败:', error)
    throw error
  }
}

/**
 * 恢复备份
 */
export async function restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post(`/backup/restore/${backupId}`)
    return response.data
  } catch (error) {
    console.error('恢复备份失败:', error)
    throw error
  }
}

/**
 * 下载备份
 */
export async function downloadBackup(backupId: string): Promise<Blob> {
  try {
    const response = await apiClient.get(`/backup/download/${backupId}`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('下载备份失败:', error)
    throw error
  }
}

/**
 * 删除备份
 */
export async function deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.delete(`/backup/${backupId}`)
    return response.data
  } catch (error) {
    console.error('删除备份失败:', error)
    throw error
  }
} 