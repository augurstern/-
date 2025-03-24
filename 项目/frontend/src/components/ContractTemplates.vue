<template>
  <div class="template-manager">
    <div class="template-header">
      <h3>{{ title }}</h3>
      <div class="header-actions">
        <el-button 
          type="primary" 
          size="small" 
          @click="showCreateDialog" 
          v-if="!readOnly && hasCreatePermission"
          icon="Plus"
        >
          新建模板
        </el-button>
      </div>
    </div>
    
    <div class="template-content" v-loading="loading">
      <el-tabs v-model="activeTabName" @tab-change="handleTabChange">
        <el-tab-pane label="预设模板" name="preset">
          <div class="template-grid">
            <el-empty v-if="presetTemplates.length === 0" description="暂无预设模板"></el-empty>
            <template-card
              v-for="template in presetTemplates"
              :key="template.id"
              :template="template"
              :selected="selectedTemplateId === template.id"
              @select="selectTemplate"
              @preview="previewTemplate"
              @edit="editTemplate"
              @delete="confirmDeleteTemplate"
              :can-edit="false"
              :can-delete="isAdmin"
            ></template-card>
          </div>
        </el-tab-pane>
        <el-tab-pane label="自定义模板" name="custom">
          <div class="template-grid">
            <el-empty v-if="customTemplates.length === 0" description="暂无自定义模板"></el-empty>
            <template-card
              v-for="template in customTemplates"
              :key="template.id"
              :template="template"
              :selected="selectedTemplateId === template.id"
              @select="selectTemplate"
              @preview="previewTemplate"
              @edit="editTemplate"
              @delete="confirmDeleteTemplate"
              :can-edit="canEditTemplate(template)"
              :can-delete="canDeleteTemplate(template)"
            ></template-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 预览模板对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="currentTemplate?.name"
      width="70%"
      destroy-on-close
    >
      <div class="template-preview">
        <div class="preview-info">
          <div class="preview-item">
            <span class="label">模板类型:</span>
            <el-tag size="small">{{ getTypeName(currentTemplate?.type) }}</el-tag>
          </div>
          <div class="preview-item">
            <span class="label">创建者:</span>
            <span>{{ currentTemplate?.createdBy || '系统' }}</span>
          </div>
          <div class="preview-item">
            <span class="label">最后更新:</span>
            <span>{{ formatDate(currentTemplate?.updatedAt) }}</span>
          </div>
        </div>
        <el-divider>模板内容</el-divider>
        <div class="preview-content" v-html="parsedTemplateContent"></div>
      </div>
      <template #footer>
        <span>
          <el-button type="primary" @click="useTemplate" v-if="!readOnly">使用此模板</el-button>
          <el-button @click="previewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditing ? '编辑模板' : '创建模板'"
      width="80%"
      destroy-on-close
    >
      <el-form :model="templateForm" ref="templateFormRef" :rules="templateRules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称"></el-input>
        </el-form-item>
        <el-form-item label="模板类型" prop="type">
          <el-select v-model="templateForm.type" placeholder="请选择合同类型" style="width: 100%;">
            <el-option
              v-for="item in contractTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input 
            v-model="templateForm.description" 
            type="textarea" 
            :rows="2"
            placeholder="请输入模板描述（选填）"
          ></el-input>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input 
            v-model="templateForm.content" 
            type="textarea" 
            :rows="15"
            placeholder="请输入模板内容（支持Markdown格式）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button type="primary" @click="saveTemplate" :loading="saving">保存</el-button>
          <el-button @click="editDialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useContractStore } from '../stores/contract'
import { marked } from 'marked'
import TemplateCard from './TemplateCard.vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: '合同模板'
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['select', 'use', 'create', 'update', 'delete'])

// Stores
const authStore = useAuthStore()
const contractStore = useContractStore()

// State
const loading = ref(false)
const saving = ref(false)
const activeTabName = ref('preset')
const templates = ref<any[]>([])
const presetTemplates = computed(() => templates.value.filter(t => t.isSystem))
const customTemplates = computed(() => templates.value.filter(t => !t.isSystem))
const selectedTemplateId = ref(props.selectedId)
const currentTemplate = ref<any>(null)

// Dialog visibility
const previewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const isEditing = ref(false)

// Form
const templateFormRef = ref<any>(null)
const templateForm = reactive({
  id: '',
  name: '',
  type: '',
  description: '',
  content: '',
  isDefault: false
})

const templateRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择合同类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入模板内容', trigger: 'blur' }
  ]
}

// 合同类型
const contractTypes = [
  { value: 'sales', label: '销售合同' },
  { value: 'purchase', label: '采购合同' },
  { value: 'service', label: '服务合同' },
  { value: 'employment', label: '劳动合同' },
  { value: 'lease', label: '租赁合同' },
  { value: 'other', label: '其他' }
]

// Computed
const parsedTemplateContent = computed(() => {
  try {
    return marked(currentTemplate.value?.content || '')
  } catch (e) {
    return '<p>内容解析错误</p>'
  }
})

