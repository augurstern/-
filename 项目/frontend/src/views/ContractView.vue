<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract'
import { useAuthStore } from '../stores/auth'
import { 
  ElMessage, 
  ElMessageBox, 
  ElDescriptions, 
  ElDescriptionsItem,
  ElButton,
  ElTabs,
  ElTabPane,
  ElInput,
  ElDialog,
  ElForm,
  ElFormItem,
  ElTag,
  ElTable,
  ElTableColumn,
  ElUpload,
  ElDatePicker,
  ElInputNumber,
  ElSelect,
  ElOption
} from 'element-plus'
import { 
  EditPen, 
  Delete, 
  Download, 
  Back, 
  Check, 
  Close, 
  Document, 
  DocumentAdd, 
  Share, 
  Printer,
  Plus
} from '@element-plus/icons-vue'
import type { UploadFile, UploadUserFile } from 'element-plus'
import type { ContractType, ContractStatus, Contract, Attachment } from '../api/contract'
import ContractEditor from '../components/ContractEditor.vue'
import ApprovalFlow from '../components/ApprovalFlow.vue'
import ContractIntegrator from '../components/ContractIntegrator.vue'
import PerformanceMonitor from '../components/PerformanceMonitor.vue'
import ApprovalWorkflow from '../components/ApprovalWorkflow.vue'

const route = useRoute()
const router = useRouter()
const contractStore = useContractStore()
const authStore = useAuthStore()

// 状态变量
const loading = ref(false)
const activeTab = ref('details')
const contractContent = ref('')
const fileList = ref<UploadUserFile[]>([])
const terminateReason = ref('')
const terminateDialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const editMode = ref(false)
const uploadLoading = ref(false)
const mode = ref('view') // view, edit, template
const showHistoryDialog = ref(false)
const historyRecords = ref<any[]>([])
const queryParams = reactive({
  keyword: '',
  status: ''
})

// 获取合同ID
const contractId = computed(() => route.params.id as string)

// 合同的状态标签样式
const statusTagType = computed(() => {
  const status = contractStore.currentContract?.status
  switch (status) {
    case 'draft': return 'info'
    case 'pending': return 'warning'
    case 'active': return 'success'
    case 'completed': return 'success'
    case 'terminated': return 'danger'
    case 'expired': return 'danger'
    default: return 'info'
  }
})

// 合同状态名称
const statusNameMap: Record<string, string> = {
  'draft': '草稿',
  'in_approval': '审批中',
  'approved': '已批准',
  'rejected': '已拒绝',
  'completed': '已完成',
  'terminated': '已终止'
}

// 合同类型名称
const typeNameMap: Record<string, string> = {
  'sales': '销售合同',
  'purchase': '采购合同',
  'service': '服务合同',
  'employment': '劳动合同',
  'lease': '租赁合同',
  'other': '其他'
}

// 表单数据
const formData = reactive<Partial<Contract>>({
  title: '',
  contractNumber: '',
  type: 'sales',
  partyName: '',
  amount: 0,
  startDate: '',
  endDate: '',
  content: ''
})

// 更新表单数据
const updateFormData = () => {
  if (contractStore.currentContract) {
    const contract = contractStore.currentContract
    formData.title = contract.title
    formData.contractNumber = contract.contractNumber
    formData.type = contract.type
    formData.partyName = contract.partyName
    formData.amount = contract.amount
    formData.startDate = contract.startDate
    formData.endDate = contract.endDate
    formData.content = contract.content
  }
}

// 处理附件类型
const getFileList = (attachments: any[] | undefined) => {
  if (!attachments || !Array.isArray(attachments)) return [];
  
  return attachments.map(attachment => ({
    name: typeof attachment === 'string' ? attachment : attachment.name || 'unnamed',
    url: typeof attachment === 'string' ? attachment : attachment.url || '',
    uid: typeof attachment === 'string' ? attachment : attachment.id || Date.now().toString()
  }));
}

// 获取合同详情
const fetchContractDetail = async () => {
  try {
    loading.value = true
    await contractStore.fetchContractById(contractId.value)
    
    // 更新表单数据
    updateFormData()
    
    // 更新附件列表 - 添加类型处理
    if (contractStore.currentContract?.attachments) {
      fileList.value = getFileList(contractStore.currentContract.attachments);
    }
  } catch (error) {
    ElMessage.error('获取合同详情失败')
  } finally {
    loading.value = false
  }
}

