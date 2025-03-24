import { apiClient } from './index'

// 合同状态枚举
export enum ContractStatus {
  DRAFT = 'draft',         // 草稿
  PENDING = 'pending',     // 待审批
  ACTIVE = 'active',       // 生效中
  COMPLETED = 'completed', // 已完成
  TERMINATED = 'terminated', // 已终止
  EXPIRED = 'expired'      // 已过期
}

// 合同类型枚举
export enum ContractType {
  SALES = 'sales',         // 销售合同
  PURCHASE = 'purchase',   // 采购合同
  SERVICE = 'service',     // 服务合同
  EMPLOYMENT = 'employment', // 劳动合同
  LEASE = 'lease',         // 租赁合同
  OTHER = 'other'          // 其他
}

// 合同接口
export interface Contract {
  id: string
  contractNumber: string
  title: string
  type: string
  partyName: string
  amount: number
  status: string
  startDate: string
  endDate: string
  content: string
  attachments?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 合同模板接口
export interface ContractTemplate {
  id: string
  name: string
  type: string
  description?: string
  content: string
  isDefault: boolean
  lastUpdated: string
}

// 合同查询参数
export interface ContractQueryParams {
  keyword?: string
  status?: string
  type?: string
  dateRange?: [string, string]
  page?: number
  pageSize?: number
}

// 合同列表响应接口
export interface ContractListResponse {
  total: number
  page: number
  pageSize: number
  items: Contract[]
}

// 模板列表响应接口
export interface TemplateListResponse {
  items: ContractTemplate[]
}

// 合同统计数据
export interface ContractStatistics {
  totalCount: number
  activeCount: number
  expiredCount: number
  pendingCount: number
  expiringSoonCount: number
  overdueCount: number
  monthlyContractCount: number[]
  typeDistribution: { [key in ContractType]?: number }
  amountDistribution: { [key in ContractType]?: number }
}

/**
 * 获取合同列表
 */
export const getContracts = (params: ContractQueryParams) => {
  return apiClient.get<ContractListResponse>('/contracts', { params })
}

/**
 * 获取合同详情
 */
export const getContractById = (id: string) => {
  return apiClient.get<Contract>(`/contracts/${id}`)
}

/**
 * 创建合同
 */
export const createContract = (data: Partial<Contract>) => {
  return apiClient.post<Contract>('/contracts', data)
}

/**
 * 更新合同
 */
export const updateContract = (id: string, data: Partial<Contract>) => {
  return apiClient.put<Contract>(`/contracts/${id}`, data)
}

/**
 * 删除合同
 */
export const deleteContract = (id: string) => {
  return apiClient.del(`/contracts/${id}`)
}

/**
 * 批量删除合同
 */
export const batchDeleteContracts = (ids: string[]) => {
  return apiClient.post('/contracts/batch-delete', { ids })
}

/**
 * 更新合同状态
 */
export const updateContractStatus = (id: string, status: string, reason?: string) => {
  return apiClient.put(`/contracts/${id}/status`, { status, reason })
}

/**
 * 获取合同模板列表
 */
export const getContractTemplates = () => {
  return apiClient.get<TemplateListResponse>('/contracts/templates')
}

/**
 * 获取合同模板详情
 */
export const getContractTemplateById = (id: string) => {
  return apiClient.get<ContractTemplate>(`/contracts/templates/${id}`)
}

/**
 * 创建合同模板
 */
export const createContractTemplate = (data: Partial<ContractTemplate>) => {
  return apiClient.post<ContractTemplate>('/contracts/templates', data)
}

/**
 * 更新合同模板
 */
export const updateContractTemplate = (id: string, data: Partial<ContractTemplate>) => {
  return apiClient.put<ContractTemplate>(`/contracts/templates/${id}`, data)
}

/**
 * 删除合同模板
 */
export const deleteContractTemplate = (id: string) => {
  return apiClient.del(`/contracts/templates/${id}`)
}

/**
 * 导出合同
 */
export const exportContract = (id: string) => {
  return apiClient.downloadFile(`/contracts/${id}/export`)
}

/**
 * 批量导出合同
 */
export const batchExportContracts = (ids: string[]) => {
  return apiClient.downloadFile(`/contracts/batch-export`, { ids })
}

/**
 * 获取合同统计信息
 */
export const getContractStatistics = () => {
  return apiClient.get('/statistics/contracts')
}

/**
 * 获取仪表盘数据
 */
export const getDashboardData = () => {
  return apiClient.get('/statistics/dashboard')
} 