<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, computed } from 'vue'
import { ElTimeline, ElTimelineItem, ElCard, ElButton, ElMessage, ElMessageBox, ElForm, ElFormItem, ElInput } from 'element-plus'
import { Check, Close, ChatDotRound } from '@element-plus/icons-vue'

interface ApprovalStep {
  id: number;
  name: string;
  type: string;
  status: string;
  operator: string;
  operate_time: string;
  comment: string;
}

const props = defineProps<{
  contractId: string;
}>()

const emit = defineEmits<{
  (e: 'status-change', status: string): void;
}>()

const loading = ref(false)
const approvalSteps = ref<ApprovalStep[]>([])
const approvalStatus = ref('draft')
const rejectReason = ref('')
const commentDialogVisible = ref(false)

// 获取审批流程
const fetchApprovalFlow = async (): Promise<void> => {
  try {
    loading.value = true
    
    // 在实际应用中，这里应当从API获取数据
    // const response = await fetch(`/api/contracts/${props.contractId}/approval-flow`)
    // const data = await response.json()
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟数据
    approvalStatus.value = 'pending'
    approvalSteps.value = [
      {
        id: 1,
        name: '起草',
        type: 'create',
        status: 'completed',
        operator: '张三',
        operate_time: '2023-03-15 09:30',
        comment: '合同已创建，请技术部审批'
      },
      {
        id: 2,
        name: '技术部审批',
        type: 'approve',
        status: 'completed',
        operator: '李四',
        operate_time: '2023-03-16 14:25',
        comment: '技术实施方案可行，同意签订'
      },
      {
        id: 3,
        name: '财务部审批',
        type: 'approve',
        status: 'waiting',
        operator: '',
        operate_time: '',
        comment: ''
      },
      {
        id: 4,
        name: '法务部审批',
        type: 'approve',
        status: 'pending',
        operator: '',
        operate_time: '',
        comment: ''
      },
      {
        id: 5,
        name: '总经理审批',
        type: 'approve',
        status: 'pending',
        operator: '',
        operate_time: '',
        comment: ''
      }
    ]
  } catch (error) {
    ElMessage.error('获取审批流程失败')
  } finally {
    loading.value = false
  }
}

// 处理审批
const handleApprove = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm('确认审批通过该合同？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    // 在实际应用中，这里应当调用API批准合同
    // await fetch(`/api/contracts/${props.contractId}/approve`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ comment: '同意' })
    // })
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 找到当前待审批的步骤并更新
    const currentStepIndex = approvalSteps.value.findIndex(step => step.status === 'waiting')
    if (currentStepIndex !== -1) {
      approvalSteps.value[currentStepIndex].status = 'completed'
      approvalSteps.value[currentStepIndex].operator = '当前用户'
      approvalSteps.value[currentStepIndex].operate_time = new Date().toLocaleString()
      approvalSteps.value[currentStepIndex].comment = '同意'
      
      // 如果有下一步，将其状态更新为waiting
      if (currentStepIndex < approvalSteps.value.length - 1) {
        approvalSteps.value[currentStepIndex + 1].status = 'waiting'
      } else {
        // 如果是最后一步，则整个合同审批通过
        approvalStatus.value = 'approved'
        emit('status-change', 'approved')
      }
    }
    
    ElMessage.success('审批通过成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批操作失败')
    }
  }
}

// 处理拒绝
const handleReject = async (): Promise<void> => {
  try {
    commentDialogVisible.value = true
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 确认拒绝
const confirmReject = async (): Promise<void> => {
  try {
    if (!rejectReason.value) {
      ElMessage.warning('请输入拒绝原因')
      return
    }
    
    // 在实际应用中，这里应当调用API拒绝合同
    // await fetch(`/api/contracts/${props.contractId}/reject`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ reason: rejectReason.value })
    // })
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 找到当前待审批的步骤并更新
    const currentStepIndex = approvalSteps.value.findIndex(step => step.status === 'waiting')
    if (currentStepIndex !== -1) {
      approvalSteps.value[currentStepIndex].status = 'rejected'
      approvalSteps.value[currentStepIndex].operator = '当前用户'
      approvalSteps.value[currentStepIndex].operate_time = new Date().toLocaleString()
      approvalSteps.value[currentStepIndex].comment = rejectReason.value
      
      // 更新合同状态
      approvalStatus.value = 'rejected'
      emit('status-change', 'rejected')
    }
    
    ElMessage.success('已拒绝该合同')
    commentDialogVisible.value = false
    rejectReason.value = ''
  } catch (error) {
    ElMessage.error('拒绝操作失败')
  }
}

// 获取状态图标
const getStatusIcon = (status: string): any => {
  if (status === 'completed') return Check
  if (status === 'rejected') return Close
  return ''
}

// 获取状态类型
const getStatusType = (status: string): "success" | "warning" | "info" | "primary" | "danger" | "" => {
  if (status === 'completed') return "success"
  if (status === 'waiting') return "warning"
  if (status === 'rejected') return "danger"
  return "info"
}

// 按钮是否禁用
const isActionDisabled = computed(() => {
  return approvalStatus.value === 'approved' || 
         approvalStatus.value === 'rejected' ||
         !approvalSteps.value.some(step => step.status === 'waiting')
})

onMounted(fetchApprovalFlow)
</script>

<template>
  <div class="approval-flow" v-loading="loading">
    <div class="approval-header">
      <h2>审批流程</h2>
      <div v-if="!isActionDisabled" class="approval-actions">
        <el-button 
          type="success" 
          :icon="Check" 
          @click="handleApprove"
        >
          批准
        </el-button>
        <el-button 
          type="danger" 
          :icon="Close" 
          @click="handleReject"
        >
          拒绝
        </el-button>
      </div>
    </div>
    
    <el-timeline>
      <el-timeline-item
        v-for="step in approvalSteps"
        :key="step.id"
        :type="getStatusType(step.status)"
        :timestamp="step.operate_time || '未处理'"
      >
        <el-card>
          <h4>{{ step.name }}</h4>
          <p v-if="step.status !== 'pending'">
            处理人: {{ step.operator || '未指定' }}
          </p>
          <p v-if="step.comment">
            备注: {{ step.comment }}
          </p>
          <p v-if="step.status === 'waiting'" class="waiting-text">
            等待处理中...
          </p>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    
    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="commentDialogVisible"
      title="拒绝原因"
      width="500"
    >
      <el-form>
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="commentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReject">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.approval-flow {
  padding: 20px;
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.approval-header h2 {
  margin: 0;
}

.approval-actions {
  display: flex;
  gap: 10px;
}

.waiting-text {
  color: #e6a23c;
  font-weight: bold;
}

.el-timeline-item {
  margin-bottom: 20px;
}

.el-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-card h4 {
  margin-top: 0;
  margin-bottom: 12px;
}
</style>