// 保存合同
const saveContract = async () => {
  try {
    loading.value = true
    
    if (!contractId.value || contractId.value === 'new') {
      // 创建新合同
      await contractStore.createContract({
        ...formData as any,
        status: 'draft' as ContractStatus
      })
      ElMessage.success('合同创建成功')
      router.push(`/contracts/${contractStore.currentContract?.id}`)
    } else {
      // 更新现有合同
      await contractStore.updateContract(contractId.value, formData)
      ElMessage.success('合同更新成功')
      editMode.value = false
    }
  } catch (error) {
    ElMessage.error('保存合同失败')
  } finally {
    loading.value = false
  }
}

// 删除合同
const deleteContract = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该合同吗？此操作不可逆', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const success = await contractStore.deleteContract(contractId.value)
    
    if (success) {
      ElMessage.success('合同已删除')
      router.push('/contracts')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除合同失败')
    }
  } finally {
    loading.value = false
  }
}

// 提交审批
const submitForApproval = async () => {
  try {
    await ElMessageBox.confirm('确定要提交此合同进行审批吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    loading.value = true
    const result = await contractStore.submitForApproval(contractId.value)
    
    if (result) {
      ElMessage.success('合同已提交审批')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交审批失败')
    }
  } finally {
    loading.value = false
  }
}

// 批准合同
const approveContract = async () => {
  try {
    await ElMessageBox.confirm('确认批准此合同？', '确认', {
      confirmButtonText: '批准',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    loading.value = true
    const result = await contractStore.approveContract(contractId.value, true)
    
    if (result) {
      ElMessage.success('合同已批准')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批准失败')
    }
  } finally {
    loading.value = false
  }
}

// 拒绝合同
const rejectContract = async () => {
  try {
    const comment = await ElMessageBox.prompt('请输入拒绝原因', '拒绝', {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      inputPattern: /\S/,
      inputErrorMessage: '拒绝原因不能为空'
    })
    
    loading.value = true
    const result = await contractStore.approveContract(contractId.value, false, comment.value)
    
    if (result) {
      ElMessage.success('合同已拒绝')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    loading.value = false
  }
}

// 显示终止对话框
const showTerminateDialog = () => {
  terminateDialogVisible.value = true
}

// 终止合同
const terminateContract = async () => {
  if (!terminateReason.value) {
    ElMessage.warning('请输入终止原因')
    return
  }
  
  try {
    loading.value = true
    const result = await contractStore.terminateContract(contractId.value, terminateReason.value)
    
    if (result) {
      ElMessage.success('合同已终止')
      terminateDialogVisible.value = false
      terminateReason.value = ''
    }
  } catch (error) {
    ElMessage.error('终止合同失败')
  } finally {
    loading.value = false
  }
}

// 导出合同
const exportContract = async (format: 'pdf' | 'docx' = 'pdf') => {
  try {
    loading.value = true
    await contractStore.exportContract(contractId.value, format)
    ElMessage.success(`合同已导出为${format.toUpperCase()}格式`)
  } catch (error) {
    ElMessage.error('导出合同失败')
  } finally {
    loading.value = false
  }
}

// 删除附件
const handleRemoveAttachment = async (file: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该附件吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const attachmentId = file.uid || '';
    
    // 使用契约化代码处理API调用未实现的情况
    if (typeof contractStore.deleteAttachment !== 'function') {
      console.warn('deleteAttachment方法未实现，这是模拟删除');
      fileList.value = fileList.value.filter(f => f.uid !== attachmentId);
      ElMessage.success('附件已删除');
      return true;
    }
    
    const success = await contractStore.deleteAttachment(contractId.value, attachmentId);
    
    if (success) {
      ElMessage.success('附件已删除');
      fileList.value = fileList.value.filter(f => f.uid !== attachmentId);
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除附件失败');
    }
  }
}

// 上传附件处理
const handleFileUpload = async (file: File) => {
  try {
    uploadLoading.value = true;
    
    // 使用契约化代码处理API调用未实现的情况
    if (typeof contractStore.uploadAttachment !== 'function') {
      console.warn('uploadAttachment方法未实现，这是模拟上传');
      
      // 模拟上传结果
      const fakeAttachment = {
        name: file.name,
        url: URL.createObjectURL(file),
        uid: Date.now().toString()
      };
      
      fileList.value.push(fakeAttachment);
      ElMessage.success('附件上传成功（模拟）');
      uploadDialogVisible.value = false;
      return false;
    }
    
    const attachment = await contractStore.uploadAttachment(contractId.value, file);
    
    if (attachment) {
      ElMessage.success('附件上传成功');
      uploadDialogVisible.value = false;
      await fetchContractDetail();
    }
  } catch (error) {
    ElMessage.error('上传附件失败');
  } finally {
    uploadLoading.value = false;
  }
  return false; // 阻止默认上传行为
}

// 修改文件上传相关方法
const handleAvatarSuccess = (response: any, uploadFile: any) => {
  // 处理文件上传成功
  if (response && response.url) {
    const fileObj = {
      name: uploadFile.name,
      url: response.url,
      uid: String(Date.now())
    };
    fileList.value.push(fileObj);
  }
};

// 返回列表
const goBack = () => {
  router.push('/contracts')
}

// 监听路由变化，重新获取合同详情
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchContractDetail()
  }
})

