<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Document, 
  Edit, 
  Setting, 
  Download, 
  Upload, 
  Printer, 
  Search, 
  Filter, 
  Share 
} from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  approvalStatus: {
    type: String,
    default: 'draft'
  },
  contractData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'change'])

// 编辑器内容
const content = ref(props.modelValue || '')

// 变量列表
const variables = ref([
  { name: '${合同编号}', description: '插入合同编号' },
  { name: '${甲方名称}', description: '插入甲方名称' },
  { name: '${乙方名称}', description: '插入乙方名称' },
  { name: '${合同金额}', description: '插入合同金额' },
  { name: '${开始日期}', description: '插入合同开始日期' },
  { name: '${结束日期}', description: '插入合同结束日期' },
  { name: '${签署日期}', description: '插入合同签署日期' }
])

// 条款建议
const clauseSuggestions = ref([
  { 
    title: '保密条款', 
    content: '双方同意对在履行本合同过程中所获悉的对方的商业秘密和其他专有信息予以保密，未经信息披露方同意，不得向任何第三方披露。本保密义务不因本合同的解除、终止或撤销而终止。', 
    description: '用于保护双方商业秘密' 
  },
  { 
    title: '违约责任', 
    content: '任何一方未按本合同约定履行义务，视为违约，违约方应当承担因此给守约方造成的直接经济损失。', 
    description: '规定违约后的责任承担' 
  },
  { 
    title: '不可抗力', 
    content: '由于不可抗力原因导致无法履行合同时，遇有不可抗力的一方应立即通知对方，并在15日内提供不可抗力的详情及无法履行、部分履行或需要延期履行合同的理由的证明。根据情况可部分或全部免除责任，但法律另有规定的除外。', 
    description: '处理不可预见的情况' 
  },
])

// 是否为只读模式
const isReadOnly = ref(props.approvalStatus !== 'draft')

// 监听值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

// 监听审批状态变化
watch(() => props.approvalStatus, (newVal) => {
  isReadOnly.value = newVal !== 'draft'
})

// 内容变化时触发
const handleContentChange = (e: Event) => {
  const target = e.target as HTMLDivElement
  content.value = target.innerText
  emit('update:modelValue', content.value)
  emit('change', content.value)
}

// 插入变量
const insertVariable = (variable: string) => {
  if (isReadOnly.value) return
  
  // 获取选区
  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  
  const range = selection.getRangeAt(0)
  range.deleteContents()
  
  // 创建文本节点并插入
  const textNode = document.createTextNode(variable)
  range.insertNode(textNode)
  
  // 移动光标到插入内容之后
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  // 更新内容
  const editorEl = document.querySelector('.editor-content') as HTMLDivElement
  if (editorEl) {
    content.value = editorEl.innerText
    emit('update:modelValue', content.value)
  }
}

// 插入条款建议
const insertClauseSuggestion = (clause: string) => {
  if (isReadOnly.value) return
  
  // 获取选区
  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  
  const range = selection.getRangeAt(0)
  range.deleteContents()
  
  // 创建文本节点并插入
  const textNode = document.createTextNode(clause)
  range.insertNode(textNode)
  
  // 移动光标到插入内容之后
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  // 更新内容
  const editorEl = document.querySelector('.editor-content') as HTMLDivElement
  if (editorEl) {
    content.value = editorEl.innerText
    emit('update:modelValue', content.value)
  }
  
  ElMessage.success('已插入条款')
}

// 保存内容
const saveContent = () => {
  emit('save', content.value)
  ElMessage.success('内容已保存')
}

// 打印文档
const printDocument = () => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口，请检查您的浏览器设置。')
    return
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>合同打印</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20mm; }
          h1 { text-align: center; }
          .content { line-height: 1.5; }
        </style>
      </head>
      <body>
        <h1>${props.contractData.title || '合同文档'}</h1>
        <div class="content">${content.value.replace(/\n/g, '<br>')}</div>
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  
  // 短暂延迟确保内容加载完成
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
}

// 组件挂载时设置内容
onMounted(() => {
  const editorEl = document.querySelector('.editor-content') as HTMLDivElement
  if (editorEl && content.value) {
    editorEl.innerText = content.value
  }
})
</script>

<template>
  <div class="contract-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <el-button :disabled="isReadOnly" :icon="Edit" size="small" @click="saveContent">保存</el-button>
      <el-button :icon="Printer" size="small" @click="printDocument">打印</el-button>
      <el-button :icon="Download" size="small">导出</el-button>
      <el-button :disabled="isReadOnly" :icon="Upload" size="small">导入</el-button>
    </div>
    
    <!-- 编辑区域 -->
    <div class="content-container">
      <div 
        class="editor-content" 
        :class="{ 'readonly-mode': isReadOnly }" 
        contenteditable="true" 
        :readonly="isReadOnly"
        @input="handleContentChange"
      ></div>
      
      <!-- 侧边栏 -->
      <div class="editor-sidebar">
        <h3 class="sidebar-title">变量</h3>
        <ul class="variable-list">
          <li 
            v-for="(variable, index) in variables" 
            :key="index" 
            class="variable-item"
            @click="insertVariable(variable.name)"
          >
            {{ variable.name }}
          </li>
        </ul>
        
        <h3 class="sidebar-title mt-4">条款建议</h3>
        <ul class="suggestion-list">
          <li 
            v-for="(suggestion, index) in clauseSuggestions" 
            :key="index" 
            class="suggestion-item"
            @click="insertClauseSuggestion(suggestion.content)"
          >
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-desc">{{ suggestion.description }}</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contract-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.content-container {
  flex: 1;
  display: flex;
}

.editor-content {
  flex: 1;
  padding: 16px;
  min-height: 400px;
  outline: none;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-y: auto;
}

.readonly-mode {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.editor-sidebar {
  width: 250px;
  border-left: 1px solid #dcdfe6;
  padding: 16px;
  background-color: #f9fafc;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #303133;
}

.variable-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.variable-item {
  margin-bottom: 8px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.variable-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 8px 0;
}

.suggestion-item {
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 12px;
  color: #909399;
}

.mt-4 {
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
  }
  
  .editor-sidebar {
    width: 100%;
    border-left: none;
    border-top: 1px solid #dcdfe6;
  }
}
</style>