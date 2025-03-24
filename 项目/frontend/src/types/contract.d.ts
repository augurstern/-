export interface Contract {
  id: string
  contractNumber: string
  title: string
  content: string
  status: 'draft' | 'in_approval' | 'approved' | 'rejected' | 'completed' | 'terminated'
  type: string
  amount: number
  partyName: string
  partyA?: string
  partyB?: string
  startDate: string
  endDate: string
  signDate?: string
  department?: string
  responsible?: string
  attachments?: Attachment[]
  risk_status?: 'normal' | 'medium' | 'high'
  payment_plans?: PaymentPlan[]
  payment_cycle?: number
  templateId?: string
  variables?: string
  createdAt: string
  updatedAt: string
}

export interface ContractTemplate {
  id: string
  name: string
  description: string
  type: string
  content: string
  isDefault: boolean
  lastUpdated: string
}

export interface PaymentPlan {
  id: number
  amount: number
  planned_date: string
  actual_date?: string
  status?: 'pending' | 'paid' | 'overdue'
  contractId: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  contractId: string
  uploadedBy?: string
  uploadedAt: string
}

export interface ApprovalStep {
  id: string
  contractId: string
  approverId: string
  approverName: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  createdAt: string
  updatedAt: string
}

export interface ContractAlert {
  id: string
  name: string
  contractType?: string
  metric: 'overdueRate' | 'completionRate' | 'renewalRate' | 'avgExecutionPeriod'
  threshold: number
  channels: Array<'email' | 'app' | 'sms'>
  recipients: string[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PerformanceMetric {
  id: string
  contractId?: string
  contractType?: string
  metric: string
  value: number
  date: string
  isPrediction?: boolean
}

// 合同查询参数
export interface ContractQuery {
  keyword?: string
  status?: string | string[]
  type?: string | string[]
  department?: string
  responsible?: string
  dateRange?: [string, string]
  amount?: [number, number]
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

// 合同统计数据
export interface ContractStatistics {
  total: number
  active: number
  expiring: number
  expired: number
  pending: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  byDepartment: Record<string, number>
  byMonth: Array<{month: string, count: number}>
  totalAmount: number
  averageAmount: number
}

// 条件规则类型
export interface ConditionRule {
  id: string
  name: string
  condition: {
    field: string
    operator: '>' | '<' | '=' | '!=' | 'includes' | 'startsWith' | 'endsWith'
    value: any
  }
  action: {
    type: 'add_approver'
    role: string
    position: number
    name: string
  }
} 