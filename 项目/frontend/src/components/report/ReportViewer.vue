<template>
  <div class="report-viewer">
    <!-- 报表过滤条件 -->
    <div class="report-filter">
      <el-form :model="localParams" label-width="100px" size="default">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="localParams.timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="时间维度">
              <el-select v-model="localParams.timeDimension" style="width: 100%">
                <el-option label="按天" :value="TimeDimension.DAY" />
                <el-option label="按周" :value="TimeDimension.WEEK" />
                <el-option label="按月" :value="TimeDimension.MONTH" />
                <el-option label="按季度" :value="TimeDimension.QUARTER" />
                <el-option label="按年" :value="TimeDimension.YEAR" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="图表类型">
              <el-select v-model="localParams.chartType" style="width: 100%">
                <el-option label="柱状图" :value="ChartType.BAR" />
                <el-option label="折线图" :value="ChartType.LINE" />
                <el-option label="饼图" :value="ChartType.PIE" />
                <el-option label="表格" :value="ChartType.TABLE" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="4">
            <el-form-item>
              <el-button type="primary" @click="applyFilter">
                <el-icon><Search /></el-icon> 应用筛选
              </el-button>
              <el-button @click="resetFilter">
                <el-icon><RefreshRight /></el-icon>
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8" v-if="showDepartmentFilter">
            <el-form-item label="部门">
              <el-select v-model="localParams.departments" multiple style="width: 100%">
                <el-option
                  v-for="dept in departmentOptions"
                  :key="dept.value"
                  :label="dept.label"
                  :value="dept.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8" v-if="showCategoryFilter">
            <el-form-item label="合同分类">
              <el-select v-model="localParams.categories" multiple style="width: 100%">
                <el-option
                  v-for="category in categoryOptions"
                  :key="category.value"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8" v-if="showStatusFilter">
            <el-form-item label="合同状态">
              <el-select v-model="localParams.statuses" multiple style="width: 100%">
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8" v-if="showAmountFilter">
            <el-form-item label="金额范围">
              <el-input-number
                v-model="localParams.minAmount"
                :min="0"
                placeholder="最小金额"
                style="width: 45%"
              />
              <span style="margin: 0 5px;">-</span>
              <el-input-number
                v-model="localParams.maxAmount"
                :min="0"
                placeholder="最大金额"
                style="width: 45%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="report-error">
      <el-result
        icon="error"
        title="获取报表数据失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="$emit('refresh')">重试</el-button>
        </template>
      </el-result>
    </div>
    
    <!-- 报表内容 -->
    <div v-else-if="data" class="report-content">
      <!-- 汇总信息 -->
      <div class="report-summary" v-if="data.summary">
        <el-card class="summary-card">
          <template #header>
            <div class="summary-header">
              <h3>报表汇总</h3>
              <span class="update-time">更新时间: {{ formatDateTime(data.updateTime) }}</span>
            </div>
          </template>
          
          <div class="summary-content">
            <div v-for="(value, key) in data.summary" :key="key" class="summary-item">
              <div class="summary-label">{{ formatSummaryKey(key) }}</div>
              <div class="summary-value">{{ formatSummaryValue(key, value) }}</div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 图表展示 -->
      <div class="report-chart">
        <el-card>
          <template #header>
            <div class="chart-header">
              <h3>{{ data.title }}</h3>
              <div class="chart-actions">
                <el-tooltip content="图表设置" placement="top">
                  <el-button size="small" circle>
                    <el-icon><Setting /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="刷新数据" placement="top">
                  <el-button size="small" circle @click="$emit('refresh')">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </template>
          
          <div class="chart-container">
            <div v-if="data.chartType === ChartType.TABLE" class="table-chart">
              <!-- 表格展示 -->
              <el-table
                :data="tableData"
                border
                style="width: 100%"
                max-height="500"
              >
                <el-table-column
                  v-for="column in tableColumns"
                  :key="column.prop"
                  :prop="column.prop"
                  :label="column.label"
                  :width="column.width"
                  :sortable="column.sortable"
                />
              </el-table>
            </div>
            <div v-else class="echarts-chart" ref="chartRef"></div>
          </div>
        </el-card>
      </div>
      
      <!-- 详细数据 -->
      <div class="report-details" v-if="data.details && data.details.length > 0">
        <el-card>
          <template #header>
            <div class="details-header">
              <h3>详细数据</h3>
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="data.details.length"
                background
              />
            </div>
          </template>
          
          <el-table
            :data="paginatedDetails"
            border
            style="width: 100%"
          >
            <el-table-column
              v-for="column in detailColumns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :sortable="column.sortable"
            />
          </el-table>
        </el-card>
      </div>
    </div>
    
    <!-- 无数据 -->
    <div v-else class="report-empty">
      <el-empty description="暂无报表数据">
        <el-button type="primary" @click="$emit('refresh')">刷新</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Search, RefreshRight, Setting, Refresh } from '@element-plus/icons-vue'