const isAdmin = computed(() => {
  return authStore.userRole === 'admin'
})

const hasCreatePermission = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'manager'
})

// Methods
const fetchTemplates = async () => {
  loading.value = true
  try {
    const result = await contractStore.getContractTemplates()
    if (result) {
      templates.value = result
    }
  } catch (error) {
    ElMessage.error('获取模板列表失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  // 可以在这里处理特定的标签页加载逻辑
}

const selectTemplate = (template: any) => {
  selectedTemplateId.value = template.id
  emit('select', template)
}

const previewTemplate = (template: any) => {
  currentTemplate.value = template
  previewDialogVisible.value = true
}

const useTemplate = () => {
  if (currentTemplate.value) {
    emit('use', currentTemplate.value)
    previewDialogVisible.value = false
  }
}

const showCreateDialog = () => {
  isEditing.value = false
  templateForm.id = ''
  templateForm.name = ''
  templateForm.type = ''
  templateForm.description = ''
  templateForm.content = ''
  templateForm.isDefault = false
  editDialogVisible.value = true
}

const editTemplate = (template: any) => {
  isEditing.value = true
  templateForm.id = template.id
  templateForm.name = template.name
  templateForm.type = template.type
  templateForm.description = template.description || ''
  templateForm.content = template.content
  templateForm.isDefault = template.isDefault
  editDialogVisible.value = true
}

const saveTemplate = async () => {
  if (!templateFormRef.value) return
  
  await templateFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    saving.value = true
    
    try {
      let result
      if (isEditing.value) {
        // 更新模板
        result = await contractStore.updateContractTemplate(templateForm.id, {
          name: templateForm.name,
          type: templateForm.type,
          description: templateForm.description,
          content: templateForm.content
        })
        
        if (result) {
          // 更新本地列表
          const index = templates.value.findIndex(t => t.id === templateForm.id)
          if (index !== -1) {
            templates.value[index] = result
          }
          
          ElMessage.success('模板更新成功')
          emit('update', result)
        }
      } else {
        // 创建模板
        result = await contractStore.createContractTemplate({
          name: templateForm.name,
          type: templateForm.type,
          description: templateForm.description,
          content: templateForm.content
        })
        
        if (result) {
          // 添加到本地列表
          templates.value.push(result)
          
          ElMessage.success('模板创建成功')
          emit('create', result)
        }
      }
      
      editDialogVisible.value = false
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新模板失败' : '创建模板失败')
    } finally {
      saving.value = false
    }
  })
}

const confirmDeleteTemplate = async (template: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${template.name}" 吗？此操作不可恢复！`, 
      '警告', 
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    const success = await contractStore.deleteContractTemplate(template.id)
    
    if (success) {
      // 从本地列表中移除
      templates.value = templates.value.filter(t => t.id !== template.id)
      
      // 如果删除的是当前选中的模板，清除选择
      if (selectedTemplateId.value === template.id) {
        selectedTemplateId.value = ''
      }
      
      ElMessage.success('模板已删除')
      emit('delete', template)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除模板失败')
    }
  } finally {
    loading.value = false
  }
}

const canEditTemplate = (template: any) => {
  // 管理员可以编辑所有模板
  if (isAdmin.value) return true
  
  // 普通用户只能编辑自己创建的模板
  return template.createdById === authStore.user?.id
}

const canDeleteTemplate = (template: any) => {
  // 系统预设模板只有管理员可以删除
  if (template.isSystem) return isAdmin.value
  
  // 管理员可以删除所有模板
  if (isAdmin.value) return true
  
  // 普通用户只能删除自己创建的模板
  return template.createdById === authStore.user?.id
}

const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'sales': '销售合同',
    'purchase': '采购合同',
    'service': '服务合同',
    'employment': '劳动合同',
    'lease': '租赁合同',
    'other': '其他'
  }
  return typeMap[type] || '未知类型'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleString()
  } catch (e) {
    return dateString
  }
}

// 生命周期
onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.template-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.template-content {
  flex: 1;
  overflow: auto;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  padding: 10px 0;
}

.template-preview {
  padding: 10px;
}

.preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.preview-item {
  display: flex;
  align-items: center;
}

.preview-item .label {
  color: var(--el-text-color-secondary);
  margin-right: 5px;
}

.preview-content {
  padding: 20px;
  background-color: var(--el-fill-color);
  border-radius: 4px;
  font-size: 15px;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}

.preview-content h1, 
.preview-content h2, 
.preview-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content h1 {
  font-size: 2em;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.3em;
}

.preview-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.3em;
}

.preview-content h3 {
  font-size: 1.25em;
}

.preview-content p {
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--el-fill-color-darker);
  border-radius: 3px;
}

.preview-content code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--el-fill-color-darker);
  border-radius: 3px;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.preview-content table th, 
.preview-content table td {
  padding: 6px 13px;
  border: 1px solid var(--el-border-color);
}

.preview-content table tr:nth-child(2n) {
  background-color: var(--el-fill-color-darker);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  }
  
  .template-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 10px;
  }
}
</style> 