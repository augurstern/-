<template>
  <div class="dict-type-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="left">
        <h2>数据字典管理</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>系统设置</el-breadcrumb-item>
          <el-breadcrumb-item>数据字典</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="right">
        <el-button type="success" @click="refreshDictCache">
          <el-icon><Refresh /></el-icon>刷新缓存
        </el-button>
        <el-button type="primary" @click="exportDictData">
          <el-icon><Download /></el-icon>导出
        </el-button>
        <el-button type="primary" @click="showImportDialog">
          <el-icon><Upload /></el-icon>导入
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <div class="search-form">
        <el-form :model="queryParams" label-width="80px" :inline="true">
          <el-form-item label="关键词">
            <el-input
              v-model="queryParams.keyword"
              placeholder="字典名称/编码"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="全部" clearable>
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetQuery">
              <el-icon><RefreshRight /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 字典类型列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>字典类型列表</span>
          <el-button type="primary" @click="handleAddType">
            <el-icon><Plus /></el-icon>新增字典
          </el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="dictTypeList"
        border
        stripe
        style="width: 100%"
        row-key="id"
        @row-click="handleRowClick"
      >
        <el-table-column type="expand">
          <template #default="props">
            <DictItemList :typeId="props.row.id" :typeCode="props.row.typeCode" />
          </template>
        </el-table-column>
        <el-table-column prop="typeName" label="字典名称" min-width="120">
          <template #default="{ row }">
            <span>{{ row.typeName }}</span>
            <el-tag v-if="row.isSystem" size="small" type="warning" class="ml-1">系统</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="typeCode" label="字典编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click.stop="handleEditType(row)"
              :disabled="row.isSystem"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              link
              @click.stop="handleManageItems(row)"
            >
              字典项
            </el-button>
            <el-popconfirm
              title="确定删除该字典吗？"
              @confirm="handleDeleteType(row)"
              :disabled="row.isSystem"
            >
              <template #reference>
                <el-button
                  type="danger"
                  link
                  @click.stop
                  :disabled="row.isSystem"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 字典类型表单对话框 -->
    <el-dialog
      v-model="dictTypeDialog.visible"
      :title="dictTypeDialog.isEdit ? '编辑字典' : '新增字典'"
      width="500px"
      append-to-body
    >
      <el-form
        ref="dictTypeFormRef"
        :model="dictTypeForm"
        :rules="dictTypeRules"
        label-width="80px"
      >
        <el-form-item label="字典名称" prop="typeName">
          <el-input v-model="dictTypeForm.typeName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典编码" prop="typeCode">
          <el-input
            v-model="dictTypeForm.typeCode"
            placeholder="请输入字典编码"
            :disabled="dictTypeDialog.isEdit"
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
            placeholder="请输入描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictTypeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDictType">确认</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="导入字典数据"
      width="500px"
      append-to-body
    >
      <el-upload
        class="dict-upload"
        drag
        action="#"
        :http-request="uploadFile"
        :show-file-list="false"
        :before-upload="beforeUpload"
        accept=".xls,.xlsx,.json"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          拖入文件或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持Excel或JSON格式 (*.xls, *.xlsx, *.json)
          </div>
        </template>
      </el-upload>
      <el-divider>上传选项</el-divider>
      <el-form :model="importDialog.options" label-width="150px">
        <el-form-item label="更新已存在数据">
          <el-switch v-model="importDialog.options.updateExisting" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleImport"
          :disabled="!importDialog.file"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Delete,
  Refresh,
  Download,
  Upload
} from '@element-plus/icons-vue'
import DictItemList from './components/DictItemList.vue'
import {
  getDictTypeList,
  getDictType,
  addDictType,
  updateDictType,
  deleteDictType,
  exportDict,
  importDict,
  refreshDictCache as apiRefreshDictCache,
  type DictType
} from '@/api/dictionary'
import { useDictionaryStore } from '@/stores/dictionary'

const dictionaryStore = useDictionaryStore()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: ''
})

// 字典类型列表数据
const dictTypeList = ref<DictType[]>([])
const loading = ref(false)
const total = ref(0)

// 字典类型表单
const dictTypeDialog = reactive({
  visible: false,
  isEdit: false
})

const dictTypeFormRef = ref<FormInstance>()
const dictTypeForm = reactive({
  id: '',
  typeName: '',
  typeCode: '',
  status: 'active',
  description: ''
})

