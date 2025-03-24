<template>
  <div class="log-management-panel" v-loading="loading">
    <div class="filter-section">
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="日志类型">
          <el-select v-model="queryParams.logType" placeholder="选择日志类型" clearable>
            <el-option label="系统日志" value="system" />
            <el-option label="操作日志" value="operation" />
            <el-option label="安全日志" value="security" />
            <el-option label="异常日志" value="error" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="级别">
          <el-select v-model="queryParams.level" placeholder="选择日志级别" clearable>
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
            <el-option label="严重" value="critical" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="操作人">
          <el-input v-model="queryParams.username" placeholder="输入操作人" clearable />
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="log-table-section">
      <div class="table-toolbar">
        <el-button type="danger" :disabled="selectedLogs.length === 0" @click="confirmDeleteLogs">批量删除</el-button>
        <el-button type="primary" @click="exportLogs">导出日志</el-button>
        <el-button @click="clearAllLogs">清空日志</el-button>
      </div>
      
      <el-table
        :data="logData"
        v-loading="isLoading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="日志ID" prop="id" width="80" />
        <el-table-column label="日志类型" prop="logType" width="100">
          <template #default="scope">
            <el-tag :type="getLogTypeTag(scope.row.logType)">
              {{ getLogTypeLabel(scope.row.logType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="级别" prop="level" width="80">
          <template #default="scope">
            <el-tag :type="getLevelTag(scope.row.level)" effect="dark">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" prop="content" show-overflow-tooltip />
        <el-table-column label="操作人" prop="username" width="120" />
        <el-table-column label="IP地址" prop="ipAddress" width="130" />
        <el-table-column label="时间" prop="createdAt" width="160" :formatter="formatDate" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="viewLogDetail(scope.row)">查看</el-button>
            <el-button size="small" type="danger" @click="confirmDeleteLog(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 日志详情对话框 -->
    <el-dialog v-model="logDetailVisible" title="日志详情" width="50%">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="日志类型">{{ getLogTypeLabel(currentLog.logType) }}</el-descriptions-item>
        <el-descriptions-item label="级别">{{ currentLog.level }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatDateDetail(currentLog.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ currentLog.content }}</el-descriptions-item>
        <el-descriptions-item label="详细信息" :span="2">
          <pre class="log-detail-pre">{{ currentLog.details || '无详细信息' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
      <span>{{ deleteDialogMessage }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleDeleteLogs">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 清空确认对话框 -->
    <el-dialog v-model="clearDialogVisible" title="确认清空" width="30%">
      <span>确定要清空所有日志吗？此操作不可撤销！</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="clearDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleClearLogs">确认清空</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// 接收父组件传递的加载状态
const props = defineProps<{
  loading: boolean
}>()

// 模拟日志数据 - 实际项目中应该从API获取
const logData = ref([])
const total = ref(0)
const isLoading = ref(false)
const selectedLogs = ref([])

// 查询参数
const queryParams = reactive({
  logType: '',
  level: '',
  username: '',
  dateRange: [],
  page: 1,
  pageSize: 10
})

// 对话框控制
const logDetailVisible = ref(false)
const deleteDialogVisible = ref(false)
const clearDialogVisible = ref(false)
const currentLog = ref(null)
const deleteDialogMessage = ref('')
const logsToDelete = ref([])

// 获取日志数据
const fetchLogs = async () => {
  isLoading.value = true
  
  try {
    // 这里应该调用API获取日志数据
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟日志数据 - 实际项目中应该从API获取
    const mockLogs = Array(queryParams.pageSize).fill(0).map((_, index) => {
      const id = (queryParams.page - 1) * queryParams.pageSize + index + 1
      const types = ['system', 'operation', 'security', 'error']
      const levels = ['info', 'warning', 'error', 'critical']
      const users = ['admin', 'user1', 'user2', 'system']
      
      return {
        id,
        logType: types[Math.floor(Math.random() * types.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        content: `这是一条模拟的日志内容 ${id}`,
        username: users[Math.floor(Math.random() * users.length)],
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        details: `详细信息...
请求路径: /api/example/${id}
方法: POST
参数: { "id": ${id}, "name": "测试" }
响应: { "code": 200, "message": "success" }`
      }
    })
    
    // 根据查询条件过滤
    let filteredLogs = [...mockLogs]
    if (queryParams.logType) {
      filteredLogs = filteredLogs.filter(log => log.logType === queryParams.logType)
    }
    if (queryParams.level) {
      filteredLogs = filteredLogs.filter(log => log.level === queryParams.level)
    }
    if (queryParams.username) {
      filteredLogs = filteredLogs.filter(log => log.username.includes(queryParams.username))
    }
    if (queryParams.dateRange && queryParams.dateRange.length === 2) {
      const startDate = new Date(queryParams.dateRange[0]).getTime()
      const endDate = new Date(queryParams.dateRange[1]).getTime() + 86400000 // 加一天
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.createdAt).getTime()
        return logDate >= startDate && logDate <= endDate
      })
    }
    
    logData.value = filteredLogs
    total.value = 200 // 模拟总数
    
  } catch (error) {
    ElMessage.error('获取日志数据失败')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchLogs()
}

// 重置查询
const resetQuery = () => {
  Object.assign(queryParams, {
    logType: '',
    level: '',
    username: '',
    dateRange: [],
    page: 1,
    pageSize: 10
  })
  fetchLogs()
}

// 分页处理
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  fetchLogs()
}

const handleCurrentChange = (page: number) => {
  queryParams.page = page
  fetchLogs()
}

// 表格选择变更
const handleSelectionChange = (selection) => {
  selectedLogs.value = selection
}

// 查看日志详情
const viewLogDetail = (log) => {
  currentLog.value = log
  logDetailVisible.value = true
}

// 确认删除单条日志
const confirmDeleteLog = (log) => {
  logsToDelete.value = [log.id]
  deleteDialogMessage.value = `确定要删除ID为 ${log.id} 的日志吗？`
  deleteDialogVisible.value = true
}

// 确认批量删除日志
const confirmDeleteLogs = () => {
  if (selectedLogs.value.length === 0) {
    ElMessage.warning('请选择要删除的日志')
    return
  }
  
  logsToDelete.value = selectedLogs.value.map(log => log.id)
  deleteDialogMessage.value = `确定要删除选中的 ${logsToDelete.value.length} 条日志吗？`
  deleteDialogVisible.value = true
}

// 删除日志
const handleDeleteLogs = async () => {
  try {
    // 这里应该调用API删除日志
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(`成功删除 ${logsToDelete.value.length} 条日志`)
    deleteDialogVisible.value = false
    fetchLogs()
  } catch (error) {
    ElMessage.error('删除日志失败')
    console.error(error)
  }
}

// 确认清空所有日志
const clearAllLogs = () => {
  clearDialogVisible.value = true
}

// 清空所有日志
const handleClearLogs = async () => {
  try {
    // 这里应该调用API清空日志
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('成功清空所有日志')
    clearDialogVisible.value = false
    fetchLogs()
  } catch (error) {
    ElMessage.error('清空日志失败')
    console.error(error)
  }
}

// 导出日志
const exportLogs = async () => {
  try {
    ElMessage.success('日志导出成功')
  } catch (error) {
    ElMessage.error('日志导出失败')
    console.error(error)
  }
}

// 格式化日期
const formatDate = (row, column) => {
  return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')
}

// 格式化详细日期
const formatDateDetail = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取日志类型标签样式
const getLogTypeTag = (type) => {
  const map = {
    system: '',
    operation: 'success',
    security: 'warning',
    error: 'danger'
  }
  return map[type] || ''
}

// 获取日志类型显示标签
const getLogTypeLabel = (type) => {
  const map = {
    system: '系统日志',
    operation: '操作日志',
    security: '安全日志',
    error: '异常日志'
  }
  return map[type] || type
}

// 获取日志级别标签样式
const getLevelTag = (level) => {
  const map = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return map[level] || ''
}

// 组件挂载时获取日志数据
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.log-management-panel {
  padding: 0;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.log-table-section {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.table-toolbar {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.log-detail-pre {
  white-space: pre-wrap;
  font-family: monospace;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
</style> 