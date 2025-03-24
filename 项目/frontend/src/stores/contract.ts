import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import * as contractApi from '../api/contract'
import type { 
  Contract, 
  ContractQueryParams, 
  ContractStatistics,
  ContractStatus,
  ContractType,
  Attachment
} from '../api/contract'

export interface ContractState {
  contracts: Contract[]
  currentContract: Contract | null
  statistics: ContractStatistics | null
  totalCount: number
  loading: boolean
  error: string | null
  queryParams: ContractQueryParams
}

export const useContractStore = defineStore('contract', {
  state: (): ContractState => ({
    contracts: [],
    currentContract: null,
    statistics: null,
    totalCount: 0,
    loading: false,
    error: null,
    queryParams: {
      page: 1,
      limit: 10
    }
  }),
  
  getters: {
    // 按状态统计合同数量
    contractCountByStatus: (state) => {
      if (!state.statistics) return {}
      
      return {
        draft: state.statistics.totalCount - (
          state.statistics.activeCount + 
          state.statistics.expiredCount + 
          state.statistics.pendingCount
        ),
        pending: state.statistics.pendingCount,
        active: state.statistics.activeCount,
        expired: state.statistics.expiredCount,
      }
    },
    
    // 获取合同类型分布
    contractTypeDistribution: (state) => {
      return state.statistics?.typeDistribution || {}
    },
    
    // 获取合同金额分布
    contractAmountDistribution: (state) => {
      return state.statistics?.amountDistribution || {}
    },
    
    // 即将到期的合同数量
    expiringSoonCount: (state) => {
      return state.statistics?.expiringSoonCount || 0
    },
    
    // 逾期合同数量
    overdueCount: (state) => {
      return state.statistics?.overdueCount || 0
    },
    
    // 每月合同数量趋势
    monthlyContractTrend: (state) => {
      return state.statistics?.monthlyContractCount || []
    },
    
    // 获取合同总金额
    totalContractAmount: (state) => {
      return state.contracts.reduce((sum, contract) => sum + contract.amount, 0)
    }
  },
  
  actions: {
    setLoading(status: boolean) {
      this.loading = status
    },
    
    setError(error: string | null) {
      this.error = error
    },
    
    setQueryParams(params: Partial<ContractQueryParams>) {
      this.queryParams = { ...this.queryParams, ...params }
    },
    
    // 清除当前选中的合同
    clearCurrentContract() {
      this.currentContract = null
    },
    
    // 获取合同列表
    async fetchContracts(params?: Partial<ContractQueryParams>) {
      if (params) {
        this.setQueryParams(params)
      }
      
      this.setLoading(true)
      this.setError(null)
      
      try {
        const { list, total } = await contractApi.getContracts(this.queryParams)
        this.contracts = list
        this.totalCount = total
        return list
      } catch (error: any) {
        this.setError(error?.message || '获取合同列表失败')
        ElMessage.error(this.error || '数据加载失败')
        return []
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取合同统计数据
    async fetchStatistics() {
      this.setLoading(true)
      
      try {
        const statistics = await contractApi.getContractStatistics()
        this.statistics = statistics
        return statistics
      } catch (error: any) {
        this.setError(error?.message || '获取统计数据失败')
        ElMessage.error(this.error || '统计数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取单个合同详情
    async fetchContractById(id: string) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const contract = await contractApi.getContractById(id)
        this.currentContract = contract
        return contract
      } catch (error: any) {
        this.setError(error?.message || '获取合同详情失败')
        ElMessage.error(this.error || '合同信息加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 创建合同
    async createContract(contractData: Omit<Contract, 'id' | 'createTime' | 'updateTime' | 'createBy'>) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const contract = await contractApi.createContract(contractData)
        
        // 将新合同添加到列表中
        this.contracts.unshift(contract)
        this.totalCount++
        
        ElMessage.success('合同创建成功')
        return contract
      } catch (error: any) {
        this.setError(error?.message || '创建合同失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 更新合同
    async updateContract(id: string, contractData: Partial<Contract>) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedContract = await contractApi.updateContract(id, contractData)
        
        // 更新本地合同列表
        const index = this.contracts.findIndex(c => c.id === id)
        if (index !== -1) {
          this.contracts[index] = updatedContract
        }
        
        // 如果是当前选中的合同，也更新它
        if (this.currentContract && this.currentContract.id === id) {
          this.currentContract = updatedContract
        }
        
        ElMessage.success('合同已更新')
        return updatedContract
      } catch (error: any) {
        this.setError(error?.message || '更新合同失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除合同
    async deleteContract(id: string) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await contractApi.deleteContract(id)
        
        // 从本地列表中删除
        this.contracts = this.contracts.filter(c => c.id !== id)
        this.totalCount--
        
        // 如果是当前选中的合同，清除它
        if (this.currentContract && this.currentContract.id === id) {
          this.currentContract = null
        }
        
        ElMessage.success('合同已删除')
        return true
      } catch (error: any) {
        this.setError(error?.message || '删除合同失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 批量删除合同
    async batchDeleteContracts(ids: string[]) {
      if (!ids.length) return false
      
      this.setLoading(true)
      this.setError(null)
      
      try {
        await contractApi.batchDeleteContracts(ids)
        
        // 从本地列表中删除
        this.contracts = this.contracts.filter(c => !ids.includes(c.id))
        this.totalCount -= ids.length
        
        // 如果当前选中的合同在删除列表中，清除它
        if (this.currentContract && ids.includes(this.currentContract.id)) {
          this.currentContract = null
        }
        
        ElMessage.success(`已删除 ${ids.length} 份合同`)
        return true
      } catch (error: any) {
        this.setError(error?.message || '批量删除合同失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 提交合同审批
    async submitForApproval(id: string) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedContract = await contractApi.submitContractForApproval(id)
        
        // 更新本地合同列表
        const index = this.contracts.findIndex(c => c.id === id)
        if (index !== -1) {
          this.contracts[index] = updatedContract
        }
        
        // 如果是当前选中的合同，也更新它
        if (this.currentContract && this.currentContract.id === id) {
          this.currentContract = updatedContract
        }
        
        ElMessage.success('合同已提交审批')
        return updatedContract
      } catch (error: any) {
        this.setError(error?.message || '提交审批失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 审批合同
    async approveContract(id: string, approved: boolean, comment?: string) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedContract = await contractApi.approveContract(id, approved, comment)
        
        // 更新本地合同列表
        const index = this.contracts.findIndex(c => c.id === id)
        if (index !== -1) {
          this.contracts[index] = updatedContract
        }
        
        // 如果是当前选中的合同，也更新它
        if (this.currentContract && this.currentContract.id === id) {
          this.currentContract = updatedContract
        }
        
        ElMessage.success(approved ? '合同已批准' : '合同已驳回')
        return updatedContract
      } catch (error: any) {
        this.setError(error?.message || '审批操作失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 终止合同
    async terminateContract(id: string, reason: string) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedContract = await contractApi.terminateContract(id, reason)
        
        // 更新本地合同列表
        const index = this.contracts.findIndex(c => c.id === id)
        if (index !== -1) {
          this.contracts[index] = updatedContract
        }
        
        // 如果是当前选中的合同，也更新它
        if (this.currentContract && this.currentContract.id === id) {
          this.currentContract = updatedContract
        }
        
        ElMessage.success('合同已终止')
        return updatedContract
      } catch (error: any) {
        this.setError(error?.message || '终止合同失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 上传合同附件
    async uploadAttachment(contractId: string, file: File) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const attachment = await contractApi.uploadContractAttachment(contractId, file)
        
        // 如果是当前合同，更新附件列表
        if (this.currentContract && this.currentContract.id === contractId) {
          if (!this.currentContract.attachments) {
            this.currentContract.attachments = []
          }
          this.currentContract.attachments.push(attachment)
        }
        
        ElMessage.success('附件上传成功')
        return attachment
      } catch (error: any) {
        this.setError(error?.message || '上传附件失败')
        ElMessage.error(this.error || '上传失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除合同附件
    async deleteAttachment(contractId: string, attachmentId: string) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await contractApi.deleteContractAttachment(contractId, attachmentId)
        
        // 如果是当前合同，更新附件列表
        if (this.currentContract && this.currentContract.id === contractId && this.currentContract.attachments) {
          this.currentContract.attachments = this.currentContract.attachments.filter(
            a => a.id !== attachmentId
          )
        }
        
        ElMessage.success('附件已删除')
        return true
      } catch (error: any) {
        this.setError(error?.message || '删除附件失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 导出合同
    async exportContract(id: string, format: 'pdf' | 'docx' = 'pdf') {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await contractApi.exportContract(id, format)
        ElMessage.success(`合同已导出为${format.toUpperCase()}格式`)
        return true
      } catch (error: any) {
        this.setError(error?.message || '导出合同失败')
        ElMessage.error(this.error || '导出失败')
        return false
      } finally {
        this.setLoading(false)
      }
    }
  }
}) 