import { ReportResult, ReportParams, ChartType, TimeDimension } from '@/api/report'
import * as echarts from 'echarts'

// 接收的属性
const props = defineProps<{
  data: ReportResult | null;
  error: string | null;
  params: ReportParams;
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'params-change', params: ReportParams): void;
  (e: 'refresh'): void;
}>()

// 状态
const localParams = ref<ReportParams>({ ...props.params })
const chartRef = ref<HTMLElement | null>(null)
const chart = ref<echarts.ECharts | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

// 模拟数据
const departmentOptions = [
  { label: '销售部', value: 'sales' },
  { label: '采购部', value: 'procurement' },
  { label: '法务部', value: 'legal' },
  { label: '财务部', value: 'finance' },
  { label: '人力资源部', value: 'hr' }
]

const categoryOptions = [
  { label: '销售合同', value: 'sales' },
  { label: '采购合同', value: 'procurement' },
  { label: '服务合同', value: 'service' },
  { label: '租赁合同', value: 'lease' },
  { label: '劳务合同', value: 'labor' }
]

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '审核中', value: 'reviewing' },
  { label: '已生效', value: 'active' },
  { label: '已到期', value: 'expired' },
  { label: '已终止', value: 'terminated' }
]

// 计算属性
const showDepartmentFilter = computed(() => {
  // 根据报表类型显示部门筛选
  const departmentReportTypes = [
    'contract_department',
    'user_performance'
  ]
  return props.data && departmentReportTypes.includes(props.data.params.type as string)
})

const showCategoryFilter = computed(() => {
  // 根据报表类型显示分类筛选
  const categoryReportTypes = [
    'contract_category',
    'contract_summary'
  ]
  return props.data && categoryReportTypes.includes(props.data.params.type as string)
})

const showStatusFilter = computed(() => {
  // 根据报表类型显示状态筛选
  const statusReportTypes = [
    'contract_status',
    'contract_summary'
  ]
  return props.data && statusReportTypes.includes(props.data.params.type as string)
})

const showAmountFilter = computed(() => {
  // 根据报表类型显示金额筛选
  const amountReportTypes = [
    'contract_amount',
    'contract_summary'
  ]
  return props.data && amountReportTypes.includes(props.data.params.type as string)
})

// 表格数据处理
const tableData = computed(() => {
  if (!props.data || !props.data.series || props.data.series.length === 0) {
    return []
  }
  
  // 如果有详细数据，优先使用
  if (props.data.details && props.data.details.length > 0) {
    return props.data.details
  }
  
  // 将 series 数据转换为表格数据
  const categories = props.data.categories || []
  const series = props.data.series
  
  // 如果没有分类，直接返回系列数据
  if (categories.length === 0) {
    return series.map(s => ({
      name: s.name,
      value: s.data,
      type: s.type
    }))
  }
  
  // 如果有分类，构建表格数据
  return categories.map((category, index) => {
    const row: Record<string, any> = { category }
    
    series.forEach(s => {
      row[s.name] = s.data[index]
    })
    
    return row
  })
})

// 表格列处理
const tableColumns = computed(() => {
  if (!props.data || !tableData.value || tableData.value.length === 0) {
    return []
  }
  
  // 获取第一行数据的所有键作为列
  const firstRow = tableData.value[0]
  return Object.keys(firstRow).map(key => ({
    prop: key,
    label: formatColumnName(key),
    sortable: true,
    width: ''
  }))
})

