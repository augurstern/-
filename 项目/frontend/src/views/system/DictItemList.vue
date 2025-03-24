<template>
  <div class="dict-item-container">
    <!-- 面包屑导航 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>系统管理</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'DictTypeList' }">字典管理</el-breadcrumb-item>
        <el-breadcrumb-item>字典数据</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="page-title">
        <h2>{{ typeName || '字典数据' }}</h2>
        <div class="actions">
          <el-button @click="goBack">
            <el-icon><Back /></el-icon>返回
          </el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>新增字典项
          </el-button>
        </div>
      </div>
    </div>

    <!-- 查询条件 -->
    <el-card class="filter-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="字典项" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标签/值"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select 
            v-model="queryParams.status" 
            placeholder="全部" 
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>字典项列表</span>
          <div class="right">
            <el-button type="success" plain @click="handleExport">
              <el-icon><Download /></el-icon>导出
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格内容 -->
      <el-table
        v-loading="loading"
        :data="dictItemList"
        border
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="index" width="50" label="#" />
        <el-table-column prop="label" label="字典标签" min-width="120" show-overflow-tooltip />
        <el-table-column prop="value" label="字典键值" min-width="120" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="样式" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.cssClass" :type="scope.row.cssClass">
              {{ scope.row.label }}
            </el-tag>
            <span v-else>{{ scope.row.cssClass || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="150">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)">
              修改
            </el-button>
            <el-button link type="primary" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form
        ref="dictItemForm"
        :model="dictItemForm"
        :rules="dictItemRules"
        label-width="100px"
      >
        <el-form-item label="字典类型" prop="typeId">
          <el-input v-model="typeName" disabled />
        </el-form-item>
        <el-form-item label="字典标签" prop="label">
          <el-input v-model="dictItemForm.label" placeholder="请输入字典标签" />
        </el-form-item>
        <el-form-item label="字典键值" prop="value">
          <el-input v-model="dictItemForm.value" placeholder="请输入字典键值" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dictItemForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="标签样式" prop="cssClass">
          <el-select v-model="dictItemForm.cssClass" clearable placeholder="请选择标签样式">
            <el-option label="默认" value="" />
            <el-option label="主要" value="primary" />
            <el-option label="成功" value="success" />
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
          </el-select>
          <div class="style-preview" v-if="dictItemForm.label">
            <el-tag :type="dictItemForm.cssClass || undefined">
              {{ dictItemForm.label }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="列表样式" prop="listClass">
          <el-select v-model="dictItemForm.listClass" clearable placeholder="请选择列表样式">
            <el-option label="默认" value="" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dictItemForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="dictItemForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Download, Back } from '@element-plus/icons-vue'
import { useDictionaryStore } from '@/stores/dictionary'
import type { DictItem, DictItemCreatePayload, DictItemUpdatePayload } from '@/api/dictionary'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const dictionaryStore = useDictionaryStore()

// 获取字典类型信息
const typeId = computed(() => route.query.typeId as string || '')
const typeName = computed(() => route.query.typeName as string || '字典数据')

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  typeId: typeId.value,
  keyword: '',
  status: ''
})

// 数据列表
const dictItemList = computed(() => dictionaryStore.dictItems)
const loading = computed(() => dictionaryStore.loading)
const total = computed(() => dictionaryStore.totalItems)

// 表单对话框
const dialog = reactive({
  visible: false,
  title: '',
  type: ''
})

// 表单数据
const dictItemForm = reactive<DictItemCreatePayload & { id?: string }>({
  typeId: '',
  label: '',
  value: '',
  sort: 0,
  cssClass: '',
  listClass: '',
  description: '',
  status: 'active'
})

// 表单验证规则
const dictItemRules = {
  label: [
    { required: true, message: '请输入字典标签', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '请输入字典键值', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 查询字典项列表
const getList = async () => {
  await dictionaryStore.fetchDictItems({
    ...queryParams,
    typeId: typeId.value
  })
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  getList()
}

// 重置
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.status = ''
  handleSearch()
}

// 每页数量变化
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  getList()
}

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val
  getList()
}

// 返回字典类型列表
const goBack = () => {
  router.push({ name: 'DictTypeList' })
}

// 打开新增对话框
const handleCreate = () => {
  dialog.type = 'add'
  dialog.title = '新增字典项'
  dialog.visible = true
  
  // 重置表单
  Object.assign(dictItemForm, {
    typeId: typeId.value,
    label: '',
    value: '',
    sort: 0,
    cssClass: '',
    listClass: '',
    description: '',
    status: 'active'
  })
}

// 打开编辑对话框
const handleUpdate = (row: DictItem) => {
  dialog.type = 'edit'
  dialog.title = '编辑字典项'
  dialog.visible = true
  
  // 填充表单
  Object.assign(dictItemForm, {
    id: row.id,
    typeId: row.typeId,
    label: row.label,
    value: row.value,
    sort: row.sort,
    cssClass: row.cssClass || '',
    listClass: row.listClass || '',
    description: row.description || '',
    status: row.status
  })
}

// 提交表单
const submitForm = async () => {
  const dictItemFormEl = document.querySelector('#dictItemForm') as HTMLFormElement
  if (!dictItemFormEl) return;
  
  try {
    if (dialog.type === 'add') {
      // 新增
      const payload: DictItemCreatePayload = {
        typeId: dictItemForm.typeId,
        label: dictItemForm.label,
        value: dictItemForm.value,
        sort: dictItemForm.sort,
        cssClass: dictItemForm.cssClass,
        listClass: dictItemForm.listClass,
        description: dictItemForm.description,
        status: dictItemForm.status
      }
      await dictionaryStore.createDictItem(payload)
    } else {
      // 编辑
      if (!dictItemForm.id) return;
      
      const payload: DictItemUpdatePayload = {
        label: dictItemForm.label,
        value: dictItemForm.value,
        sort: dictItemForm.sort,
        cssClass: dictItemForm.cssClass,
        listClass: dictItemForm.listClass,
        description: dictItemForm.description,
        status: dictItemForm.status
      }
      await dictionaryStore.updateDictItem(dictItemForm.id, payload)
    }
    
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('提交表单失败', error)
  }
}

// 删除
const handleDelete = (row: DictItem) => {
  ElMessageBox.confirm(`确认删除字典项 "${row.label}" 吗？删除后将无法恢复！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await dictionaryStore.deleteDictItem(row.id)
      getList()
    } catch (error) {
      console.error('删除失败', error)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 导出
const handleExport = async () => {
  try {
    await dictionaryStore.exportDictData({
      typeId: typeId.value
    })
  } catch (error) {
    console.error('导出失败', error)
  }
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

onMounted(() => {
  if (!typeId.value) {
    ElMessage.warning('请选择字典类型')
    router.push({ name: 'DictTypeList' })
    return
  }
  getList()
})
</script>

<style scoped>
.dict-item-container {
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.filter-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.style-preview {
  margin-top: 8px;
}
</style> 