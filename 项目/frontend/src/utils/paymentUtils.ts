// 付款状态类型
export type PaymentStatus = 'pending' | 'paid' | 'overdue'

// 获取状态类型
export const getStatusType = (status: PaymentStatus) => {
  const statusMap: Record<PaymentStatus, string> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
export const getStatusText = (status: PaymentStatus) => {
  const textMap: Record<PaymentStatus, string> = {
    pending: '待付款',
    paid: '已付款',
    overdue: '已逾期'
  }
  return textMap[status] || '未知'
}

// 格式化货币
export const formatCurrency = (amount: number, currency = '¥') => {
  return `${currency}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// 格式化日期
export const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}