// 是否可编辑
const canEdit = computed(() => {
  const contract = contractStore.currentContract
  return contract && (contract.status === 'draft' || 
         (authStore.userRole === 'admin' && contract.status !== 'terminated'))
})

// 是否可提交审批
const canSubmitForApproval = computed(() => {
  const contract = contractStore.currentContract
  return contract && contract.status === 'draft'
})

// 是否可审批
const canApprove = computed(() => {
  const contract = contractStore.currentContract
  return contract && contract.status === 'pending' && 
         (authStore.userRole === 'admin' || authStore.userRole === 'manager')
})

// 是否可终止合同
const canTerminate = computed(() => {
  const contract = contractStore.currentContract
  return contract && (contract.status === 'active' || contract.status === 'pending') && 
         (authStore.userRole === 'admin' || authStore.userRole === 'manager')
})

// 组件加载时获取合同详情
onMounted(fetchContractDetail)

// 编辑合同
const editContract = () => {
  mode.value = 'edit'
}

// 使用模板重新创建
const useTemplate = () => {
  mode.value = 'template'
}

// 获取合同历史记录
const fetchHistoryRecords = async () => {
  loading.value = true
  try {
    historyRecords.value = await contractStore.getContractHistory(contractId.value)
    showHistoryDialog.value = true
  } catch (error) {
    ElMessage.error('获取历史记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 审批状态改变
const handleApprovalStatusChange = () => {
  fetchContractDetail() // 重新获取最新的合同信息
  ElMessage.success('审批状态已更新')
}

// 从模板创建合同成功
const handleTemplateCreated = (newContractId: string) => {
  ElMessage.success('已成功从模板创建新合同')
  router.push(`/contract/${newContractId}`)
}

// 修复statusClass计算中的类型问题
const statusClass = computed(() => {
  if (!contractStore.currentContract) return '';
  const classMap: Record<string, string> = {
    'draft': 'status-draft',
    'in_approval': 'status-pending',
    'approved': 'status-approved',
    'active': 'status-active',
    'completed': 'status-completed',
    'terminated': 'status-terminated'
  };
  return classMap[contractStore.currentContract.status] || '';
});

// 修复typeClass计算中的类型问题
const typeClass = computed(() => {
  if (!contractStore.currentContract) return '';
  const classMap: Record<string, string> = {
    'sales': 'type-sales',
    'purchase': 'type-purchase',
    'service': 'type-service',
    'employment': 'type-employment',
    'lease': 'type-lease',
    'other': 'type-other'
  };
  return classMap[contractStore.currentContract.type] || '';
});

// 搜索合同
const handleSearch = () => {
  // 实现搜索逻辑
  console.log('搜索合同', queryParams.keyword, queryParams.status);
};

// 创建新合同
const createContract = () => {
  // 实现创建新合同逻辑
  console.log('创建新合同');
};
</script>

<template>
  <div class="contract-view" v-loading="loading">
    <!-- 顶部操作栏 -->
    <div class="top-actions">
      <el-button @click="goBack" :icon="Back">返回列表</el-button>
      <div class="right-actions">
        <template v-if="!editMode && contractStore.currentContract">
          <el-button v-if="canEdit" type="primary" @click="editMode = true" :icon="EditPen">编辑</el-button>
          <el-button v-if="canSubmitForApproval" type="success" @click="submitForApproval" :icon="Share">提交审批</el-button>
          <el-button v-if="canApprove" type="success" @click="approveContract" :icon="Check">批准</el-button>
          <el-button v-if="canApprove" type="danger" @click="rejectContract" :icon="Close">拒绝</el-button>
          <el-button v-if="canTerminate" type="warning" @click="showTerminateDialog" :icon="Close">终止合同</el-button>
          <el-dropdown>
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="exportContract('pdf')">
                  <el-icon><Document /></el-icon> 导出为PDF
                </el-dropdown-item>
                <el-dropdown-item @click="exportContract('docx')">
                  <el-icon><Document /></el-icon> 导出为DOCX
                </el-dropdown-item>
                <el-dropdown-item @click="uploadDialogVisible = true">
                  <el-icon><DocumentAdd /></el-icon> 上传附件
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><Printer /></el-icon> 打印
                </el-dropdown-item>
                <el-dropdown-item divided @click="deleteContract">
                  <el-icon class="text-danger"><Delete /></el-icon> 
                  <span class="text-danger">删除合同</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button type="primary" @click="saveContract">保存</el-button>
          <el-button @click="editMode = false">取消</el-button>
        </template>
      </div>
    </div>

    <!-- 合同标题与状态 -->
    <div class="contract-header" v-if="contractStore.currentContract">
      <h1>{{ contractStore.currentContract.title }}</h1>
      <div class="contract-status">
        <el-tag size="large" :type="statusTagType">
          {{ statusNameMap[contractStore.currentContract.status] }}
        </el-tag>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="contract-tabs">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="details">
        <template v-if="!editMode && contractStore.currentContract">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合同编号">
              {{ contractStore.currentContract.contractNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="合同类型">
              {{ typeNameMap[contractStore.currentContract.type] }}
            </el-descriptions-item>
            <el-descriptions-item label="合作方">
              {{ contractStore.currentContract.partyName }}
            </el-descriptions-item>
            <el-descriptions-item label="合同金额">
              {{ contractStore.currentContract.amount }} 元
            </el-descriptions-item>
            <el-descriptions-item label="生效日期">
              {{ contractStore.currentContract.startDate }}
            </el-descriptions-item>
            <el-descriptions-item label="到期日期">
              {{ contractStore.currentContract.endDate }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ contractStore.currentContract.createdAt }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ contractStore.currentContract.updatedAt }}
            </el-descriptions-item>
            <el-descriptions-item label="创建人">
              {{ contractStore.currentContract.createdBy }}
            </el-descriptions-item>
            <el-descriptions-item label="合同描述" :span="2">
              {{ contractStore.currentContract.content || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
        <template v-else>
          <el-form label-width="100px">
            <el-form-item label="合同标题">
              <el-input v-model="formData.title" placeholder="请输入合同标题"></el-input>
            </el-form-item>
            <el-form-item label="合同编号">
              <el-input v-model="formData.contractNumber" placeholder="请输入合同编号"></el-input>
            </el-form-item>
            <el-form-item label="合同类型">
              <el-select v-model="formData.type" placeholder="请选择合同类型">
                <el-option label="销售合同" value="sales"></el-option>
                <el-option label="采购合同" value="purchase"></el-option>
                <el-option label="服务合同" value="service"></el-option>
                <el-option label="劳动合同" value="employment"></el-option>
                <el-option label="租赁合同" value="lease"></el-option>
                <el-option label="其他" value="other"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="合作方">
              <el-input v-model="formData.partyName" placeholder="请输入合作方名称"></el-input>
            </el-form-item>
            <el-form-item label="合同金额">
              <el-input-number v-model="formData.amount" :min="0" :precision="2" :step="1000"></el-input-number>
            </el-form-item>
            <el-form-item label="生效日期">
              <el-date-picker 
                v-model="formData.startDate" 
                type="date" 
                placeholder="选择生效日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD">
              </el-date-picker>
            </el-form-item>
            <el-form-item label="到期日期">
              <el-date-picker 
                v-model="formData.endDate" 
                type="date" 
                placeholder="选择到期日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD">
              </el-date-picker>
            </el-form-item>
            <el-form-item label="合同描述">
              <el-input 
                v-model="formData.content" 
                type="textarea" 
                :rows="4" 
                placeholder="请输入合同描述">
              </el-input>
            </el-form-item>
          </el-form>
        </template>
      </el-tab-pane>

      <!-- 合同内容 -->
      <el-tab-pane label="合同内容" name="content">
        <ContractEditor
          v-model="contractContent"
          :approval-status="contractStore.currentContract?.status || 'draft'"
          :contract-data="contractStore.currentContract || {}"
        />
      </el-tab-pane>

      <!-- 审批流程 -->
      <el-tab-pane label="审批流程" name="approval">
        <ApprovalFlow
          :contract-id="contractId"
          @status-change="handleApprovalStatusChange"
        />

        <div class="mt-4">
          <h3>审批工作流配置</h3>
          <ApprovalWorkflow 
            :contract-id="contractId"
            :status="contractStore.currentContract?.status || 'draft'"
            :approval-list="[]"
            :can-approve="canApprove"
            @status-changed="handleApprovalStatusChange"
          />
        </div>
      </el-tab-pane>

      <!-- 绩效监控 -->
      <el-tab-pane label="绩效监控" name="performance" v-if="contractStore.currentContract">
        <PerformanceMonitor 
          :contract-id="contractId"
          :contract-type="contractStore.currentContract.type"
        />
      </el-tab-pane>

      <!-- 附件管理 -->
      <el-tab-pane label="附件管理" name="attachments">
        <div class="attachments-container">
          <div class="attachments-header">
            <h3>合同附件</h3>
            <el-button 
              type="primary" 
              :icon="DocumentAdd" 
              @click="uploadDialogVisible = true"
            >
              上传附件
            </el-button>
          </div>
          
          <el-table 
            :data="fileList" 
            style="width: 100%"
            v-if="fileList.length > 0"
          >
            <el-table-column prop="name" label="文件名" min-width="200"></el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button link type="primary" :icon="Download" @click="window.open(scope.row.url)">
                  下载
                </el-button>
                <el-button 
                  link 
                  type="danger" 
                  :icon="Delete" 
                  @click="handleRemoveAttachment(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="empty-attachments" v-if="fileList.length === 0">
            <p>暂无附件</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 终止合同对话框 -->
    <el-dialog
      v-model="terminateDialogVisible"
      title="终止合同"
      width="500px"
    >
      <el-form>
        <el-form-item label="终止原因" required>
          <el-input
            v-model="terminateReason"
            type="textarea"
            :rows="4"
            placeholder="请输入终止原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="terminateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="terminateContract" :loading="loading">
            确认终止
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传附件对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传附件"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="file => handleFileUpload(file.raw)"
        :limit="5"
        multiple
      >
        <el-icon class="el-icon--upload"><DocumentAdd /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持任意类型文件，单个文件不超过10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="uploadLoading">
            开始上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 历史记录对话框 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="合同历史记录"
      width="70%"
    >
      <el-timeline>
        <el-timeline-item
          v-for="(record, index) in historyRecords"
          :key="index"
          :timestamp="record.createdAt"
          :type="record.action === 'create' ? 'primary' : 
                record.action === 'update' ? 'success' : 
                record.action === 'approve' ? 'info' : 
                record.action === 'reject' ? 'warning' : 
                record.action === 'terminate' ? 'danger' : 'info'"
        >
          <h4>{{ record.userName }}</h4>
          <p>{{ 
            record.action === 'create' ? '创建了合同' : 
            record.action === 'update' ? '更新了合同' : 
            record.action === 'approve' ? '批准了合同' : 
            record.action === 'reject' ? '拒绝了合同' : 
            record.action === 'terminate' ? '终止了合同' : record.action 
          }}</p>
          <div v-if="record.changes" class="history-changes">
            <div v-for="(change, field) in record.changes" :key="field" class="change-item">
              <span class="field-name">{{ field }}:</span> 
              <span class="old-value">{{ change.old }}</span> 
              <el-icon><arrow-right /></el-icon> 
              <span class="new-value">{{ change.new }}</span>
            </div>
          </div>
          <p v-if="record.comment" class="comment">"{{ record.comment }}"</p>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<style scoped>
.contract-view {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.top-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.right-actions {
  display: flex;
  gap: 10px;
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.contract-header h1 {
  font-size: 24px;
  margin: 0;
  color: #303133;
}

.contract-tabs {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.attachments-container {
  margin: 20px 0;
}

.attachments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.attachments-header h3 {
  margin: 0;
  color: #303133;
}

.empty-attachments {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

.text-danger {
  color: #f56c6c;
}

.history-changes {
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.change-item {
  margin-bottom: 4px;
  font-size: 0.95em;
}

.field-name {
  font-weight: 500;
  margin-right: 5px;
}

.old-value {
  text-decoration: line-through;
  color: #f56c6c;
  margin-right: 5px;
}

.new-value {
  color: #67c23a;
  margin-left: 5px;
}

.comment {
  font-style: italic;
  color: #606266;
  margin-top: 8px;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style> 