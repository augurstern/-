<template>
  <div 
    class="template-card" 
    :class="{ 'is-selected': selected }"
    @click="handleSelect"
  >
    <div class="template-badge" v-if="template.isDefault">
      <el-tag size="small" type="success">默认</el-tag>
    </div>
    <div class="template-badge" v-else-if="template.isSystem">
      <el-tag size="small" type="info">预设</el-tag>
    </div>
    
    <div class="template-header">
      <div class="template-icon" :class="getTypeClass(template.type)">
        <el-icon><DocumentCopy /></el-icon>
      </div>
      <div class="template-title">
        <h4>{{ template.name }}</h4>
        <div class="template-type">{{ getTypeName(template.type) }}</div>
      </div>
    </div>
    
    <div class="template-description">
      {{ template.description || '暂无描述' }}
    </div>
    
    <div class="template-info">
      <div class="template-author">
        <el-icon><User /></el-icon>
        <span>{{ template.createdBy || '系统' }}</span>
      </div>
      <div class="template-date">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDate(template.updatedAt) }}</span>
      </div>
    </div>
    
    <div class="template-actions">
      <el-button 
        size="small" 
        type="primary" 
        text 
        @click.stop="handlePreview"
        :icon="View"
      >
        预览
      </el-button>
      <el-button 
        size="small" 
        type="warning" 
        text 
        @click.stop="handleEdit"
        v-if="canEdit"
        :icon="Edit"
      >
        编辑
      </el-button>
      <el-button 
        size="small" 
        type="danger" 
        text 
        @click.stop="handleDelete"
        v-if="canDelete"
        :icon="Delete"
      >
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DocumentCopy, User, Calendar, View, Edit, Delete } from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  template: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: false
  }
})

// 定义emit
const emit = defineEmits(['select', 'preview', 'edit', 'delete'])

// 方法
const handleSelect = () => {
  emit('select', props.template)
}

const handlePreview = () => {
  emit('preview', props.template)
}

const handleEdit = () => {
  emit('edit', props.template)
}

const handleDelete = () => {
  emit('delete', props.template)
}

const getTypeClass = (type: string) => {
  const typeClassMap: Record<string, string> = {
    'sales': 'type-sales',
    'purchase': 'type-purchase',
    'service': 'type-service',
    'employment': 'type-employment',
    'lease': 'type-lease',
    'other': 'type-other'
  }
  
  return typeClassMap[type] || 'type-other'
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
    const date = new Date(dateString)
    const now = new Date()
    
    // 如果是今天，只显示时间
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 如果是最近7天，显示星期几
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (dayDiff < 7) {
      return `星期${weekdays[date.getDay()]}`
    }
    
    // 否则显示完整日期
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  } catch (e) {
    return dateString
  }
}
</script>

<style scoped>
.template-card {
  position: relative;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-color-primary-light-5);
}

.template-card.is-selected {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.template-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.template-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.template-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.template-icon .el-icon {
  font-size: 20px;
}

.type-sales {
  background-color: #409EFF;
}

.type-purchase {
  background-color: #67C23A;
}

.type-service {
  background-color: #E6A23C;
}

.type-employment {
  background-color: #F56C6C;
}

.type-lease {
  background-color: #909399;
}

.type-other {
  background-color: #a0cfff;
}

.template-title h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-description {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.template-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-author, .template-date {
  display: flex;
  align-items: center;
}

.template-author .el-icon, .template-date .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
  gap: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .template-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .template-icon {
    margin-bottom: 8px;
  }
  
  .template-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 