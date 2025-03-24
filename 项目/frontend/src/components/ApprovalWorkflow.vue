<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useContractStore } from '../stores/contract'
import { useAuthStore } from '../stores/auth'
import type { Contract, ApprovalStep } from '../types/contract.d.ts'
import { 
  Document, 
  Select, 
  CircleCheck, 
  List, 
  DocumentChecked 
} from '@element-plus/icons-vue'

const props = defineProps<{
  contractId: string | null
  readOnly?: boolean
  status: string
  approvalList: any[]
  canApprove: boolean
}>()

const contractStore = useContractStore()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const emit = defineEmits(['status-changed', 'approve', 'reject'])

const loading = ref(false)
const approvalSteps = ref<any[]>([])
const contract = ref<Contract | null>(null)
const approvalComment = ref('')
const selectedCommentTemplate = ref('')

// 审批状态
const approvalStatus = computed(() => contract.value?.status || 'draft')

// 条件规则配置
const conditionRules = ref([
  {
    id: 'rule1',
    name: '大额合同审批',
    condition: {
      field: 'amount',
      operator: '>',
      value: 50000
    },
    action: {
      type: 'add_approver',
      role: 'finance_manager',
      position: 2,
      name: '财务经理'
    }
  },
  {
    id: 'rule2',
    name: '长期合同审批',
    condition: {
      field: 'endDate',
      operator: '>',
      value: '1year'
    },
    action: {
      type: 'add_approver',
      role: 'legal_director',
      position: 3,
      name: '法务总监'
    }
  },
  {
    id: 'rule3',
    name: '重要客户合同审批',
    condition: {
      field: 'partyName',
      operator: 'includes',
      value: ['重要客户1', '重要客户2', '重要客户3']
    },
    action: {
      type: 'add_approver',
      role: 'ceo',
      position: -1,
      name: '总经理'
    }
  }
])

// 预定义审批意见模板
const commentTemplates = ref([
  { id: 'template1', text: '同意，请按照合同条款执行。' },
  { id: 'template2', text: '同意，但请注意合同中的风险点。' },
  { id: 'template3', text: '条款基本合理，建议增加违约责任条款。' },
  { id: 'template4', text: '金额核算有误，请修改后重新提交。' },
  { id: 'template5', text: '不同意，合同条款对我方显失公平。' }
])

// 当前用户是否是审批人
const isCurrentApprover = computed(() => {
  if (!approvalSteps.value.length || !currentUser.value) return false

  const currentStep = approvalSteps.value.find(
    step => step.status === 'pending'
  )
  
  return currentStep && currentStep.approverId === currentUser.value.id
})

// 下一个审批人
const nextApprover = computed(() => {
  if (!approvalSteps.value.length) return null

  return approvalSteps.value.find(step => step.status === 'pending')
})

// 将合同状态限定为有效的类型值
const isValidStatus = (status: string): status is Contract['status'] => {
  return ['draft', 'in_approval', 'approved', 'rejected', 'completed', 'terminated'].includes(status)
}

// 获取合同信息
const fetchContract = async () => {
  if (!props.contractId) return
  
  try {
    loading.value = true
    const response = await contractStore.fetchContractById(props.contractId)
    
    // 处理可能的响应格式，使用类型断言解决类型冲突
    if (response) {
      const contractData = 'data' in response ? response.data : response
      
      // 使用类型断言解决类型冲突
      contract.value = contractData as unknown as Contract
    }
  } catch (error) {
    ElMessage.error('获取合同信息失败')
  } finally {
    loading.value = false
  }
}

// 获取审批流程 - 模拟实现，真实环境需要后端API支持
const fetchApprovalSteps = async () => {
  if (!props.contractId) return
  
  try {
    loading.value = true
    // 使用props中传入的审批列表
    approvalSteps.value = [...props.approvalList]
    
    // 应用条件规则
    if (contract.value && contract.value.status === 'draft') {
      applyConditionRules()
    }
  } catch (error) {
    ElMessage.error('获取审批流程失败')
  } finally {
    loading.value = false
  }
}

