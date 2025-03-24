import { ElMessage } from 'element-plus'
import type { PaymentPlan } from '../types/contract'

// 获取付款计划列表
export const fetchPaymentPlans = async (contractId: string): Promise<PaymentPlan[]> => {
  try {
    const response = await fetch(`/api/contracts/${contractId}/payment-plans`)
    if (!response.ok) {
      throw new Error('获取付款计划失败')
    }
    return await response.json()
  } catch (error) {
    ElMessage.error('获取付款计划失败')
    console.error(error)
    return []
  }
}

// 创建付款计划
export const createPaymentPlan = async (contractId: string, plan: Partial<PaymentPlan>) => {
  try {
    const response = await fetch(`/api/contracts/${contractId}/payment-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(plan)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '创建付款计划失败')
    }
    
    ElMessage.success('添加付款计划成功')
    return true
  } catch (error) {
    console.error('添加付款计划失败:', error)
    ElMessage.error(error.message || '添加付款计划失败')
    return false
  }
}

// 删除付款计划
export const deletePaymentPlan = async (planId: string) => {
  try {
    const response = await fetch(`/api/payment-plans/${planId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('删除付款计划失败')
    }
    
    ElMessage.success('删除付款计划成功')
    return true
  } catch (error) {
    console.error('删除付款计划失败:', error)
    ElMessage.error('删除付款计划失败')
    return false
  }
}

// 更新付款计划状态
export const updatePaymentPlanStatus = async (planId: string, actualPaymentDate: string) => {
  try {
    const response = await fetch(`/api/payment-plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actual_payment_date: actualPaymentDate
      })
    })
    
    if (!response.ok) {
      throw new Error('更新付款状态失败')
    }
    
    ElMessage.success('已标记为已付款')
    return true
  } catch (error) {
    console.error('更新付款状态失败:', error)
    ElMessage.error('更新付款状态失败')
    return false
  }
}

// 导出付款计划
export const exportPaymentPlans = async (contractId: string) => {
  try {
    const response = await fetch(`/api/contracts/${contractId}/payment-plans/export`)
    
    if (!response.ok) {
      throw new Error('导出付款计划失败')
    }
    
    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition')
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `payment_plans_${contractId}.xlsx`
    
    // 下载文件
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
    return true
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
    return false
  }
}