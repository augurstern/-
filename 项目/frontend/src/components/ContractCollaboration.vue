<template>
  <div class="contract-collaboration">
    <div class="collaboration-header">
      <h3>{{ title }}</h3>
      <div class="collaboration-actions">
        <el-button type="primary" size="small" :icon="Edit" @click="startEditing" v-if="!isEditing && canEdit">
          编辑
        </el-button>
        <template v-if="isEditing">
          <el-button type="success" size="small" :icon="Check" @click="saveChanges" :loading="saving">
            保存
          </el-button>
          <el-button type="danger" size="small" :icon="Close" @click="cancelEditing">
            取消
          </el-button>
        </template>
        <el-button type="info" size="small" :icon="Document" @click="showHistory" :disabled="!hasHistory">
          历史版本
        </el-button>
      </div>
    </div>

    <div class="active-users">
      <div class="active-users-label">当前协作者:</div>
      <div class="user-avatars">
        <el-tooltip 
          v-for="user in activeUsers" 
          :key="user.id" 
          :content="user.name + (user.isEditing ? ' (正在编辑)' : '')" 
          placement="top"
        >
          <el-badge :is-dot="user.isEditing" type="success">
            <el-avatar 
              :size="32" 
              :src="user.avatar" 
              :style="{ border: user.isEditing ? '2px solid #67C23A' : 'none' }"
            >
              {{ user.name.substr(0, 1) }}
            </el-avatar>
          </el-badge>
        </el-tooltip>
      </div>
      <el-tag v-if="activeUsers.length === 0" size="small" type="info">暂无协作者</el-tag>
    </div>

    <div class="collaboration-content">
      <div v-if="!isEditing" class="preview-mode">
        <div class="document-content" v-html="documentHtml"></div>
      </div>
      <div v-else class="edit-mode">
        <el-form :model="editForm" ref="editFormRef">
          <el-form-item prop="content">
            <el-input 
              type="textarea" 
              v-model="editForm.content" 
              :rows="15" 
              resize="none"
              placeholder="请输入合同内容"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="collaboration-footer">
      <div class="last-updated">
        <span>最后更新: {{ lastUpdateTime }}</span>
        <span v-if="lastEditor">由 {{ lastEditor.name }} 编辑</span>
      </div>
      <div class="version-info">
        <span>版本 {{ currentVersion }}</span>
      </div>
    </div>

    <!-- 历史版本对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="历史版本"
      width="70%"
      destroy-on-close
    >
      <div class="history-list">
        <el-table :data="historyVersions" style="width: 100%" v-loading="loadingHistory">
          <el-table-column prop="version" label="版本" width="80" />
          <el-table-column prop="updateTime" label="更新时间" width="180" />
          <el-table-column prop="editor" label="编辑者" width="120" />
          <el-table-column prop="comment" label="修改说明" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewVersion(row)" :icon="View">
                查看
              </el-button>
              <el-button type="warning" size="small" @click="restoreVersion(row)" :icon="RefreshRight">
                恢复
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 版本比较 -->
      <el-dialog
        v-model="diffDialogVisible"
        title="版本对比"
        width="80%"
        append-to-body
      >
        <div class="diff-container">
          <div class="diff-header">
            <div class="diff-version">
              <div>版本 {{ selectedVersion?.version || '' }}</div>
              <div>{{ selectedVersion?.updateTime || '' }}</div>
            </div>
            <div class="diff-separator">VS</div>
            <div class="diff-version">
              <div>当前版本 {{ currentVersion }}</div>
              <div>{{ lastUpdateTime }}</div>
            </div>
          </div>
          <div class="diff-content" v-loading="loadingDiff">
            <div class="diff-display" v-html="diffHtml"></div>
          </div>
        </div>
        <template #footer>
          <span>
            <el-button type="primary" @click="restoreVersion(selectedVersion)">恢复到此版本</el-button>
            <el-button @click="diffDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>
    </el-dialog>

    <!-- 保存版本对话框 -->
    <el-dialog
      v-model="saveDialogVisible"
      title="保存修改"
      width="500px"
    >
      <el-form :model="saveForm" ref="saveFormRef" :rules="saveRules">
        <el-form-item prop="comment" label="修改说明">
          <el-input 
            type="textarea" 
            v-model="saveForm.comment" 
            :rows="3"
            placeholder="请简要描述本次修改内容（选填）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button type="primary" @click="confirmSave" :loading="saving">确认保存</el-button>
          <el-button @click="saveDialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Check, Close, Document, View, RefreshRight } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useContractStore } from '../stores/contract'
import { marked } from 'marked'
import * as diff from 'diff'