// 应用条件规则
const applyConditionRules = () => {
  if (!contract.value) return
  
  // 深拷贝审批步骤，避免直接修改
  const updatedSteps = [...approvalSteps.value]
  
  // 评估每个规则
  conditionRules.value.forEach(rule => {
    const isRuleTriggered = evaluateCondition(rule.condition, contract.value)
    
    if (isRuleTriggered) {
      // 根据规则添加审批人
      const action = rule.action
      
      if (action.type === 'add_approver') {
        const newApprover = {
          id: `temp_${Date.now()}`,
          contractId: props.contractId,
          approverId: '', // 将由系统根据角色分配
          approverName: action.name,
          approverRole: action.role,
          status: 'pending',
          comment: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // 根据position决定插入位置
        if (action.position === -1) {
          // 添加到末尾
          updatedSteps.push(newApprover)
        } else {
          // 插入到指定位置
          updatedSteps.splice(Math.min(action.position, updatedSteps.length), 0, newApprover)
        }
      }
    }
  })
  
  // 如果有变化，更新审批步骤
  if (JSON.stringify(updatedSteps) !== JSON.stringify(approvalSteps.value)) {
    approvalSteps.value = updatedSteps
    saveUpdatedWorkflow()
  }
}

// 评估条件
const evaluateCondition = (condition: any, contract: Contract) => {
  const fieldValue = getContractFieldValue(condition.field, contract)
  
  switch (condition.operator) {
    case '>':
      return Number(fieldValue) > Number(condition.value)
    case '<':
      return Number(fieldValue) < Number(condition.value)
    case '=':
      return fieldValue === condition.value
    case '!=':
      return fieldValue !== condition.value
    case 'includes':
      if (Array.isArray(condition.value)) {
        return condition.value.includes(fieldValue)
      }
      return String(fieldValue).includes(String(condition.value))
    case 'startsWith':
      return String(fieldValue).startsWith(String(condition.value))
    case 'endsWith':
      return String(fieldValue).endsWith(String(condition.value))
    default:
      return false
  }
}

// 获取合同字段值
const getContractFieldValue = (field: string, contract: Contract) => {
  switch (field) {
    case 'amount':
      return contract.amount
    case 'partyName':
      return contract.partyName
    case 'startDate':
      return contract.startDate
    case 'endDate':
      return contract.endDate
    case 'type':
      return contract.type
    default:
      return ''
  }
}

// 保存更新后的工作流 - 模拟实现
const saveUpdatedWorkflow = async () => {
  if (!props.contractId) return
  
  try {
    loading.value = true
    // 模拟API调用
    console.log('保存审批工作流:', approvalSteps.value)
    // 在真实环境中这里应该调用后端API
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    ElMessage.error('更新审批流程失败')
  } finally {
    loading.value = false
  }
}

// 提交审批
const submitApproval = async (isApproved: boolean) => {
  if (!approvalComment.value) {
    ElMessage.warning('请填写审批意见')
    return
  }
  
  if (!isCurrentApprover.value) {
    ElMessage.warning('您不是当前审批人')
    return
  }
  
  try {
    loading.value = true
    
    // 查找当前审批步骤
    const currentStepIndex = approvalSteps.value.findIndex(
      step => step.status === 'pending'
    )
    
    if (currentStepIndex === -1) {
      ElMessage.warning('找不到当前审批步骤')
      return
    }
    
    // 更新审批状态
    const updatedStep = {
      ...approvalSteps.value[currentStepIndex],
      status: isApproved ? 'approved' : 'rejected',
      comment: approvalComment.value,
      updatedAt: new Date().toISOString()
    }
    
    // 更新步骤
    const updatedSteps = [...approvalSteps.value]
    updatedSteps[currentStepIndex] = updatedStep
    
    // 判断合同最终状态
    let finalContractStatus = contract.value?.status
    
    if (!isApproved) {
      // 拒绝则整个合同被拒绝
      finalContractStatus = 'rejected'
    } else if (currentStepIndex === approvalSteps.value.length - 1) {
      // 最后一步且通过，则整个合同通过
      finalContractStatus = 'approved'
    } else {
      // 中间步骤通过，状态保持审批中
      finalContractStatus = 'in_approval'
    }
    
    // 保存审批结果 - 这里是模拟实现
    console.log('更新审批步骤:', updatedStep)
    // 在真实环境中这里应该调用后端API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新合同状态
    if (finalContractStatus !== contract.value?.status && contract.value) {
      // 只更新状态字段，使用类型断言避免类型冲突
      await contractStore.updateContract(props.contractId as string, {
        status: finalContractStatus
      } as any)
      emit('status-changed', finalContractStatus)
    }
    
    // 重新加载数据
    await Promise.all([fetchContract(), fetchApprovalSteps()])
    
    // 清空评论
    approvalComment.value = ''
    selectedCommentTemplate.value = ''
    
    ElMessage.success(isApproved ? '已批准' : '已拒绝')
  } catch (error) {
    ElMessage.error('处理审批失败')
  } finally {
    loading.value = false
  }
}

// 提交合同进入审批流程
const submitContract = async () => {
  if (!props.contractId || !contract.value) return
  
  if (contract.value.status !== 'draft') {
    ElMessage.warning('只有草稿状态的合同可以提交审批')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要提交此合同进入审批流程吗？', '提交确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    loading.value = true
    
    // 保存当前工作流
    await saveUpdatedWorkflow()
    
    // 更新合同状态为审批中
    if (contract.value) {
      // 只更新状态字段，使用类型断言避免类型冲突
      await contractStore.updateContract(props.contractId, {
        status: 'in_approval'
      } as any)
    }
    emit('status-changed', 'in_approval')
    
    // 重新加载数据
    await Promise.all([fetchContract(), fetchApprovalSteps()])
    
    ElMessage.success('合同已提交审批')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交审批失败')
    }
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  if (props.contractId) {
    await Promise.all([fetchContract(), fetchApprovalSteps()])
  }
})

