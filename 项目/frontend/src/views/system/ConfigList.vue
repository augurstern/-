<template>
  <div class="config-container">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span class="title">系统参数配置</span>
          <div class="actions">
            <el-button type="primary" @click="handleAdd">
              新增参数
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="search-bar">
        <el-form :inline="true" :model="queryParams" class="demo-form-inline">
          <el-form-item label="参数名称">
            <el-input v-model="queryParams.configName" placeholder="请输入参数名称" clearable />
          </el-form-item>
          <el-form-item label="参数键名">
            <el-input v-model="queryParams.configKey" placeholder="请输入参数键名" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table
        v-loading="loading"
        :data="configList"
        style="width: 100%"
        row-key="id"
        border
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="参数名称" prop="configName" :show-overflow-tooltip="true" />
        <el-table-column label="参数键名" prop="configKey" :show-overflow-tooltip="true" />
        <el-table-column label="参数键值" prop="configValue" :show-overflow-tooltip="true" />
        <el-table-column label="系统内置" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.configType === 'Y' ? 'danger' : 'info'"
            >
              {{ scope.row.configType === 'Y' ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              link
              @click="handleUpdate(scope.row)"
              v-if="scope.row.configType !== 'Y'"
            >
              修改
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(scope.row)"
              v-if="scope.row.configType !== 'Y'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:currentPage="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="configForm" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model="form.configValue" placeholder="请输入参数键值" />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio label="Y">是</el-radio>
            <el-radio label="N">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 加载状态
const loading = ref(false)
// 总条数
const total = ref(0)
// 参数表格数据
const configList = ref([
  {
    id: 1,
    configName: '用户默认密码',
    configKey: 'sys.user.initPassword',
    configValue: '123456',
    configType: 'Y',
    remark: '用户默认密码'
  },
  {
    id: 2,
    configName: '主框架页-默认皮肤样式名称',
    configKey: 'sys.index.skinName',
    configValue: 'skin-blue',
    configType: 'Y',
    remark: '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow'
  },
  {
    id: 3,
    configName: '系统名称',
    configKey: 'sys.name',
    configValue: '合同管理系统',
    configType: 'N',
    remark: '系统显示名称'
  }
])
// 弹出层标题
const title = ref('')
// 是否显示弹出层
const open = ref(false)
// 表单参数
const form = reactive({
  id: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'N',
  remark: ''
})
// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  configName: '',
  configKey: '',
  configType: ''
})
// 表单校验
const rules = {
  configName: [
    { required: true, message: '参数名称不能为空', trigger: 'blur' }
  ],
  configKey: [
    { required: true, message: '参数键名不能为空', trigger: 'blur' }
  ],
  configValue: [
    { required: true, message: '参数键值不能为空', trigger: 'blur' }
  ]
}

// 钩子函数
onMounted(() => {
  // 这里应该调用API获取参数列表
  // listConfig()
})

// 查询参数列表
const handleQuery = () => {
  // 这里应该调用API获取参数列表
  // listConfig()
}

// 重置查询操作
const resetQuery = () => {
  queryParams.configName = ''
  queryParams.configKey = ''
  queryParams.configType = ''
  handleQuery()
}

// 分页大小改变
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  handleQuery()
}

// 页码改变
const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val
  handleQuery()
}

// 表单重置
const reset = () => {
  form.id = undefined
  form.configName = ''
  form.configKey = ''
  form.configValue = ''
  form.configType = 'N'
  form.remark = ''
}

// 取消按钮
const cancel = () => {
  open.value = false
  reset()
}

// 新增按钮操作
const handleAdd = () => {
  reset()
  open.value = true
  title.value = '添加参数'
}

// 修改按钮操作
const handleUpdate = (row: any) => {
  reset()
  Object.assign(form, row)
  open.value = true
  title.value = '修改参数'
}

// 提交按钮
const submitForm = () => {
  // 表单提交逻辑
  ElMessage.success('操作成功')
  open.value = false
  handleQuery()
}

// 删除按钮操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm('是否确认删除参数名称为"' + row.configName + '"的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 删除操作逻辑
    ElMessage.success('删除成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}
</script>

<style scoped>
.config-container {
  padding: 20px;
}
.config-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.search-bar {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 