// 表单校验规则
const dictTypeRules = {
  typeName: [
    { required: true, message: '字典名称不能为空', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  typeCode: [
    { required: true, message: '字典编码不能为空', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 导入对话框
const importDialog = reactive({
  visible: false,
  file: null as File | null,
  options: {
    updateExisting: true
  }
})

// 初始化加载数据
onMounted(() => {
  loadDictTypeList()
})

// 监听查询参数变化
watch(
  () => [queryParams.page, queryParams.pageSize],
  () => {
    loadDictTypeList()
  }
)

// 加载字典类型列表
async function loadDictTypeList() {
  loading.value = true
  try {
    const result = await getDictTypeList(queryParams)
    dictTypeList.value = result.items
    total.value = result.total
  } catch (error) {
    console.error('加载字典类型列表失败:', error)
    ElMessage.error('加载字典类型列表失败')
  } finally {
    loading.value = false
  }
}

// 查询按钮
function handleSearch() {
  queryParams.page = 1
  loadDictTypeList()
}

// 重置查询
function resetQuery() {
  queryParams.keyword = ''
  queryParams.status = ''
  handleSearch()
}

// 分页大小变化
function handleSizeChange(size: number) {
  queryParams.pageSize = size
  loadDictTypeList()
}

// 分页页码变化
function handleCurrentChange(page: number) {
  queryParams.page = page
  loadDictTypeList()
}

// 点击行展开
function handleRowClick(row: DictType) {
  // 通过表格的 row-key 自动处理展开/折叠
}

// 新增字典类型
function handleAddType() {
  dictTypeDialog.isEdit = false
  dictTypeDialog.visible = true
  dictTypeForm.id = ''
  dictTypeForm.typeName = ''
  dictTypeForm.typeCode = ''
  dictTypeForm.status = 'active'
  dictTypeForm.description = ''
  
  // 等待DOM更新后重置表单
  setTimeout(() => {
    dictTypeFormRef.value?.resetFields()
  }, 0)
}

// 编辑字典类型
async function handleEditType(row: DictType) {
  dictTypeDialog.isEdit = true
  dictTypeDialog.visible = true
  
  try {
    // 获取最新的字典类型数据
    const dictType = await getDictType(row.id)
    dictTypeForm.id = dictType.id
    dictTypeForm.typeName = dictType.typeName
    dictTypeForm.typeCode = dictType.typeCode
    dictTypeForm.status = dictType.status
    dictTypeForm.description = dictType.description || ''
  } catch (error) {
    console.error('获取字典类型详情失败:', error)
    ElMessage.error('获取字典类型详情失败')
    dictTypeDialog.visible = false
  }
}

// 提交字典类型表单
async function submitDictType() {
  if (!dictTypeFormRef.value) return
  
  await dictTypeFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      if (dictTypeDialog.isEdit) {
        // 更新字典类型
        await updateDictType(dictTypeForm.id, {
          typeName: dictTypeForm.typeName,
          status: dictTypeForm.status,
          description: dictTypeForm.description
        })
        ElMessage.success('更新字典类型成功')
      } else {
        // 新增字典类型
        await addDictType({
          typeName: dictTypeForm.typeName,
          typeCode: dictTypeForm.typeCode,
          status: dictTypeForm.status,
          description: dictTypeForm.description
        })
        ElMessage.success('新增字典类型成功')
      }
      
      // 关闭对话框并刷新列表
      dictTypeDialog.visible = false
      await loadDictTypeList()
      
      // 刷新字典类型缓存
      await dictionaryStore.fetchAllDictTypes(true)
    } catch (error) {
      console.error('保存字典类型失败:', error)
      ElMessage.error('保存字典类型失败')
    }
  })
}

// 删除字典类型
async function handleDeleteType(row: DictType) {
  try {
    await deleteDictType(row.id)
    ElMessage.success('删除字典类型成功')
    await loadDictTypeList()
    
    // 刷新字典类型缓存
    await dictionaryStore.fetchAllDictTypes(true)
  } catch (error) {
    console.error('删除字典类型失败:', error)
    ElMessage.error('删除字典类型失败')
  }
}

// 管理字典项
function handleManageItems(row: DictType) {
  // 此处可以选择使用路由导航跳转到字典项管理页面
  // 或者通过展开行直接管理字典项
  ElMessage.info(`管理字典项: ${row.typeName}`)
}

// 刷新字典缓存
async function refreshDictCache() {
  try {
    await ElMessageBox.confirm('确定要刷新字典缓存吗？这将更新系统中所有字典数据。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const loading = ElMessage.loading('正在刷新缓存...', 0)
    
    try {
      await apiRefreshDictCache()
      
      // 刷新本地缓存
      const result = await dictionaryStore.refreshAllDict()
      
      if (result) {
        ElMessage.success('刷新字典缓存成功')
      } else {
        ElMessage.warning('刷新本地缓存成功，但服务端刷新失败')
      }
    } finally {
      loading.close()
    }
  } catch (error) {
    // 用户取消或发生错误
    if (error !== 'cancel') {
      console.error('刷新字典缓存失败:', error)
      ElMessage.error('刷新字典缓存失败')
    }
  }
}

// 导出字典数据
function exportDictData() {
  // TODO: 实现导出字典数据
  ElMessage.info('导出字典数据功能待实现')
}

// 显示导入对话框
function showImportDialog() {
  importDialog.visible = true
  importDialog.file = null
}

// 上传前验证
function beforeUpload(file: File) {
  const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json']
  const isValidType = validTypes.includes(file.type)
  
  if (!isValidType) {
    ElMessage.error('只能上传Excel或JSON文件!')
    return false
  }
  
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('文件大小不能超过2MB!')
    return false
  }
  
  importDialog.file = file
  return false // 阻止自动上传
}

// 自定义上传方法
function uploadFile(options: any) {
  importDialog.file = options.file
  ElMessage.success('文件已选择，请点击"开始导入"按钮')
}

// 处理导入
async function handleImport() {
  if (!importDialog.file) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  try {
    const loading = ElMessage.loading('正在导入...', 0)
    
    try {
      await importDict(importDialog.file, importDialog.options.updateExisting)
      ElMessage.success('导入成功')
      
      // 刷新列表和缓存
      await loadDictTypeList()
      await dictionaryStore.refreshAllDict()
      
      // 关闭对话框
      importDialog.visible = false
    } finally {
      loading.close()
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  }
}
</script>

<style scoped>
.dict-type-view {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.ml-1 {
  margin-left: 4px;
}

.dict-upload {
  width: 100%;
}

.el-upload {
  width: 100%;
}

.el-upload-dragger {
  width: 100%;
}
</style> 