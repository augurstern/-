<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  clauseCategories, 
  getRecommendedClauses, 
  getAllClausesForType
} from '../utils/clauseLibrary'
import type { ClauseItem } from '../utils/clauseLibrary'

const props = defineProps({
  contractType: {
    type: String,
    required: true
  },
  contractContent: {
    type: String,
    default: ''
  },
  searchText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select-clause'])

// 当前选中的分类
const selectedCategory = ref('all')

// 搜索关键词
const keyword = ref('')

// 监听搜索文本变化
watch(() => props.searchText, (newVal) => {
  keyword.value = newVal
})

// 过滤条款
const filteredClauses = computed(() => {
  // 获取所有可用条款
  const allClauses = getAllClausesForType(props.contractType)
  
  // 按分类过滤
  let result = selectedCategory.value === 'all' 
    ? allClauses 
    : allClauses.filter(clause => clause.category === selectedCategory.value)
  
  // 按关键词过滤
  if (keyword.value.trim()) {
    const searchText = keyword.value.toLowerCase()
    result = result.filter(clause => 
      clause.title.toLowerCase().includes(searchText) || 
      clause.content.toLowerCase().includes(searchText)
    )
  }
  
  return result
})

// 智能推荐条款
const recommendedClauses = computed(() => {
  return getRecommendedClauses(props.contractContent, props.contractType)
})

// 选择条款
const selectClause = (clause: ClauseItem) => {
  emit('select-clause', clause)
  ElMessage.success(`已选择: ${clause.title}`)
}
</script>

<template>
  <div class="clause-suggestion">
    <div class="suggestion-header">
      <h3>智能条款推荐</h3>
      <div class="search-filter">
        <el-input 
          v-model="keyword" 
          placeholder="搜索条款" 
          clearable 
          prefix-icon="Search"
          class="search-input"
        />
        <el-select v-model="selectedCategory" class="category-select">
          <el-option label="全部分类" value="all" />
          <el-option 
            v-for="(name, key) in clauseCategories" 
            :key="key" 
            :label="name" 
            :value="key" 
          />
        </el-select>
      </div>
    </div>
    
    <div v-if="recommendedClauses.length > 0" class="recommendation-section">
      <div class="section-title">
        <el-icon><star-filled /></el-icon>
        <span>基于当前内容的智能推荐</span>
      </div>
      <el-scrollbar height="200px">
        <div class="clause-list">
          <div 
            v-for="clause in recommendedClauses" 
            :key="clause.id" 
            class="clause-item recommended"
            @click="selectClause(clause)"
          >
            <div class="clause-header">
              <span class="clause-title">{{ clause.title }}</span>
              <el-tag size="small" type="warning">
                {{ clauseCategories[clause.category as keyof typeof clauseCategories] }}
              </el-tag>
            </div>
            <div class="clause-preview">
              {{ clause.content.substring(0, 100) }}...
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    
    <div class="library-section">
      <div class="section-title">
        <el-icon><collection /></el-icon>
        <span>条款库</span>
      </div>
      <el-scrollbar height="300px">
        <div v-if="filteredClauses.length === 0" class="empty-state">
          没有找到匹配的条款，请尝试更改搜索条件
        </div>
        <div v-else class="clause-list">
          <div 
            v-for="clause in filteredClauses" 
            :key="clause.id" 
            class="clause-item"
            @click="selectClause(clause)"
          >
            <div class="clause-header">
              <span class="clause-title">{{ clause.title }}</span>
              <el-tag size="small" type="info">
                {{ clauseCategories[clause.category as keyof typeof clauseCategories] }}
              </el-tag>
            </div>
            <div class="clause-preview">
              {{ clause.content.substring(0, 100) }}...
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<style scoped>
.clause-suggestion {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.suggestion-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.search-filter {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 200px;
}

.category-select {
  width: 150px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 10px;
}

.section-title .el-icon {
  margin-right: 5px;
  color: #409eff;
}

.recommendation-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #e4e7ed;
}

.clause-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clause-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.clause-item:hover {
  border-color: #c6e2ff;
  background-color: #f0f9ff;
}

.clause-item.recommended {
  border-left: 3px solid #e6a23c;
  background-color: #fdf6ec;
}

.clause-item.recommended:hover {
  background-color: #faecd8;
}

.clause-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.clause-title {
  font-weight: 500;
  color: #303133;
}

.clause-preview {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-state {
  padding: 30px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style> 