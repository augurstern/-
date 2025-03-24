<template>
  <div class="payment-plan-manager">
    <div class="section-header">
      <h3>付款计划管理</h3>
      <div class="header-actions">
        <el-button 
          v-if="!readOnly" 
          type="primary" 
          size="small" 
          @click="addPaymentPlan"
          :icon="Plus"
        >
          添加付款计划
        </el-button>
        <el-button
          type="success"
          size="small"
          @click="exportPaymentPlans"
          :icon="Download"
          :loading="exporting"
        >
          导出付款计划
        </el-button>
      </div>
    </div>

    <el-table 
      :data="paymentPlans" 
      style="width: 100%" 
      border 
      v-loading="loading"
    >
      <el-table-column prop="id" label="序号" width="80" />
      <el-table-column prop="amount" label="付款金额" width="150">
        <template #default="{row}">
          <span v-if="readOnly">{{ formatCurrency(row.amount) }}</span>
          <el-input-number 
            v-else 
            v-model="row.amount" 
            :min="0" 
            :precision="2" 
            size="small" 
            style="width: 120px"
          />
        </template>
      </el-table-column>
      <el-table-column prop="planned_date" label="计划付款日期" width="180">
        <template #default="{row}">
          <span v-if="readOnly">{{ formatDate(row.planned_date) }}</span>
          <el-date-picker 
            v-else 
            v-model="row.planned_date" 
            type="date" 
            placeholder="选择日期" 
            size="small" 
            style="width: 150px"
          />
        </template>
      </el-table-column>
      <el-table-column prop="actual_date" label="实际付款日期" width="180">
        <template #default="{row}">
          <span v-if="readOnly && row.actual_date">{{ formatDate(row.actual_date) }}</span>
          <el-date-picker 
            v-else-if="!readOnly" 
            v-model="row.actual_date" 
            type="date" 
            placeholder="选择日期" 
            size="small" 
            style="width: 150px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{row}">
          <el-tag 
            :type="getStatusType(row.status)" 
            size="small"
          >
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" v-if="!readOnly">
        <template #default="{row, $index}">
          <el-button 
            type="primary" 
            link 
            size="small" 
            @click="markAsPaid(row)"
            v-if="row.status === 'pending'"
          >
            标记为已付款
          </el-button>
          <el-button 
            type="danger" 
            link 
            size="small" 
            @click="removePaymentPlan($index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="payment-summary" v-if="paymentPlans.length > 0">
      <div class="summary-item">
        <span class="label">总付款金额:</span>
        <span class="value">{{ formatCurrency(totalAmount) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">已付款金额:</span>
        <span class="value">{{ formatCurrency(paidAmount) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">未付款金额:</span>
        <span class="value">{{ formatCurrency(unpaidAmount) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">付款进度:</span>
        <el-progress 
          :percentage="paymentProgress" 
          :status="paymentProgress === 100 ? 'success' : ''"
        />
      </div>
    </div>

    <el-empty 
      v-else 
      description="暂无付款计划" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import type { PaymentPlan } from '../types/contract.d.ts'

const props = defineProps<{
  contractId: string
  readOnly?: boolean
  currency?: string
}>()

const emit = defineEmits(['update', 'change'])

// 状态变量
const loading = ref(false)
const exporting = ref(false)
const paymentPlans = ref<PaymentPlan[]>([])

// 获取付款计划
const fetchPaymentPlans = async () => {
  if (!props.contractId) return
  
  try {
    loading.value = true
    const response = await fetch(`/api/contracts/${props.contractId}/payment-plans`)
    if (!response.ok) {
      throw new Error('获取付款计划失败')
    }
    paymentPlans.value = await response.json()
  } catch (error) {
    ElMessage.error('获取付款计划失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 添加付款计划
const addPaymentPlan = async () => {
  try {
    const newPlan = {
      amount: 0,
      planned_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }

    // 验证合同ID
    if (!props.contractId) {
      ElMessage.error('无效的合同ID')
      return
    }
    
    const response = await fetch(`/api/contracts/${props.contractId}/payment-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPlan)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '创建付款计划失败')
    }
    
    await fetchPaymentPlans()
    ElMessage.success('添加付款计划成功')
  } catch (error) {
    console.error('添加付款计划失败:', error)
    ElMessage.error(error.message || '添加付款计划失败')
  }
}

// 删除付款计划
const removePaymentPlan = (index: number) => {
  const plan = paymentPlans.value[index]
  if (!plan) {
    ElMessage.error('无效的付款计划')
    return
  }

  // 检查付款计划状态
  if (plan.status === 'paid') {
    ElMessage.error('已付款的计划不能删除')
    return
  }

  ElMessageBox.confirm(
    '确定要删除该付款计划吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await fetch(`/api/payment-plans/${plan.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('删除付款计划失败')
      }
      
      await fetchPaymentPlans()
      ElMessage.success('删除付款计划成功')
      emit('change', paymentPlans.value)
    } catch (error) {
      console.error('删除付款计划失败:', error)
      ElMessage.error('删除付款计划失败')
    }
  }).catch(() => {})
}

// 标记为已付款
const markAsPaid = async (plan: PaymentPlan) => {
  try {
    if (!plan || !plan.id) {
      ElMessage.error('无效的付款计划')
      return
    }

    if (plan.status === 'paid') {
      ElMessage.warning('该付款计划已完成支付')
      return
    }
    const response = await fetch(`/api/payment-plans/${plan.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actual_payment_date: new Date().toISOString().split('T')[0]
      })
    })
    
    if (!response.ok) {
      throw new Error('更新付款状态失败')
    }
    
    await fetchPaymentPlans()
    ElMessage.success('已标记为已付款')
  } catch (error) {
    console.error('更新付款状态失败:', error)
    ElMessage.error('更新付款状态失败')
  }
}

import { getStatusType, getStatusText, formatCurrency, formatDate } from '../utils/paymentUtils'

import { calculateTotalAmount, calculatePaidAmount, calculateUnpaidAmount, calculatePaymentProgress } from '../utils/contractCalculator'

// 计算总金额
const totalAmount = computed(() => calculateTotalAmount(paymentPlans.value))

// 计算已付款金额
const paidAmount = computed(() => calculatePaidAmount(paymentPlans.value))

// 计算未付款金额
const unpaidAmount = computed(() => calculateUnpaidAmount(paymentPlans.value))

// 计算付款进度
const paymentProgress = computed(() => calculatePaymentProgress(paymentPlans.value))

// 导出付款计划
const exportPaymentPlans = async () => {
  if (!props.contractId) return
  
  try {
    exporting.value = true
    const response = await fetch(`/api/contracts/${props.contractId}/payment-plans/export`)
    
    if (!response.ok) {
      throw new Error('导出付款计划失败')
    }
    
    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition')
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `payment_plans_${props.contractId}.xlsx`
    
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
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 监听合同ID变化
watch(() => props.contractId, () => {
  if (props.contractId) {
    fetchPaymentPlans()
  }
})

// 组件挂载时获取数据
onMounted(() => {
  if (props.contractId) {
    fetchPaymentPlans()
  }
})
</script>

<style scoped>
.payment-plan-manager {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.payment-summary {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.summary-item {
  margin-bottom: 12px;
}

.summary-item .label {
  font-weight: 500;
  margin-right: 8px;
}

.summary-item .value {
  color: #409eff;
  font-weight: 500;
}
</style>