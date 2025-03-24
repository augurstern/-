import type { PaymentPlan } from '../types/contract'

// 计算总金额
export const calculateTotalAmount = (paymentPlans: PaymentPlan[]) => {
  return paymentPlans.reduce((sum, plan) => sum + plan.amount, 0)
}

// 计算已付款金额
export const calculatePaidAmount = (paymentPlans: PaymentPlan[]) => {
  return paymentPlans
    .filter(plan => plan.status === 'paid')
    .reduce((sum, plan) => sum + plan.amount, 0)
}

// 计算未付款金额
export const calculateUnpaidAmount = (paymentPlans: PaymentPlan[]) => {
  const total = calculateTotalAmount(paymentPlans)
  const paid = calculatePaidAmount(paymentPlans)
  return total - paid
}

// 计算付款进度
export const calculatePaymentProgress = (paymentPlans: PaymentPlan[]) => {
  const total = calculateTotalAmount(paymentPlans)
  if (total === 0) return 0
  const paid = calculatePaidAmount(paymentPlans)
  return Math.round((paid / total) * 100)
}