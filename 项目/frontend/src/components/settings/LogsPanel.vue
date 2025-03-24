<template>
  <div class="logs-panel" v-loading="isLoading">
    <div class="filters-area">
      <el-form :model="filterForm" inline>
        <el-form-item label="日志类型">
          <el-select v-model="filterForm.logType" placeholder="选择日志类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="系统日志" value="system" />
            <el-option label="操作日志" value="operation" />
            <el-option label="安全日志" value="security" />
            <el-option label="错误日志" value="error" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日志级别">
          <el-select v-model="filterForm.level" placeholder="选择日志级别" clearable>
            <el-option label="全部" value="" />
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
            <el-option label="严重" value="critical" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="操作人">
          <el-input v-model="filterForm.user" placeholder="输入操作人" clearable />
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchLogs">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="exportLogs">导出日志</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="logs-table">
      <el-table
        :data="logs"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="timestamp" label="时间" width="180" sortable />
        <el-table-column prop="type" label="日志类型" width="100">
          <template #default="scope">
            <el-tag
              :type="getLogTypeTag(scope.row.type)"
              effect="light"
            >
              {{ getLogTypeName(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80">
          <template #default="scope">
            <el-tag
              :type="getLevelTag(scope.row.level)"
              effect="light"
            >
              {{ getLevelName(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user" label="操作人" width="120" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="message" label="日志内容" show-overflow-tooltip />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              link
              @click="viewLogDetail(scope.row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="60%"
      destroy-on-close
    >
      <template v-if="selectedLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID" :span="2">{{ selectedLog.id }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ selectedLog.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="日志类型">
            <el-tag :type="getLogTypeTag(selectedLog.type)">
              {{ getLogTypeName(selectedLog.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="日志级别">
            <el-tag :type="getLevelTag(selectedLog.level)">
              {{ getLevelName(selectedLog.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ selectedLog.user }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ selectedLog.ip }}</el-descriptions-item>
          <el-descriptions-item label="模块">{{ selectedLog.module }}</el-descriptions-item>
          <el-descriptions-item label="操作路径">{{ selectedLog.path }}</el-descriptions-item>
          <el-descriptions-item label="日志内容" :span="2">{{ selectedLog.message }}</el-descriptions-item>
          <el-descriptions-item label="详细数据" :span="2">
            <pre class="log-detail-data">{{ formatDetailData(selectedLog.detail) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// 接收父组件传递的加载状态
const props = defineProps<{
  loading?: boolean
}>()

// 状态变量
const isLoading = ref(false)
const logs = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const detailDialogVisible = ref(false)
const selectedLog = ref<any>(null)

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 筛选表单
const filterForm = reactive({
  logType: '',
  level: '',
  user: '',
  startDate: '',
  endDate: ''
})

// 日期范围
const dateRange = ref<string[]>([])

// 监听日期范围变化
const onDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    filterForm.startDate = dateRange.value[0]
    filterForm.endDate = dateRange.value[1]
  } else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
}

// 获取日志列表
const fetchLogs = async () => {
  isLoading.value = true
  try {
    // 实际环境中应该调用API获取日志列表
    // const response = await logsApi.getLogs({
    //   ...filterForm,
    //   page: currentPage.value,
    //   pageSize: pageSize.value
    // })
    
    // 使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockLogs = generateMockLogs()
    logs.value = mockLogs.slice(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    )
    total.value = mockLogs.length
  } catch (error) {
    console.error('获取日志失败:', error)
    ElMessage.error('获取日志失败')
  } finally {
    isLoading.value = false
  }
}

// 生成模拟日志数据
const generateMockLogs = () => {
  const types = ['system', 'operation', 'security', 'error']
  const levels = ['info', 'warning', 'error', 'critical']
  const users = ['admin', 'manager', 'operator', 'system']
  const modules = ['认证', '合同', '用户', '设置', '备份', '系统']
  const operations = [
    '登录系统', '新增合同', '修改用户', '导出数据', 
    '系统启动', '备份数据', '修改设置', '删除记录'
  ]
  
  const mockLogs = []
  
  for (let i = 0; i < 100; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const module = modules[Math.floor(Math.random() * modules.length)]
    const operation = operations[Math.floor(Math.random() * operations.length)]
    
    // 只保留符合筛选条件的日志
    if (
      (filterForm.logType && filterForm.logType !== type) || 
      (filterForm.level && filterForm.level !== level) ||
      (filterForm.user && !user.includes(filterForm.user))
    ) {
      continue
    }
    
    // 生成随机日期
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 90))
    const timestamp = dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    
    // 日期筛选
    if (
      (filterForm.startDate && timestamp < filterForm.startDate) ||
      (filterForm.endDate && timestamp > filterForm.endDate)
    ) {
      continue
    }
    
    mockLogs.push({
      id: `LOG${(1000000 + i).toString()}`,
      timestamp,
      type,
      level,
      user,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      module,
      path: `/api/${module.toLowerCase()}`,
      message: `${user} ${operation}`,
      detail: {
        requestMethod: 'POST',
        requestPath: `/api/${module.toLowerCase()}`,
        requestParams: { id: `${10000 + i}`, action: operation },
        responseCode: 200,
        responseTime: `${Math.floor(Math.random() * 500)}ms`
      }
    })
  }
  
  // 按时间倒序排序
  return mockLogs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

// 搜索日志
const searchLogs = () => {
  currentPage.value = 1
  onDateRangeChange()
  fetchLogs()
}

// 重置筛选条件
const resetFilters = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key as keyof typeof filterForm] = ''
  })
  dateRange.value = []
  currentPage.value = 1
  fetchLogs()
}

// 导出日志
const exportLogs = () => {
  ElMessageBox.confirm(
    '确定要导出当前筛选条件下的所有日志吗？',
    '导出日志',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage({
      type: 'success',
      message: '日志导出成功，请在下载中心查看'
    })
  }).catch(() => {})
}

// 查看日志详情
const viewLogDetail = (log: any) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchLogs()
}

// 分页页码变更
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchLogs()
}

// 获取日志类型标签样式
const getLogTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    system: 'info',
    operation: 'success',
    security: 'warning',
    error: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取日志类型名称
const getLogTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    system: '系统',
    operation: '操作',
    security: '安全',
    error: '错误'
  }
  return typeMap[type] || type
}

// 获取日志级别标签样式
const getLevelTag = (level: string) => {
  const levelMap: Record<string, string> = {
    info: '',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return levelMap[level] || ''
}

// 获取日志级别名称
const getLevelName = (level: string) => {
  const levelMap: Record<string, string> = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return levelMap[level] || level
}

// 格式化详细数据
const formatDetailData = (detail: any) => {
  if (!detail) return ''
  return JSON.stringify(detail, null, 2)
}

// 组件挂载时获取日志列表
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.logs-panel {
  padding: 0;
}

.filters-area {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.logs-table {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.log-detail-data {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  margin: 0;
}
</style> 