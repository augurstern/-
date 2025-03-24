<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Edit, DocumentCopy, Download } from '@element-plus/icons-vue'
import { useContractStore } from '../stores/contract'
import { parseTemplateVariables } from '../utils/templateUtils'
import { contractTypeOptions, typeNameMap } from '../utils/clauseLibrary'

const contractStore = useContractStore()
const loading = ref(false)
const templates = ref<any[]>([])
const activeTemplate = ref<any>(null)
const dialogVisible = ref(false)
const searchQuery = ref('')
const selectedType = ref('')

// 表单数据
const templateForm = reactive({
  id: '',
  name: '',
  description: '',
  type: 'sales',
  content: '',
  isDefault: false
})

// 类型选项
const typeOptions = contractTypeOptions

// 条款库
const clauseLibrary = ref<Map<string, any[]>>(new Map([
  ['sales', [
    { title: '产品交付条款', content: '卖方应在合同签订后${交付天数}个工作日内交付产品。产品交付地点为${交付地点}。' },
    { title: '质量保证条款', content: '卖方保证所交付的产品符合国家相关质量标准，保修期为${保修期}个月。' },
    { title: '付款条件', content: '买方应在产品验收合格后${付款天数}个工作日内支付全部货款。付款方式为${付款方式}。' }
  ]],
  ['purchase', [
    { title: '采购数量条款', content: '买方向卖方采购${产品名称}，数量为${采购数量}，单价为${单价}元。' },
    { title: '验收标准', content: '产品验收标准应符合${验收标准}的要求，验收不合格的，买方有权拒收。' },
    { title: '违约责任', content: '卖方逾期交货的，应按合同总金额的${违约金比例}%/天支付违约金。' }
  ]],
  ['service', [
    { title: '服务内容条款', content: '服务方应按照本合同的约定，为委托方提供${服务内容}服务。' },
    { title: '服务期限', content: '服务期限自${开始日期}起至${结束日期}止，共计${服务期限}个月。' },
    { title: '服务质量', content: '服务方应保证服务质量符合${服务标准}标准，如服务质量不达标，委托方有权要求${补救措施}。' }
  ]],
  ['employment', [
    { title: '工作职责条款', content: '员工的工作职位为${职位名称}，主要职责包括${工作职责}。' },
    { title: '薪酬福利', content: '员工税前月薪为${月薪}元，按月支付，此外享有${福利项目}等福利。' },
    { title: '保密条款', content: '员工应对在职期间接触到的公司商业秘密严格保密，离职后${保密期限}年内仍负有保密义务。' }
  ]],
  ['lease', [
    { title: '租赁物条款', content: '出租方将位于${租赁物地址}的${租赁物名称}出租给承租方使用。' },
    { title: '租金支付', content: '租金为每月${月租金}元，承租方应于每月${付款日}日前支付，支付方式为${支付方式}。' },
    { title: '租赁期限', content: '租赁期限为${租赁期限}个月，自${开始日期}起至${结束日期}止。' }
  ]],
  ['other', [
    { title: '通用条款', content: '本合同自双方签字盖章之日起生效。' },
    { title: '争议解决', content: '因本合同引起的或与本合同有关的任何争议，双方应友好协商解决，协商不成的，提交${仲裁机构}仲裁。' },
    { title: '不可抗力', content: '因不可抗力导致本合同无法履行的，受不可抗力影响的一方可以免除相应的责任，但应及时通知对方并提供证明。' }
  ]]
]))

// 过滤后的模板列表
const filteredTemplates = computed(() => {
  let result = templates.value
  
  if (selectedType.value) {
    result = result.filter(t => t.type === selectedType.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    )
  }
  
  return result
})

// 获取所有模板
const fetchTemplates = async () => {
  try {
    loading.value = true
    const result = await contractStore.fetchContractTemplates()
    templates.value = result || []
  } catch (error) {
    ElMessage.error('获取合同模板失败')
  } finally {
    loading.value = false
  }
}

