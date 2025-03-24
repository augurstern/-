import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import * as settingsApi from '../api/settings'

// 系统设置接口
export interface SystemSettings {
  systemName: string
  logo: string
  allowRegistration: boolean
  companyName: string
  adminEmail: string
  defaultLanguage: string
  theme: 'light' | 'dark' | 'auto'
  currency: string
  dateFormat: string
  timeFormat: string
}

// 安全设置接口
export interface SecuritySettings {
  passwordMinLength: number
  passwordRequireSpecial: boolean
  passwordRequireNumbers: boolean
  passwordRequireUppercase: boolean
  sessionTimeout: number
  allowedLoginAttempts: number
  lockoutDuration: number
  twoFactorAuth: boolean
  ipRestriction: boolean
  allowedIPs: string[]
}

// 备份设置接口
export interface BackupSettings {
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupTime: string
  maxBackupCount: number
  includeAttachments: boolean
  backupLocation: 'local' | 'cloud'
  cloudProvider?: string
  cloudCredentials?: {
    apiKey?: string
    region?: string
    bucket?: string
  }
}

// 备份历史记录接口
export interface BackupHistory {
  id: string
  filename: string
  size: number
  createdAt: string
  type: 'auto' | 'manual'
  status: 'success' | 'failed'
  downloadUrl?: string
}

export interface SettingsState {
  systemSettings: SystemSettings
  securitySettings: SecuritySettings
  backupSettings: BackupSettings
  backupHistory: BackupHistory[]
  loading: boolean
  error: string | null
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    systemSettings: {
      systemName: '合同管理系统',
      logo: '/logo.png',
      allowRegistration: false,
      companyName: '示例公司',
      adminEmail: 'admin@example.com',
      defaultLanguage: 'zh-CN',
      theme: 'light',
      currency: 'CNY',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss'
    },
    securitySettings: {
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      sessionTimeout: 30,
      allowedLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorAuth: false,
      ipRestriction: false,
      allowedIPs: []
    },
    backupSettings: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      maxBackupCount: 10,
      includeAttachments: true,
      backupLocation: 'local'
    },
    backupHistory: [],
    loading: false,
    error: null
  }),
  
  getters: {
    // 系统名称
    systemName(): string {
      return this.systemSettings.systemName
    },
    
    // 当前主题
    currentTheme(): string {
      return this.systemSettings.theme
    }
  },
  
  actions: {
    // 设置加载状态
    setLoading(status: boolean) {
      this.loading = status
    },
    
    // 设置错误信息
    setError(error: string | null) {
      this.error = error
    },
    
    // 获取系统设置
    async fetchSystemSettings() {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const systemSettings = await settingsApi.getSystemSettings()
        this.systemSettings = systemSettings
        return systemSettings
      } catch (error: any) {
        this.setError(error?.message || '获取系统设置失败')
        ElMessage.error(this.error || '数据加载失败')
        
        // 若API请求失败，尝试降级使用默认配置
        return this.systemSettings
      } finally {
        this.setLoading(false)
      }
    },
    
    // 保存系统设置
    async saveSystemSettings(settings: Partial<SystemSettings>) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedSettings = await settingsApi.updateSystemSettings(settings)
        this.systemSettings = updatedSettings
        
        // 更新主题
        if (settings.theme && settings.theme !== this.systemSettings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme)
          localStorage.setItem('theme', settings.theme)
        }
        
        ElMessage.success('系统设置已保存')
        return updatedSettings
      } catch (error: any) {
        this.setError(error?.message || '保存系统设置失败')
        ElMessage.error(this.error || '保存失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取安全设置
    async fetchSecuritySettings() {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const securitySettings = await settingsApi.getSecuritySettings()
        this.securitySettings = securitySettings
        return securitySettings
      } catch (error: any) {
        this.setError(error?.message || '获取安全设置失败')
        ElMessage.error(this.error || '数据加载失败')
        
        // 若API请求失败，尝试降级使用默认配置
        return this.securitySettings
      } finally {
        this.setLoading(false)
      }
    },
    
    // 保存安全设置
    async saveSecuritySettings(settings: Partial<SecuritySettings>) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedSettings = await settingsApi.updateSecuritySettings(settings)
        this.securitySettings = updatedSettings
        ElMessage.success('安全设置已保存')
        return updatedSettings
      } catch (error: any) {
        this.setError(error?.message || '保存安全设置失败')
        ElMessage.error(this.error || '保存失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取备份设置
    async fetchBackupSettings() {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const backupSettings = await settingsApi.getBackupSettings()
        this.backupSettings = backupSettings
        return backupSettings
      } catch (error: any) {
        this.setError(error?.message || '获取备份设置失败')
        ElMessage.error(this.error || '数据加载失败')
        
        // 若API请求失败，尝试降级使用默认配置
        return this.backupSettings
      } finally {
        this.setLoading(false)
      }
    },
    
    // 保存备份设置
    async saveBackupSettings(settings: Partial<BackupSettings>) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedSettings = await settingsApi.updateBackupSettings(settings)
        this.backupSettings = updatedSettings
        ElMessage.success('备份设置已保存')
        return updatedSettings
      } catch (error: any) {
        this.setError(error?.message || '保存备份设置失败')
        ElMessage.error(this.error || '保存失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 执行手动备份
    async runManualBackup() {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const result = await settingsApi.runManualBackup()
        // 转换返回的数据为BackupHistory格式
        const backup: BackupHistory = {
          id: result.id,
          filename: `backup-${new Date().toISOString().slice(0, 10)}.zip`,
          size: 1024 * 1024, // 模拟1MB大小
          createdAt: new Date().toISOString(),
          type: 'manual',
          status: 'success',
          downloadUrl: `/api/backup/download/${result.id}`
        }
        
        // 更新备份历史
        if (this.backupHistory.length > 0) {
          this.backupHistory.unshift(backup)
        }
        ElMessage.success('手动备份已完成')
        return backup
      } catch (error: any) {
        this.setError(error?.message || '执行手动备份失败')
        ElMessage.error(this.error || '备份失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取备份历史
    async fetchBackupHistory(params: { page: number; pageSize: number }) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const result = await settingsApi.getBackupHistory(params)
        return result
      } catch (error: any) {
        this.setError(error?.message || '获取备份历史失败')
        ElMessage.error(this.error || '数据加载失败')
        
        // 若API请求失败，返回空结果
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 恢复备份
    async restoreBackup(backupId: string): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        // 调用API
        await settingsApi.restoreBackup(backupId)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '恢复备份失败'
        this.setError(errorMessage)
        throw error
      } finally {
        this.setLoading(false)
      }
    },
    
    // 下载备份文件
    async downloadBackup(backupId: string): Promise<Blob> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        // 调用API
        return await settingsApi.downloadBackup(backupId)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '下载备份文件失败'
        this.setError(errorMessage)
        throw error
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除备份
    async deleteBackup(backupId: string): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        // 调用API
        await settingsApi.deleteBackup(backupId)
        
        // 更新列表
        this.backupHistory = this.backupHistory.filter(item => item.id !== backupId)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '删除备份失败'
        this.setError(errorMessage)
        throw error
      } finally {
        this.setLoading(false)
      }
    }
  }
}) 