// 详细数据分页
const paginatedDetails = computed(() => {
  if (!props.data || !props.data.details) {
    return []
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return props.data.details.slice(start, end)
})

// 详细数据列处理
const detailColumns = computed(() => {
  if (!props.data || !props.data.details || props.data.details.length === 0) {
    return []
  }
  
  // 获取第一行数据的所有键作为列
  const firstRow = props.data.details[0]
  return Object.keys(firstRow).map(key => ({
    prop: key,
    label: formatColumnName(key),
    sortable: true,
    width: ''
  }))
})

// 格式化列名
const formatColumnName = (key: string) => {
  const nameMap: Record<string, string> = {
    id: 'ID',
    name: '名称',
    title: '标题',
    type: '类型',
    category: '分类',
    status: '状态',
    amount: '金额',
    count: '数量',
    ratio: '比例',
    date: '日期',
    time: '时间',
    createTime: '创建时间',
    updateTime: '更新时间',
    department: '部门',
    user: '用户'
  }
  
  return nameMap[key] || key
}

// 格式化汇总键名
const formatSummaryKey = (key: string) => {
  const keyMap: Record<string, string> = {
    totalCount: '合同总数',
    totalAmount: '合同总金额',
    activeCount: '活跃合同数',
    activeAmount: '活跃合同金额',
    expiringCount: '即将到期合同数',
    expiredCount: '已过期合同数',
    avgAmount: '平均合同金额',
    maxAmount: '最大合同金额',
    minAmount: '最小合同金额',
    createdThisMonth: '本月新增合同',
    createdThisYear: '本年新增合同'
  }
  
  return keyMap[key] || key
}

// 格式化汇总值
const formatSummaryValue = (key: string, value: any) => {
  // 金额相关的键
  if (key.includes('Amount')) {
    return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
  }
  
  // 数量相关的键
  if (key.includes('Count')) {
    return value.toLocaleString('zh-CN')
  }
  
  // 日期相关的键
  if (key.includes('Date') || key.includes('Time')) {
    return new Date(value).toLocaleString('zh-CN')
  }
  
  // 百分比相关的键
  if (key.includes('Ratio') || key.includes('Percent')) {
    return `${(value * 100).toFixed(2)}%`
  }
  
  return value
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return ''
  
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return dateTime
  }
}

// 应用筛选
const applyFilter = () => {
  emit('params-change', { ...localParams.value })
}

// 重置筛选
const resetFilter = () => {
  // 只重置筛选条件，保留基本参数
  const basicParams = {
    chartType: localParams.value.chartType,
    timeDimension: localParams.value.timeDimension,
    timeRange: localParams.value.timeRange
  }
  
  localParams.value = { ...basicParams }
  emit('params-change', { ...localParams.value })
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !props.data) return
  
  // 销毁之前的图表实例
  if (chart.value) {
    chart.value.dispose()
  }
  
  // 创建新的图表实例
  chart.value = echarts.init(chartRef.value)
  
  // 设置图表选项
  const options = getChartOptions()
  if (options) {
    chart.value.setOption(options)
  }
}

// 获取图表配置
const getChartOptions = () => {
  if (!props.data) return null
  
  const { title, categories, series, chartType } = props.data
  
  // 基本配置
  const options: echarts.EChartsOption = {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: chartType === ChartType.PIE ? 'item' : 'axis',
      formatter: chartType === ChartType.PIE ? '{b}: {c} ({d}%)' : undefined
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      data: series.map(s => s.name)
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    }
  }
  
  // 根据图表类型添加特定配置
  if (chartType === ChartType.PIE) {
    options.series = [{
      name: title,
      type: 'pie',
      radius: '55%',
      center: ['50%', '50%'],
      data: series[0].data.map((value, index) => ({
        name: categories ? categories[index] : `项目${index + 1}`,
        value
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  } else {
    options.xAxis = {
      type: 'category',
      data: categories || [],
      axisLabel: {
        rotate: categories && categories.length > 10 ? 45 : 0
      }
    }
    
    options.yAxis = {
      type: 'value'
    }
    
    options.series = series.map(s => ({
      name: s.name,
      type: s.type.toLowerCase(),
      data: s.data,
      smooth: s.type === ChartType.LINE
    }))
  }
  
  return options
}

// 处理窗口大小变化
const handleResize = () => {
  if (chart.value) {
    chart.value.resize()
  }
}

// 监听属性变化
watch(() => props.data, () => {
  nextTick(() => {
    initChart()
  })
}, { deep: true })

watch(() => props.params, () => {
  localParams.value = { ...props.params }
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  if (chart.value) {
    chart.value.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.report-viewer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-filter {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-summary {
  margin-bottom: 20px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-header h3 {
  margin: 0;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.summary-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.summary-item {
  flex: 1;
  min-width: 150px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 10px;
}

.chart-container {
  min-height: 400px;
  margin: 10px 0;
}

.echarts-chart {
  height: 500px;
  width: 100%;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-header h3 {
  margin: 0;
}

.report-error,
.report-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style> 