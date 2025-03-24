import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import * as auditApi from '../api/audit'
import type { AuditLog, AuditLogQueryParams, SensitiveOperationLog, AuditQueryParams } from '../api/audit'
import { useRouter } from 'vue-router'

interface AuditState {
  auditLogs: AuditLog[]
  currentLog: AuditLog | null
  total: number
  loading: boolean
  error: string | null
  queryParams: AuditLogQueryParams
  stats: {
    totalLogs: number
    successCount: number
    failureCount: number
    moduleStats: Array<{ module: string; count: number }>
    actionStats: Array<{ action: string; count: number }>
    userStats: Array<{ userId: string; username: string; count: number }>
    timeStats: Array<{ date: string; count: number }>
  } | null
  logs: AuditLog[]
  sensitiveLogs: SensitiveOperationLog[]
  loginLogs: AuditLog[]
  pendingApprovals: SensitiveOperationLog[]
  myOperations: SensitiveOperationLog[]
  auditEnabled: boolean
  sensitiveOperationEnabled: boolean
}

export const useAuditStore = defineStore('audit', {
  state: (): AuditState => ({
    auditLogs: [],
    currentLog: null,
    total: 0,
    loading: false,
    error: null,
    queryParams: {
      page: 1,
      pageSize: 20
    },
    stats: null,
    logs: [],
    sensitiveLogs: [],
    loginLogs: [],
    pendingApprovals: [],
    myOperations: [],
    auditEnabled: true,
    sensitiveOperationEnabled: true
  }),
  
  getters: {
    // 获取分页参数
    pagination: (state) => ({
      currentPage: state.queryParams.page,
      pageSize: state.queryParams.pageSize,
      total: state.total
    }),
    
    // 获取查询参数
    filters: (state) => ({
      userId: state.queryParams.userId || '',
      username: state.queryParams.username || '',
      module: state.queryParams.module || '',
      action: state.queryParams.action || '',
      resourceType: state.queryParams.resourceType || '',
      resourceId: state.queryParams.resourceId || '',
      status: state.queryParams.status || '',
      startTime: state.queryParams.startTime || '',
      endTime: state.queryParams.endTime || ''
    }),
    
    // 成功率
    successRate: (state) => {
      if (!state.stats || state.stats.totalLogs === 0) return 0
      return Math.round((state.stats.successCount / state.stats.totalLogs) * 100)
    },
    
    // 失败率
    failureRate: (state) => {
      if (!state.stats || state.stats.totalLogs === 0) return 0
      return Math.round((state.stats.failureCount / state.stats.totalLogs) * 100)
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
    setQueryParams(params: Partial<AuditLogQueryParams>): void {
      this.queryParams = { ...this.queryParams, ...params }
    },
    
    // 重置查询参数
    resetQueryParams(): void {
      this.queryParams = {
        page: 1,
        pageSize: 20
      }
    },
    
    // 获取审计日志列表
    async fetchAuditLogs(params?: Partial<AuditLogQueryParams>): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      if (params) {
        this.setQueryParams(params)
      }
      
      try {
        const { items, total } = await auditApi.getAuditLogs(this.queryParams)
        this.auditLogs = items
        this.total = total
      } catch (error: any) {
        this.setError(error?.message || '获取审计日志失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取单条审计日志详情
    async fetchAuditLog(id: string): Promise<AuditLog | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const log = await auditApi.getAuditLog(id)
        this.currentLog = log
        return log
      } catch (error: any) {
        this.setError(error?.message || '获取审计日志详情失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取用户操作记录
    async fetchUserOperations(userId: string, params: {
      page: number
      pageSize: number
    }): Promise<{
      items: AuditLog[]
      total: number
    } | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const result = await auditApi.getUserOperations(userId, params)
        return result
      } catch (error: any) {
        this.setError(error?.message || '获取用户操作记录失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取资源操作记录
    async fetchResourceOperations(resourceType: string, resourceId: string, params: {
      page: number
      pageSize: number
    }): Promise<{
      items: AuditLog[]
      total: number
    } | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const result = await auditApi.getResourceOperations(resourceType, resourceId, params)
        return result
      } catch (error: any) {
        this.setError(error?.message || '获取资源操作记录失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 导出审计日志
    async exportAuditLogs(): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const blob = await auditApi.exportAuditLogs(this.queryParams)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 生成文件名
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        link.download = `audit-logs-${dateStr}.xlsx`
        
        // 触发下载
        document.body.appendChild(link)
        link.click()
        
        // 清理
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('导出成功')
        return true
      } catch (error: any) {
        this.setError(error?.message || '导出审计日志失败')
        ElMessage.error(this.error || '导出失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取审计日志统计数据
    async fetchAuditStats(params?: {
      startTime?: string
      endTime?: string
    }): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        this.stats = await auditApi.getAuditStats(params)
      } catch (error: any) {
        this.setError(error?.message || '获取审计统计数据失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 清理过期审计日志
    async cleanupAuditLogs(params: {
      beforeDate: string
      status?: 'success' | 'failure'
    }): Promise<{
      success: boolean
      message: string
      count: number
    } | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const result = await auditApi.cleanupAuditLogs(params)
        
        if (result.success) {
          ElMessage.success(`成功清理 ${result.count} 条审计日志`)
          // 刷新日志列表
          await this.fetchAuditLogs()
          // 刷新统计数据
          await this.fetchAuditStats()
        } else {
          ElMessage.warning(result.message || '没有符合条件的日志需要清理')
        }
        
        return result
      } catch (error: any) {
        this.setError(error?.message || '清理审计日志失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取操作日志列表
    async fetchAuditLogList(params: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        const result = await auditApi.getAuditLogList(params)
        this.logs = result.items
        this.total = result.total
        return result
      } catch (error: any) {
        console.error('获取操作日志失败:', error)
        this.setError(error?.message || '获取操作日志失败')
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取敏感操作日志列表
    async fetchSensitiveLogList(params: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        const result = await auditApi.getSensitiveLogList(params)
        this.sensitiveLogs = result.items
        this.total = result.total
        return result
      } catch (error: any) {
        console.error('获取敏感操作日志失败:', error)
        this.setError(error?.message || '获取敏感操作日志失败')
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取登录日志列表
    async fetchLoginLogList(params: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        const result = await auditApi.getLoginLogList(params)
        this.loginLogs = result.items
        this.total = result.total
        return result
      } catch (error: any) {
        console.error('获取登录日志失败:', error)
        this.setError(error?.message || '获取登录日志失败')
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取待我审批的敏感操作列表
    async fetchPendingApprovalList(params?: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        const result = await auditApi.getPendingApprovalList(params)
        this.pendingApprovals = result.items
        return result
      } catch (error: any) {
        console.error('获取待审批操作失败:', error)
        this.setError(error?.message || '获取待审批操作失败')
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取我的敏感操作申请列表
    async fetchMyOperationList(params?: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        const result = await auditApi.getMyOperationList(params)
        this.myOperations = result.items
        return result
      } catch (error: any) {
        console.error('获取我的操作申请失败:', error)
        this.setError(error?.message || '获取我的操作申请失败')
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取操作日志详情
    async getAuditLogDetail(id: string) {
      this.setLoading(true)
      
      try {
        return await auditApi.getAuditLogDetail(id)
      } catch (error: any) {
        console.error('获取操作日志详情失败:', error)
        this.setError(error?.message || '获取操作日志详情失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取敏感操作详情
    async getSensitiveOperationDetail(id: string) {
      this.setLoading(true)
      
      try {
        return await auditApi.getSensitiveOperationDetail(id)
      } catch (error: any) {
        console.error('获取敏感操作详情失败:', error)
        this.setError(error?.message || '获取敏感操作详情失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除操作日志
    async deleteAuditLog(id: string) {
      this.setLoading(true)
      
      try {
        await auditApi.deleteAuditLog(id)
        return true
      } catch (error: any) {
        console.error('删除操作日志失败:', error)
        this.setError(error?.message || '删除操作日志失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 批量删除操作日志
    async batchDeleteAuditLogs(ids: string[]) {
      this.setLoading(true)
      
      try {
        await auditApi.batchDeleteAuditLogs(ids)
        return true
      } catch (error: any) {
        console.error('批量删除操作日志失败:', error)
        this.setError(error?.message || '批量删除操作日志失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 清空操作日志
    async clearAuditLogs() {
      this.setLoading(true)
      
      try {
        await auditApi.clearAuditLogs()
        return true
      } catch (error: any) {
        console.error('清空操作日志失败:', error)
        this.setError(error?.message || '清空操作日志失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 导出操作日志
    async exportAuditLogs(params: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        await auditApi.exportAuditLogs(params)
        return true
      } catch (error: any) {
        console.error('导出操作日志失败:', error)
        this.setError(error?.message || '导出操作日志失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 导出登录日志
    async exportLoginLogs(params: AuditQueryParams) {
      this.setLoading(true)
      
      try {
        await auditApi.exportLoginLogs(params)
        return true
      } catch (error: any) {
        console.error('导出登录日志失败:', error)
        this.setError(error?.message || '导出登录日志失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 申请敏感操作
    async applySensitiveOperation(data: {
      module: string;
      operation: string;
      details: any;
      reason: string;
    }) {
      this.setLoading(true)
      
      try {
        const result = await auditApi.applySensitiveOperation(data)
        
        // 如果不需要审批，直接返回成功
        if (result.approved) {
          return { success: true, needApproval: false, id: result.id }
        }
        
        // 需要等待审批
        return { success: true, needApproval: true, id: result.id }
      } catch (error: any) {
        console.error('申请敏感操作失败:', error)
        this.setError(error?.message || '申请敏感操作失败')
        return { success: false, needApproval: false, id: '' }
      } finally {
        this.setLoading(false)
      }
    },
    
    // 审批敏感操作
    async approveSensitiveOperation(id: string, approved: boolean, comment: string) {
      this.setLoading(true)
      
      try {
        await auditApi.approveSensitiveOperation(id, { approved, comment })
        
        // 更新待审批列表
        this.fetchPendingApprovalList()
        
        return true
      } catch (error: any) {
        console.error('审批敏感操作失败:', error)
        this.setError(error?.message || '审批敏感操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 记录登录日志
    async recordLoginLog(data: {
      status: 'success' | 'fail';
      username: string;
      errorMsg?: string;
    }) {
      // 获取客户端信息
      const ipAddress = window.location.hostname || 'unknown'
      const userAgent = navigator.userAgent
      
      try {
        await auditApi.recordLoginLog({
          ...data,
          ipAddress,
          userAgent
        })
        return true
      } catch (error) {
        console.error('记录登录日志失败:', error)
        return false
      }
    }
  }
}) 