// 监听合同ID变化
watch(() => props.contractId, async (newId) => {
  if (newId) {
    await Promise.all([fetchContract(), fetchApprovalSteps()])
  } else {
    contract.value = null
    approvalSteps.value = []
  }
})

// 使用预设模板填充审批意见
watch(() => selectedCommentTemplate.value, (newTemplate) => {
  if (newTemplate) {
    const template = commentTemplates.value.find(t => t.id === newTemplate)
    if (template) {
      approvalComment.value = template.text
    }
  }
})

// 审批步骤的激活状态
const activeStep = computed(() => {
  switch (props.status) {
    case 'draft': return 0
    case 'pending': return 1
    case 'approved': return 2
    case 'active': return 3
    case 'completed': return 4
    case 'terminated': 
    case 'rejected': return 1 // 拒绝也停留在第一步
    default: return 0
  }
})

// 当前状态对应的标签类型
const statusTagType = computed(() => {
  switch (props.status) {
    case 'draft': return 'info'
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'active': return 'success'
    case 'completed': return 'success'
    case 'terminated': return 'danger'
    case 'rejected': return 'danger'
    default: return 'info'
  }
})

// 当前状态文本
const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '审批中',
    'approved': '已批准',
    'active': '已生效',
    'completed': '已完成',
    'terminated': '已终止',
    'rejected': '已拒绝'
  }
  return statusMap[props.status] || '未知状态'
})

// 是否显示审批操作按钮
const showApprovalActions = computed(() => {
  return props.canApprove && props.status === 'pending'
})

