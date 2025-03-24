<template>
  <div class="dict-item-list">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">字典项列表</span>
          <div class="actions">
            <el-button type="primary" size="small" @click="handleAddItem">
              <el-icon><Plus /></el-icon>新增字典项
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="dictItems"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="label" label="字典标签" min-width="120" />
        <el-table-column prop="value" label="字典键值" min-width="120" />
        <el-table-column prop="cssClass" label="样式属性" min-width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.cssClass"
              :type="row.cssClass"
              effect="plain"
            >
              {{ row.cssClass }}
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleEditItem(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除该字典项吗？"
              @confirm="handleDeleteItem(row)"
            >
              <template #reference>
                <el-button
                  type="danger"
                  link
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
          v-if="total > 0"
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          small
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 字典项表单对话框 -->
    <el-dialog
      v-model="dictItemDialog.visible"
      :title="dictItemDialog.isEdit ? '编辑字典项' : '新增字典项'"
      width="500px"
      append-to-body
      destroy-on-close
    >
      <el-form
        ref="dictItemFormRef"
        :model="dictItemForm"
        :rules="dictItemRules"
        label-width="80px"
      >
        <el-form-item label="字典类型" prop="typeCode">
          <el-input v-model="typeCode" disabled />
        </el-form-item>
        <el-form-item label="字典标签" prop="label">
          <el-input v-model="dictItemForm.label" placeholder="请输入字典标签" />
        </el-form-item>
        <el-form-item label="字典键值" prop="value">
          <el-input
            v-model="dictItemForm.value"
            placeholder="请输入字典键值"
            :disabled="dictItemDialog.isEdit"
          />
        </el-form-item>
        <el-form-item label="样式属性" prop="cssClass">
          <el-select v-model="dictItemForm.cssClass" placeholder="请选择样式属性" clearable style="width: 100%">
            <el-option label="默认" value="" />
            <el-option label="主要" value="primary" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示顺序" prop="sort">
          <el-input-number v-model="dictItemForm.sort" :min="0" :max="999" />
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
            placeholder="请输入描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictItemDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDictItem">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, defineProps } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getDictItemsByTypeId,
  getDictItem,
  addDictItem,
  updateDictItem,
  deleteDictItem,
  type DictItem
} from '@/api/dictionary'
import { useDictionaryStore } from '@/stores/dictionary'

const props = defineProps({
  typeId: {
    type: String,
    required: true
  },
  typeCode: {
    type: String,
    required: true
  }
})

const dictionaryStore = useDictionaryStore()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  typeId: ''
})

// 字典项列表数据
const dictItems = ref<DictItem[]>([])
const loading = ref(false)
const total = ref(0)

// 字典项表单
const dictItemDialog = reactive({
  visible: false,
  isEdit: false
})

const dictItemFormRef = ref<FormInstance>()
const dictItemForm = reactive({
  id: '',
  typeId: '',
  typeCode: '',
  label: '',
  value: '',
  cssClass: '',
  sort: 0,
  status: 'active',
  description: ''
})

// 表单校验规则
const dictItemRules = {
  label: [
    { required: true, message: '字典标签不能为空', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '字典键值不能为空', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '排序不能为空', trigger: 'change' }
  ]
}

// 初始化加载数据
onMounted(() => {
  queryParams.typeId = props.typeId
  loadDictItems()
})

// 监听props变化
watch(
  () => props.typeId,
  (newVal) => {
    if (newVal) {
      queryParams.typeId = newVal
      queryParams.page = 1
      loadDictItems()
    }
  }
)

// 监听查询参数变化
watch(
  () => [queryParams.page, queryParams.pageSize],
  () => {
    loadDictItems()
  }
)

// 加载字典项列表
async function loadDictItems() {
  if (!queryParams.typeId) return
  
  loading.value = true
  try {
    const result = await getDictItemsByTypeId(queryParams.typeId, queryParams)
    dictItems.value = result.items
    total.value = result.total
  } catch (error) {
    console.error('加载字典项列表失败:', error)
    ElMessage.error('加载字典项列表失败')
  } finally {
    loading.value = false
  }
}

// 分页大小变化
function handleSizeChange(size: number) {
  queryParams.pageSize = size
  loadDictItems()
}

// 分页页码变化
function handleCurrentChange(page: number) {
  queryParams.page = page
  loadDictItems()
}

// 新增字典项
function handleAddItem() {
  dictItemDialog.isEdit = false
  dictItemDialog.visible = true
  dictItemForm.id = ''
  dictItemForm.typeId = props.typeId
  dictItemForm.typeCode = props.typeCode
  dictItemForm.label = ''
  dictItemForm.value = ''
  dictItemForm.cssClass = ''
  dictItemForm.sort = 0
  dictItemForm.status = 'active'
  dictItemForm.description = ''
  
  // 等待DOM更新后重置表单
  setTimeout(() => {
    dictItemFormRef.value?.resetFields()
  }, 0)
}

// 编辑字典项
async function handleEditItem(row: DictItem) {
  dictItemDialog.isEdit = true
  dictItemDialog.visible = true
  
  try {
    // 获取最新的字典项数据
    const dictItem = await getDictItem(row.id)
    dictItemForm.id = dictItem.id
    dictItemForm.typeId = dictItem.typeId
    dictItemForm.typeCode = dictItem.typeCode
    dictItemForm.label = dictItem.label
    dictItemForm.value = dictItem.value
    dictItemForm.cssClass = dictItem.cssClass || ''
    dictItemForm.sort = dictItem.sort || 0
    dictItemForm.status = dictItem.status
    dictItemForm.description = dictItem.description || ''
  } catch (error) {
    console.error('获取字典项详情失败:', error)
    ElMessage.error('获取字典项详情失败')
    dictItemDialog.visible = false
  }
}

// 提交字典项表单
async function submitDictItem() {
  if (!dictItemFormRef.value) return
  
  await dictItemFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      if (dictItemDialog.isEdit) {
        // 更新字典项
        await updateDictItem(dictItemForm.id, {
          label: dictItemForm.label,
          cssClass: dictItemForm.cssClass,
          sort: dictItemForm.sort,
          status: dictItemForm.status,
          description: dictItemForm.description
        })
        ElMessage.success('更新字典项成功')
      } else {
        // 新增字典项
        await addDictItem({
          typeId: dictItemForm.typeId,
          typeCode: dictItemForm.typeCode,
          label: dictItemForm.label,
          value: dictItemForm.value,
          cssClass: dictItemForm.cssClass,
          sort: dictItemForm.sort,
          status: dictItemForm.status,
          description: dictItemForm.description
        })
        ElMessage.success('新增字典项成功')
      }
      
      // 关闭对话框并刷新列表
      dictItemDialog.visible = false
      await loadDictItems()
      
      // 刷新字典缓存
      await dictionaryStore.refreshDictItems(props.typeCode)
    } catch (error) {
      console.error('保存字典项失败:', error)
      ElMessage.error('保存字典项失败')
    }
  })
}

// 删除字典项
async function handleDeleteItem(row: DictItem) {
  try {
    await deleteDictItem(row.id)
    ElMessage.success('删除字典项成功')
    await loadDictItems()
    
    // 刷新字典缓存
    await dictionaryStore.refreshDictItems(props.typeCode)
  } catch (error) {
    console.error('删除字典项失败:', error)
    ElMessage.error('删除字典项失败')
  }
}
</script>

<style scoped>
.dict-item-list {
  padding: 20px;
  background-color: var(--el-fill-color-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 14px;
  font-weight: bold;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 