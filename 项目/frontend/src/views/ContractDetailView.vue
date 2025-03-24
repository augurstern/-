<template>
  <div class="contract-detail-container">
    <el-card class="contract-detail-card" v-loading="loading">
      <!-- 头部区域 -->
      <div class="detail-header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/contracts' }">合同管理</el-breadcrumb-item>
            <el-breadcrumb-item>{{ isNewContract ? '新建合同' : contractData.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="actions">
          <el-button v-if="!isEdit && !isNewContract" type="primary" @click="isEdit = true">
            编辑合同
          </el-button>
          <template v-else>
            <el-button type="primary" @click="saveContract">保存</el-button>
            <el-button @click="isNewContract ? router.push('/contracts') : (isEdit = false)">取消</el-button>
          </template>
          
          <el-dropdown v-if="!isNewContract" trigger="click">
            <el-button type="primary" plain>
              更多操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="submitForApproval" :disabled="contractData.approval_status !== 'draft'">
                  提交审批
                </el-dropdown-item>
                <el-dropdown-item divided @click="deleteContract" type="danger">
                  删除合同
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 合同基本信息 -->
      <el-form label-position="top" label-width="120px" class="detail-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="合同标题">
              <el-input v-model="contractData.title" :disabled="!isEdit" placeholder="请输入合同标题" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同编号">
              <el-input v-model="contractData.contract_no" :disabled="!isEdit || !isNewContract" placeholder="系统自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同类型">
              <el-select v-model="contractData.type" :disabled="!isEdit" placeholder="请选择合同类型" style="width: 100%">
                <el-option label="服务合同" value="服务合同" />
                <el-option label="采购合同" value="采购合同" />
                <el-option label="销售合同" value="销售合同" />
                <el-option label="劳务合同" value="劳务合同" />
                <el-option label="租赁合同" value="租赁合同" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="甲方">
              <el-input v-model="contractData.party_a" :disabled="!isEdit" placeholder="请输入甲方名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="乙方">
              <el-input v-model="contractData.party_b" :disabled="!isEdit" placeholder="请输入乙方名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="签署日期">
              <el-date-picker
                v-model="contractData.signed_date"
                :disabled="!isEdit"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="生效日期">
              <el-date-picker
                v-model="contractData.effective_date"
                :disabled="!isEdit"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到期日期">
              <el-date-picker
                v-model="contractData.expiry_date"
                :disabled="!isEdit"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同金额">
              <el-input-number
                v-model="contractData.amount"
                :disabled="!isEdit"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="币种">
              <el-select v-model="contractData.currency" :disabled="!isEdit" placeholder="请选择币种" style="width: 100%">
                <el-option label="人民币" value="CNY" />
                <el-option label="美元" value="USD" />
                <el-option label="欧元" value="EUR" />
                <el-option label="英镑" value="GBP" />
                <el-option label="日元" value="JPY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="contractData.status" :disabled="!isEdit" placeholder="请选择合同状态" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="生效中" value="active" />
                <el-option label="已完成" value="completed" />
                <el-option label="已终止" value="terminated" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="审批状态">
              <el-tag
                :type="
                  contractData.approval_status === 'draft' ? 'info' : 
                  contractData.approval_status === 'pending' ? 'warning' : 
                  contractData.approval_status === 'approved' ? 'success' : 
                  contractData.approval_status === 'rejected' ? 'danger' : 'info'
                "
              >
                {{ 
                  contractData.approval_status === 'draft' ? '草稿' : 
                  contractData.approval_status === 'pending' ? '审批中' : 
                  contractData.approval_status === 'approved' ? '已批准' : 
                  contractData.approval_status === 'rejected' ? '已拒绝' : '未知'
                }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="标签">
              <el-tag
                v-for="tag in contractData.tags"
                :key="tag"
                closable
                :disable-transitions="false"
                @close="contractData.tags.splice(contractData.tags.indexOf(tag), 1)"
                :disabled="!isEdit"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="isEdit"
                v-model="inputValue"
                class="tag-input"
                size="small"
                @keyup.enter="
                  inputValue && contractData.tags.push(inputValue);
                  inputValue = '';
                "
                placeholder="请输入标签并回车"
              />
              <el-button v-if="isEdit" class="button-new-tag" size="small" @click="showInput">
                + 添加标签
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="contractData.notes"
                :disabled="!isEdit"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 标签页内容 -->
      <el-tabs v-model="activeTab" type="border-card" class="contract-tabs">
        <el-tab-pane label="合同正文" name="content">
          <ContractEditor
            v-model="contractData.content"
            :approval-status="contractData.approval_status"
            :contract-data="contractData"
            @save="updateContent"
          />
        </el-tab-pane>
        
        <el-tab-pane label="付款计划" name="payment">
          <PaymentPlanManager
            :contractId="contractId"
            :readOnly="!isEdit"
            :currency="contractData.currency"
            @change="handlePaymentPlanChange"
          />
        </el-tab-pane>
        
        <el-tab-pane label="审批流程" name="approval">
          <div class="approval-section">
            <h3>审批历史</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in approvalHistory"
                :key="activity.id"
                :type="
                  activity.status === 'rejected' ? 'danger' : 
                  activity.status === 'approved' ? 'success' : 'primary'
                "
                :timestamp="activity.date"
              >
                <h4>{{ activity.user }} - {{ activity.action }}</h4>
                <p>{{ activity.comments }}</p>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 附件上传标签页 -->
      <el-tab-pane label="合同附件" name="attachments">
        <div class="attachments-section">
          <el-upload
            :action="`/api/contracts/${contractId}/attachments`"
            :headers="uploadHeaders"
            :file-list="contractData.attachments"
            :on-success="handleUploadSuccess"
            :disabled="!isEdit"
            multiple
          >
            <el-button :disabled="!isEdit" type="primary">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持上传任意类型文件，单个文件不超过10MB</div>
            </template>
          </el-upload>
        </div>
      </el-tab-pane>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import ContractEditor from '../components/ContractEditor.vue'
import PaymentPlanManager from '../components/PaymentPlanManager.vue'
import { useAuthStore } from '../stores/auth'

// 模拟的合同API
const contractApi = {
  getContractById: (id: string) => Promise.resolve({ data: {} }),
  createContract: (data: any) => Promise.resolve({ data: {} }),
  updateContract: (id: string, data: any) => Promise.resolve({ data: {} }),
  deleteContract: (id: string) => Promise.resolve({ data: {} }),
  submitForApproval: (id: string) => Promise.resolve({ data: {} })
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 合同ID
const contractId = computed(() => {
  return route.params.id as string
})

// 是否是新建合同
const isNewContract = computed(() => {
  return contractId.value === 'new'
})

// 是否处于编辑模式
const isEdit = ref(false)

// 加载状态
const loading = ref(true)

// 当前激活的标签页
const activeTab = ref('content')

// 标签输入相关
const inputValue = ref('')
const showInput = () => {
  inputValue.value = ''
  // 这里可以实现自动聚焦输入框的逻辑
  setTimeout(() => {
    const inputElement = document.querySelector('.tag-input input')
    if (inputElement) {
      (inputElement as HTMLInputElement).focus()
    }
  }, 10)
}

// 合同数据
const contractData = reactive({
  id: '',
  contract_no: '',
  title: '',
  type: '',
  party_a: '',
  party_b: '',
  signed_date: '',
  effective_date: '',
  expiry_date: '',
  amount: 0,
  currency: 'CNY',
  status: 'draft',
  content: '',
  created_by: '',
  created_at: '',
  updated_at: '',
  attachments: [] as any[],
  notes: '',
  approval_status: 'draft',
  tags: [] as string[],
  payment_plans: [] as any[],
  payment_cycle: 30
})

// 审批历史
const approvalHistory = ref([
  { id: 1, user: '张经理', action: '提交审批', status: 'submitted', comments: '请审核', date: '2023-08-15 10:30:22' },
  { id: 2, user: '李总监', action: '审批', status: 'approved', comments: '内容无误，同意', date: '2023-08-16 14:20:11' },
  { id: 3, user: '财务部', action: '审批', status: 'approved', comments: '财务审核通过', date: '2023-08-17 09:45:33' }
])

// 文件上传配置
const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

// 获取合同数据
const fetchContractData = async () => {
  if (isNewContract.value) {
    loading.value = false
    isEdit.value = true
    return
  }
  
  try {
    loading.value = true
    // 在实际环境中，应该调用API获取真实数据
    // const { data } = await contractApi.getContractById(contractId.value)
    
    // 使用模拟数据
    setTimeout(() => {
      Object.assign(contractData, {
        id: contractId.value,
        contract_no: `HT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        title: '软件开发服务合同',
        type: '服务合同',
        party_a: '某某科技有限公司',
        party_b: '某某软件开发有限公司',
        signed_date: '2023-08-10',
        effective_date: '2023-08-15',
        expiry_date: '2024-08-14',
        amount: 120000,
        currency: 'CNY',
        status: 'active',
        content: '甲方：某某科技有限公司\n乙方：某某软件开发有限公司\n\n一、服务内容\n乙方同意根据本合同的条款和条件为甲方提供软件开发服务，包括但不限于：\n1. 需求分析和系统设计\n2. 软件编码和开发\n3. 测试和质量保证\n4. 实施和部署\n5. 培训和技术支持\n\n二、合同金额\n合同总金额为人民币120,000元整，支付方式如下：\n1. 合同签订后7个工作日内，甲方支付合同总金额的30%作为预付款；\n2. 项目验收通过后，甲方支付合同总金额的70%。\n\n三、知识产权\n乙方为甲方开发的所有软件及相关文档的知识产权归甲方所有。',
        created_by: '王经理',
        created_at: '2023-08-10 09:15:40',
        updated_at: '2023-08-10 09:15:40',
        attachments: [],
        notes: '重要客户，优先处理',
        approval_status: 'approved',
        tags: ['软件开发', '服务合同', '重要']
      })
      loading.value = false
    }, 600)
  } catch (error) {
    ElMessage.error('获取合同信息失败')
    loading.value = false
  }
}

// 保存合同
const saveContract = async () => {
  try {
    loading.value = true
    
    // 验证表单
    if (!contractData.title || !contractData.party_a || !contractData.party_b) {
      ElMessage.warning('请填写合同必填信息')
      loading.value = false
      return
    }
    
    // 在实际环境中，应该调用API保存数据
    // const { data } = isNewContract.value 
    //   ? await contractApi.createContract(contractData)
    //   : await contractApi.updateContract(contractId.value, contractData)
    
    // 使用模拟数据
    setTimeout(() => {
      if (isNewContract.value) {
        ElMessage.success('合同创建成功')
        // 跳转到合同列表页
        router.push('/contracts')
      } else {
        ElMessage.success('合同更新成功')
        isEdit.value = false
      }
      loading.value = false
    }, 600)
  } catch (error) {
    ElMessage.error('保存合同失败')
    loading.value = false
  }
}

// 删除合同
const deleteContract = async () => {
  try {
    await ElMessageBox.confirm('确定要删除此合同吗？此操作不可逆。', '删除合同', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    
    // 在实际环境中，应该调用API删除数据
    // await contractApi.deleteContract(contractId.value)
    
    // 使用模拟数据
    setTimeout(() => {
      ElMessage.success('合同已删除')
      // 跳转到合同列表页
      router.push('/contracts')
      loading.value = false
    }, 600)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除合同失败')
    }
    loading.value = false
  }
}

// 提交审批
const submitForApproval = async () => {
  try {
    loading.value = true
    
    // 在实际环境中，应该调用API提交审批
    // await contractApi.submitForApproval(contractId.value)
    
    // 使用模拟数据
    setTimeout(() => {
      contractData.approval_status = 'pending'
      ElMessage.success('合同已提交审批')
      loading.value = false
    }, 600)
  } catch (error) {
    ElMessage.error('提交审批失败')
    loading.value = false
  }
}

// 上传附件成功回调
const handleUploadSuccess = (response: any) => {
  if (response.success) {
    ElMessage.success('附件上传成功')
    // 添加新上传的附件到列表
    contractData.attachments.push(response.data)
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 内容更新
const updateContent = (content: string) => {
  contractData.content = content
}

// 处理支付计划变更
const handlePaymentPlanChange = (plans: any[]) => {
  contractData.payment_plans = plans
  // 在实际应用中，这里可能需要调用API保存支付计划数据
  ElMessage.success('付款计划已更新')
}

// 格式化金额显示
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount)
}

// 初始化
onMounted(() => {
  fetchContractData()
})
</script>

<style scoped>
.contract-detail-container {
  padding: 20px;
}

.contract-detail-card {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 10px;
}

.detail-form {
  margin-bottom: 24px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-input {
  width: 90px;
  margin-right: 8px;
  vertical-align: bottom;
}

.button-new-tag {
  vertical-align: bottom;
}

.attachments-section {
  margin-bottom: 24px;
}

.contract-tabs {
  margin-top: 20px;
  margin-bottom: 20px;
}

.approval-section {
  padding: 16px;
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>