const props = defineProps({
  contractId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: '合同文档协作'
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  defaultContent: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['save', 'update', 'version-restored'])

// 访问stores
const authStore = useAuthStore()
const contractStore = useContractStore()
const route = useRoute()
const router = useRouter()

// 用户信息
const currentUser = computed(() => authStore.user || {})

// 状态变量
const isEditing = ref(false)
const saving = ref(false)
const documentContent = ref(props.defaultContent)
const editForm = reactive({
  content: ''
})
const saveForm = reactive({
  comment: ''
})
const saveRules = {
  comment: [
    { max: 200, message: '最多200字符', trigger: 'blur' }
  ]
}

// 历史版本相关
const historyDialogVisible = ref(false)
const diffDialogVisible = ref(false)
const loadingHistory = ref(false)
const loadingDiff = ref(false)
const historyVersions = ref<any[]>([])
const selectedVersion = ref<any>(null)
const currentVersion = ref(1)
const lastUpdateTime = ref('暂无更新')
const lastEditor = ref<any>(null)
const diffHtml = ref('')

// 协作用户相关
const activeUsers = ref<any[]>([])
const heartbeatInterval = ref<any>(null)

// 计算属性
const documentHtml = computed(() => {
  try {
    return marked(documentContent.value || '')
  } catch (e) {
    return '<p>内容解析错误</p>'
  }
})

const hasHistory = computed(() => {
  return currentVersion.value > 1
})

const canEdit = computed(() => {
  if (props.readOnly) return false
  
  // 根据用户角色和合同状态判断是否可编辑
  const userRole = authStore.userRole
  const contract = contractStore.currentContract
  
  if (!contract) return false
  
  // 管理员可以编辑所有非终止状态的合同
  if (userRole === 'admin' && contract.status !== 'terminated') {
    return true
  }
  
  // 创建者可以编辑草稿和拒绝状态的合同
  if (contract.createdBy === currentUser.value.id && 
    (contract.status === 'draft' || contract.status === 'rejected')) {
    return true
  }
  
  return false
})

// 方法
const init = async () => {
  if (!props.contractId) return
  
  try {
    // 获取合同内容
    const result = await contractStore.getContractContent(props.contractId)
    if (result) {
      documentContent.value = result.content
      currentVersion.value = result.version
      lastUpdateTime.value = new Date(result.updateTime).toLocaleString()
      lastEditor.value = result.editor
    }
    
    // 加入协作
    joinCollaboration()
    
    // 设置心跳，保持在线状态
    heartbeatInterval.value = setInterval(() => {
      updateCollaborationStatus()
    }, 30000)
    
  } catch (error) {
    ElMessage.error('获取合同内容失败')
  }
}

const joinCollaboration = async () => {
  try {
    await contractStore.joinContractCollaboration(props.contractId)
    await fetchActiveUsers()
  } catch (error) {
    console.error('加入协作失败', error)
  }
}

const leaveCollaboration = async () => {
  try {
    await contractStore.leaveContractCollaboration(props.contractId)
  } catch (error) {
    console.error('离开协作失败', error)
  }
}

const updateCollaborationStatus = async () => {
  try {
    await contractStore.updateCollaborationStatus(props.contractId)
    await fetchActiveUsers()
  } catch (error) {
    console.error('更新协作状态失败', error)
  }
}

const fetchActiveUsers = async () => {
  try {
    const result = await contractStore.getCollaborators(props.contractId)
    if (result) {
      activeUsers.value = result
    }
  } catch (error) {
    console.error('获取协作者失败', error)
  }
}

const startEditing = async () => {
  if (!canEdit.value) {
    ElMessage.warning('您没有编辑权限')
    return
  }
  
  try {
    // 通知服务器开始编辑
    await contractStore.startEditingContract(props.contractId)
    
    // 更新本地状态
    isEditing.value = true
    editForm.content = documentContent.value
    
    // 更新协作者状态
    await fetchActiveUsers()
  } catch (error) {
    ElMessage.error('开始编辑失败')
  }
}

const saveChanges = () => {
  // 显示保存对话框
  saveForm.comment = ''
  saveDialogVisible.value = true
}

const confirmSave = async () => {
  saving.value = true
  
  try {
    const result = await contractStore.saveContractContent(
      props.contractId,
      editForm.content,
      saveForm.comment
    )
    
    if (result) {
      // 更新本地内容
      documentContent.value = editForm.content
      currentVersion.value = result.version
      lastUpdateTime.value = new Date(result.updateTime).toLocaleString()
      lastEditor.value = currentUser.value
      
      // 关闭编辑模式
      isEditing.value = false
      saveDialogVisible.value = false
      
      // 通知父组件
      emit('save', documentContent.value)
      emit('update', documentContent.value)
      
      ElMessage.success('保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const cancelEditing = async () => {
  // 如果有修改，则提示确认
  if (editForm.content !== documentContent.value) {
    try {
      await ElMessageBox.confirm('放弃未保存的修改？', '确认', {
        confirmButtonText: '确认放弃',
        cancelButtonText: '继续编辑',
        type: 'warning'
      })
    } catch (error) {
      return
    }
  }
  
  try {
    // 通知服务器结束编辑
    await contractStore.stopEditingContract(props.contractId)
    
    // 更新本地状态
    isEditing.value = false
    
    // 更新协作者状态
    await fetchActiveUsers()
  } catch (error) {
    console.error('取消编辑失败', error)
  }
}

const showHistory = async () => {
  loadingHistory.value = true
  historyDialogVisible.value = true
  
  try {
    const result = await contractStore.getContractVersionHistory(props.contractId)
    if (result) {
      historyVersions.value = result
    }
  } catch (error) {
    ElMessage.error('获取历史版本失败')
  } finally {
    loadingHistory.value = false
  }
}

const viewVersion = async (version: any) => {
  selectedVersion.value = version
  loadingDiff.value = true
  diffDialogVisible.value = true
  
  try {
    // 获取该版本的内容
    const result = await contractStore.getContractVersion(props.contractId, version.version)
    if (result) {
      // 生成差异
      const differences = diff.diffWords(result.content, documentContent.value)
      
      // 生成HTML
      let html = ''
      differences.forEach(part => {
        const color = part.added ? 'green' : part.removed ? 'red' : 'grey'
        const span = `<span style="color: ${color}; ${part.added ? 'background-color: #f0fff0;' : part.removed ? 'background-color: #fff0f0;' : ''}">${part.value}</span>`
        html += span
      })
      
      diffHtml.value = html
    }
  } catch (error) {
    ElMessage.error('获取版本内容失败')
  } finally {
    loadingDiff.value = false
  }
}

const restoreVersion = async (version: any) => {
  try {
    const result = await ElMessageBox.confirm(`确定要恢复到版本 ${version.version}？此操作将覆盖当前版本。`, '确认', {
      confirmButtonText: '确认恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    if (result) {
      const success = await contractStore.restoreContractVersion(props.contractId, version.version)
      
      if (success) {
        // 更新页面内容
        init()
        
        // 关闭对话框
        diffDialogVisible.value = false
        historyDialogVisible.value = false
        
        // 通知父组件
        emit('version-restored', version)
        
        ElMessage.success('版本恢复成功')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('版本恢复失败')
    }
  }
}

// 生命周期钩子
onMounted(() => {
  init()
})

onUnmounted(() => {
  // 清除心跳
  if (heartbeatInterval.value) {
    clearInterval(heartbeatInterval.value)
  }
  
  // 如果正在编辑，通知服务器结束编辑
  if (isEditing.value) {
    contractStore.stopEditingContract(props.contractId)
  }
  
  // 离开协作
  leaveCollaboration()
})

// 对话框相关
const saveDialogVisible = ref(false)
</script>

<style scoped>
.contract-collaboration {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.collaboration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 15px;
}

.collaboration-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.active-users {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.active-users-label {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.user-avatars {
  display: flex;
  gap: 5px;
}

.collaboration-content {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-blank);
}

.preview-mode {
  padding: 20px;
  min-height: 300px;
}

.document-content {
  font-size: 15px;
  line-height: 1.6;
}

.document-content h1, 
.document-content h2, 
.document-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.document-content h1 {
  font-size: 2em;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.3em;
}

.document-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.3em;
}

.document-content h3 {
  font-size: 1.25em;
}

.document-content p {
  margin-top: 0;
  margin-bottom: 16px;
}

.document-content pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--el-fill-color);
  border-radius: 3px;
}

.document-content code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--el-fill-color-darker);
  border-radius: 3px;
}

.document-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.document-content table th, 
.document-content table td {
  padding: 6px 13px;
  border: 1px solid var(--el-border-color);
}

.document-content table tr:nth-child(2n) {
  background-color: var(--el-fill-color);
}

.edit-mode {
  height: 100%;
}

.edit-mode .el-form {
  height: 100%;
  padding: 10px;
}

.edit-mode .el-form-item {
  margin-bottom: 0;
  height: 100%;
}

.collaboration-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.last-updated {
  display: flex;
  gap: 15px;
}

.diff-container {
  display: flex;
  flex-direction: column;
  height: 50vh;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.diff-version {
  flex: 1;
  text-align: center;
}

.diff-separator {
  padding: 0 20px;
  font-weight: bold;
}

.diff-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.diff-display {
  white-space: pre-wrap;
  font-family: monospace;
  line-height: 1.5;
}

.history-list {
  height: 50vh;
  overflow: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .collaboration-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .collaboration-actions {
    margin-top: 10px;
    display: flex;
    gap: 5px;
  }
}
</style> 