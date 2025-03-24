<template>
  <div class="dict-type-container">
    <!-- 面包屑导航 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>系统管理</el-breadcrumb-item>
        <el-breadcrumb-item>字典管理</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="page-title">
        <h2>字典类型管理</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新增字典类型
        </el-button>
      </div>
    </div>

    <!-- 查询条件 -->
    <el-card class="filter-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="类型名称" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="类型名称/类型编码"
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
          <span>字典类型列表</span>
          <div class="right">
            <el-button plain @click="handleRefreshCache">
              <el-icon><RefreshRight /></el-icon>刷新缓存
            </el-button>
            <el-button type="success" plain @click="handleExport">
              <el-icon><Download /></el-icon>导出
            </el-button>
            <el-button type="primary" plain @click="handleImport">
              <el-icon><Upload /></el-icon>导入
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格内容 -->
      <el-table
        v-loading="loading"
        :data="dictTypeList"
        border
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="index" width="50" label="#" />
        <el-table-column prop="name" label="字典名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="code" label="字典编码" min-width="120" show-overflow-tooltip />
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
        <el-table-column fixed="right" label="操作" width="220">
          <template #default="scope">
            <el-button link type="primary" @click="handleViewItems(scope.row)">
              字典项
            </el-button>
            <el-button link type="primary" @click="handleUpdate(scope.row)">
              修改
            </el-button>
            <el-button 
              link 
              type="primary" 
              :disabled="scope.row.code === 'sys_user_sex'"
              @click="handleDelete(scope.row)"
            >
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
        ref="dictTypeForm"
        :model="dictTypeForm"
        :rules="dictTypeRules"
        label-width="100px"
      >
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="dictTypeForm.name" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典编码" prop="code">
          <el-input 
            v-model="dictTypeForm.code" 
            placeholder="请输入字典编码" 
            :disabled="dialog.type === 'edit'"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dictTypeForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="dictTypeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入字典描述"
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

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="导入字典数据"
      width="400px"
      append-to-body
      destroy-on-close
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        :file-list="importDialog.fileList"
        accept=".xls,.xlsx"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传 Excel 文件，且不超过 5MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitImport" :loading="importDialog.loading">
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, RefreshRight, Download, Upload } from '@element-plus/icons-vue'
import { useDictionaryStore } from '@/stores/dictionary'
import type { DictType, DictTypeCreatePayload, DictTypeUpdatePayload } from '@/api/dictionary'
import { useRouter } from 'vue-router'

const router = useRouter()
const dictionaryStore = useDictionaryStore()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: ''
})

// 数据列表
const dictTypeList = computed(() => dictionaryStore.dictTypes)
const loading = computed(() => dictionaryStore.loading)
const total = computed(() => dictionaryStore.totalTypes)

// 表单对话框
const dialog = reactive({
  visible: false,
  title: '',
  type: ''
})

// 表单数据
const dictTypeForm = reactive<DictTypeCreatePayload & { id?: string }>({
  name: '',
  code: '',
  description: '',
  status: 'active'
})

// 表单验证规则
const dictTypeRules = {
  name: [
    { required: true, message: '请输入字典名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入字典编码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '编码必须以字母开头，且只能包含字母、数字和下划线', trigger: 'blur' }
  ]
}

// 导入对话框
const importDialog = reactive({
  visible: false,
  fileList: [] as any[],
  file: null as File | null,
  loading: false
})

// 查询字典类型列表
const getList = async () => {
  await dictionaryStore.fetchDictTypes(queryParams)
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

// 打开新增对话框
const handleCreate = () => {
  dialog.type = 'add'
  dialog.title = '新增字典类型'
  dialog.visible = true
  
  // 重置表单
  Object.assign(dictTypeForm, {
    name: '',
    code: '',
    description: '',
    status: 'active'
  })
}

// 打开编辑对话框
const handleUpdate = (row: DictType) => {
  dialog.type = 'edit'
  dialog.title = '编辑字典类型'
  dialog.visible = true
  
  // 填充表单
  Object.assign(dictTypeForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    status: row.status
  })
}

// 提交表单
const submitForm = async () => {
  const dictTypeFormEl = document.querySelector('#dictTypeForm') as HTMLFormElement
  if (!dictTypeFormEl) return;
  
  try {
    if (dialog.type === 'add') {
      // 新增
      const payload: DictTypeCreatePayload = {
        name: dictTypeForm.name,
        code: dictTypeForm.code,
        description: dictTypeForm.description,
        status: dictTypeForm.status
      }
      await dictionaryStore.createDictType(payload)
    } else {
      // 编辑
      if (!dictTypeForm.id) return;
      
      const payload: DictTypeUpdatePayload = {
        name: dictTypeForm.name,
        description: dictTypeForm.description,
        status: dictTypeForm.status
      }
      await dictionaryStore.updateDictType(dictTypeForm.id, payload)
    }
    
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('提交表单失败', error)
  }
}

// 删除
const handleDelete = (row: DictType) => {
  ElMessageBox.confirm(`确认删除字典类型 "${row.name}" 吗？删除后将无法恢复！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await dictionaryStore.deleteDictType(row.id)
      getList()
    } catch (error) {
      console.error('删除失败', error)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 查看字典项
const handleViewItems = (row: DictType) => {
  router.push({
    name: 'DictItemList',
    query: { 
      typeId: row.id,
      typeName: row.name
    }
  })
}

// 刷新缓存
const handleRefreshCache = async () => {
  try {
    await dictionaryStore.refreshDictCache()
    ElMessage.success('字典缓存刷新成功')
  } catch (error) {
    console.error('刷新缓存失败', error)
  }
}

// 导出
const handleExport = async () => {
  try {
    await dictionaryStore.exportDictData()
  } catch (error) {
    console.error('导出失败', error)
  }
}

// 打开导入对话框
const handleImport = () => {
  importDialog.visible = true
  importDialog.fileList = []
  importDialog.file = null
}

// 文件变更
const handleFileChange = (file: any) => {
  importDialog.file = file.raw
}

// 提交导入
const submitImport = async () => {
  if (!importDialog.file) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importDialog.loading = true
  try {
    const result = await dictionaryStore.importDictData(importDialog.file)
    if (result && result.success) {
      importDialog.visible = false
      getList() // 刷新列表
    } else if (result) {
      // 显示详细错误信息
      if (result.errors && result.errors.length > 0) {
        const errorMsg = `导入过程中发生错误:\n${result.errors.join('\n')}`
        ElMessage.warning(errorMsg)
      }
    }
  } catch (error) {
    console.error('导入失败', error)
  } finally {
    importDialog.loading = false
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
  getList()
})
</script>

<style scoped>
.dict-type-container {
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

.upload-demo {
  display: flex;
  justify-content: center;
}
</style> 