// 获取单个模板详情
const fetchTemplateDetail = async (id: string) => {
  try {
    loading.value = true
    const template = await contractStore.fetchTemplateById(id)
    
    if (template) {
      activeTemplate.value = template
      
      // 填充表单数据
      Object.assign(templateForm, {
        id: template.id,
        name: template.name,
        description: template.description || '',
        type: template.type,
        content: template.content,
        isDefault: template.isDefault || false
      })
    }
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  } finally {
    loading.value = false
  }
}

// 保存模板
const saveTemplate = async () => {
  if (!templateForm.name || !templateForm.content || !templateForm.type) {
    ElMessage.warning('请填写完整的模板信息')
    return
  }
  
  try {
    loading.value = true
    
    const templateData = {
      ...templateForm,
      lastUpdated: new Date().toISOString()
    }
    
    let result
    if (templateForm.id) {
      // 更新现有模板
      result = await contractStore.updateContractTemplate(templateForm.id, templateData)
    } else {
      // 创建新模板
      result = await contractStore.createContractTemplate(templateData)
    }
    
    if (result) {
      ElMessage.success(templateForm.id ? '模板更新成功' : '模板创建成功')
      dialogVisible.value = false
      await fetchTemplates()
    }
  } catch (error) {
    ElMessage.error(templateForm.id ? '更新模板失败' : '创建模板失败')
  } finally {
    loading.value = false
  }
}

// 删除模板
const deleteTemplate = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗？此操作不可逆', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const success = await contractStore.deleteContractTemplate(id)
    
    if (success) {
      ElMessage.success('模板已删除')
      await fetchTemplates()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除模板失败')
    }
  } finally {
    loading.value = false
  }
}

// 使用模板
const useTemplate = (template: any) => {
  ElMessage.success(`已选择模板：${template.name}`)
  emit('select-template', template)
}

// 复制模板
const duplicateTemplate = async (template: any) => {
  try {
    loading.value = true
    
    const duplicatedTemplate = {
      ...template,
      id: undefined,
      name: `${template.name} (副本)`,
      isDefault: false,
      lastUpdated: new Date().toISOString()
    }
    
    const result = await contractStore.createContractTemplate(duplicatedTemplate)
    
    if (result) {
      ElMessage.success('模板复制成功')
      await fetchTemplates()
    }
  } catch (error) {
    ElMessage.error('复制模板失败')
  } finally {
    loading.value = false
  }
}

// 打开创建模板对话框
const openCreateDialog = () => {
  // 重置表单
  Object.assign(templateForm, {
    id: '',
    name: '',
    description: '',
    type: 'sales',
    content: '',
    isDefault: false
  })
  
  dialogVisible.value = true
}

// 打开编辑模板对话框
const openEditDialog = async (id: string) => {
  await fetchTemplateDetail(id)
  dialogVisible.value = true
}

// 添加条款到模板
const addClause = (clause: any) => {
  templateForm.content += `\n\n${clause.title}\n${clause.content}`
}

// 获取推荐条款
const getRecommendedClauses = computed(() => {
  if (!templateForm.type) return []
  return clauseLibrary.value.get(templateForm.type) || []
})

// 组件暴露事件
const emit = defineEmits(['select-template'])

// 初始化
onMounted(() => {
  fetchTemplates()
})
</script>