// 批准合同操作
const handleApprove = async () => {
  try {
    const result = await ElMessageBox.confirm('确认批准此合同？', '确认', {
      confirmButtonText: '确认批准',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    if (result) {
      loading.value = true
      emit('approve', {
        contractId: props.contractId,
        comment: approvalComment.value
      })
    }
  } catch (error) {
    // 用户取消操作
  } finally {
    loading.value = false
  }
}

// 拒绝合同操作
const handleReject = async () => {
  if (!approvalComment.value.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  
  try {
    const result = await ElMessageBox.confirm('确认拒绝此合同？', '确认', {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    if (result) {
      loading.value = true
      emit('reject', {
        contractId: props.contractId,
        comment: approvalComment.value
      })
    }
  } catch (error) {
    // 用户取消操作
  } finally {
    loading.value = false
  }
}

// 获取时间线项目类型
const getTimelineItemType = (status: string) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'pending': return 'warning'
    default: return 'primary'
  }
}

// 获取时间线项目颜色
const getTimelineItemColor = (status: string) => {
  switch (status) {
    case 'approved': return '#67C23A'
    case 'rejected': return '#F56C6C'
    case 'pending': return '#E6A23C'
    default: return '#409EFF'
  }
}

// 获取时间线项目大小
const getTimelineItemSize = (status: string) => {
  return status === 'pending' ? 'large' : 'normal'
}

// 获取审批操作文本
const getApprovalActionText = (status: string) => {
  switch (status) {
    case 'approved': return '审批通过'
    case 'rejected': return '审批拒绝'
    case 'pending': return '等待审批'
    default: return '未知操作'
  }
}

// 获取审批状态标签类型
const getApprovalTagType = (status: string) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'pending': return 'warning'
    default: return 'info'
  }
}

// 获取审批状态文本
const getApprovalStatusText = (status: string) => {
  switch (status) {
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'pending': return '待审批'
    default: return '未知'
  }
}
</script>

<template>
  <div class="approval-workflow-container">
    <div class="workflow-header">
      <h3>合同审批工作流</h3>
      <el-tag v-if="status" :type="statusTagType" size="large">
        {{ statusText }}
      </el-tag>
    </div>

    <div class="workflow-content">
      <!-- 流程图 -->
      <div class="workflow-steps">
        <el-steps :active="activeStep" finish-status="success" :space="200" class="workflow-steps-container">
          <el-step title="创建合同" description="草稿状态" :icon="Document"></el-step>
          <el-step title="提交审批" description="等待审批" :icon="Select"></el-step>
          <el-step title="审批通过" description="合同生效" :icon="CircleCheck"></el-step>
          <el-step title="合同执行" description="执行阶段" :icon="List"></el-step>
          <el-step title="合同归档" description="完成归档" :icon="DocumentChecked"></el-step>
        </el-steps>
      </div>

      <!-- 审批人列表 -->
      <div class="approvers-list" v-if="approvalList.length > 0">
        <h4>审批流程</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(approval, index) in approvalList"
            :key="index"
            :type="getTimelineItemType(approval.status)"
            :color="getTimelineItemColor(approval.status)"
            :size="getTimelineItemSize(approval.status)"
            :timestamp="approval.timestamp"
          >
            <div class="timeline-content">
              <div class="timeline-user">
                <el-avatar :size="32" :src="approval.avatar"></el-avatar>
                <span class="timeline-username">{{ approval.username }}</span>
                <span class="timeline-role">{{ approval.role }}</span>
              </div>
              <div class="timeline-info">
                <div class="timeline-title">
                  {{ getApprovalActionText(approval.status) }}
                  <el-tag v-if="approval.status" size="small" :type="getApprovalTagType(approval.status)">
                    {{ getApprovalStatusText(approval.status) }}
                  </el-tag>
                </div>
                <div class="timeline-comment" v-if="approval.comment">{{ approval.comment }}</div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 审批操作区域 -->
      <div class="approval-actions" v-if="showApprovalActions">
        <div class="approval-comment">
          <el-input
            v-model="approvalComment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见（选填）"
            maxlength="200"
            show-word-limit
          ></el-input>
        </div>
        <div class="action-buttons">
          <el-button 
            type="success" 
            icon="Check" 
            :loading="loading"
            @click="handleApprove"
          >
            批准
          </el-button>
          <el-button 
            type="danger" 
            icon="Close" 
            :loading="loading"
            @click="handleReject"
          >
            拒绝
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.approval-workflow-container {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  margin-bottom: 20px;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.workflow-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.workflow-steps {
  margin: 30px 0;
  overflow-x: auto;
}

.workflow-steps-container {
  min-width: 650px;
}

.approvers-list {
  margin-top: 30px;
}

.approvers-list h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.timeline-content {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
}

.timeline-user {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-username {
  margin-left: 10px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.timeline-role {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}

.timeline-info {
  margin-left: 42px;
}

.timeline-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 5px;
}

.timeline-title .el-tag {
  margin-left: 8px;
}

.timeline-comment {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.approval-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed var(--el-border-color);
}

.approval-comment {
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .workflow-steps {
    margin: 15px 0;
  }
  
  .timeline-user {
    flex-wrap: wrap;
  }
  
  .timeline-role {
    margin-left: 42px;
    margin-top: 5px;
  }
}
</style> 