<template>
  <div class="template-manager" v-loading="loading">
    <div class="template-header">
      <h2>合同模板管理</h2>
      <el-button 
        type="primary" 
        @click="openCreateDialog" 
        :icon="Plus"
        data-test="create-template-button"
      >
        新建模板
      </el-button>
    </div>
    
    <div class="template-filter">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜索模板" 
        clearable 
        style="width: 220px"
      />
      
      <el-select 
        v-model="selectedType" 
        placeholder="选择类型" 
        style="width: 140px; margin-left: 10px"
      >
        <el-option 
          v-for="item in typeOptions" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value"
        />
      </el-select>
    </div>
    
    <div class="template-list" v-if="filteredTemplates.length > 0">
      <el-card v-for="template in filteredTemplates" :key="template.id" class="template-card">
        <div class="template-card-header">
          <h3>{{ template.name }}</h3>
          <el-tag size="small" :type="template.isDefault ? 'success' : 'info'">
            {{ typeNameMap[template.type] }}
          </el-tag>
        </div>
        
        <p class="template-description">{{ template.description || '暂无描述' }}</p>
        
        <div class="template-meta">
          <span>上次更新: {{ new Date(template.lastUpdated).toLocaleString() }}</span>
          <span v-if="template.isDefault" class="default-label">默认模板</span>
        </div>
        
        <div class="template-actions">
          <el-button type="primary" link @click="useTemplate(template)">使用</el-button>
          <el-button type="primary" link @click="openEditDialog(template.id)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button type="primary" link @click="duplicateTemplate(template)">
            <el-icon><DocumentCopy /></el-icon>
          </el-button>
          <el-button type="danger" link @click="deleteTemplate(template.id)" :disabled="template.isDefault">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>
    
    <div class="empty-templates" v-else>
      <p>暂无符合条件的模板</p>
    </div>
    
    <!-- 模板编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible"
      :title="templateForm.id ? '编辑模板' : '创建模板'"
      width="80%"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input 
            v-model="templateForm.name" 
            placeholder="请输入模板名称"
            data-test="template-name-input"
          />
        </el-form-item>
        
        <el-form-item label="模板类型" required>
          <el-select 
            v-model="templateForm.type" 
            placeholder="请选择模板类型"
            data-test="template-type-select"
          >
            <el-option
              v-for="(item, index) in typeOptions.slice(1)"
              :key="index"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板描述">
          <el-input 
            v-model="templateForm.description" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入模板描述"
          />
        </el-form-item>
        
        <el-form-item label="是否默认">
          <el-switch v-model="templateForm.isDefault" />
        </el-form-item>
        
        <el-form-item label="模板内容" required>
          <div class="template-editor-container">
            <div class="template-editor">
              <el-input 
                v-model="templateForm.content" 
                type="textarea" 
                :rows="15" 
                placeholder="请输入模板内容"
                data-test="template-content-input"
              />
              <div class="template-help">
                <p>变量使用 <code>${变量名}</code> 格式，例如：<code>${合同金额}</code></p>
                <div v-if="templateForm.content">
                  <p>模板变量列表：</p>
                  <el-tag 
                    v-for="variable in parseTemplateVariables(templateForm.content)" 
                    :key="variable"
                    class="variable-tag"
                  >
                    {{ variable }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <div class="template-clauses">
              <h4>推荐条款</h4>
              <div class="clauses-list">
                <el-card 
                  v-for="(clause, index) in getRecommendedClauses" 
                  :key="index"
                  class="clause-card"
                >
                  <h5>{{ clause.title }}</h5>
                  <p>{{ clause.content }}</p>
                  <el-button type="primary" size="small" @click="addClause(clause)">
                    添加此条款
                  </el-button>
                </el-card>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveTemplate" 
            :loading="loading"
            data-test="save-template-button"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.template-manager {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.template-filter {
  display: flex;
  margin-bottom: 20px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.template-card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.template-description {
  flex-grow: 1;
  margin-bottom: 10px;
  color: #606266;
  word-break: break-word;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.default-label {
  color: #67c23a;
  font-weight: bold;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-templates {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

.template-editor-container {
  display: flex;
  gap: 20px;
}

.template-editor {
  flex: 3;
}

.template-clauses {
  flex: 1;
  min-width: 250px;
}

.template-help {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}

.variable-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.clauses-list {
  max-height: 400px;
  overflow-y: auto;
}

.clause-card {
  margin-bottom: 10px;
}

.clause-card h5 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #303133;
}

.clause-card p {
  color: #606266;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .template-editor-container {
    flex-direction: column;
  }
  
  .template-editor, .template-clauses {
    width: 100%;
  }
}
</style> 