<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useContractStore } from '../stores/contract'
import type { ContractType, ContractStatus } from '../api/contract'
import { ElMessage, ElDatePicker } from 'element-plus'
import * as echarts from 'echarts'
import { DataAnalysis, Plus, Download, Close } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useReportStore } from '@/stores/report'
import { ReportTemplate, ReportParams, ReportType, ChartType, TimeDimension } from '@/api/report'
import ReportTemplateCard from '@/components/report/ReportTemplateCard.vue'
import ReportViewer from '@/components/report/ReportViewer.vue'
import ReportTemplateEditor from '@/components/report/ReportTemplateEditor.vue'

const contractStore = useContractStore()
const isLoading = ref(false)
const dateRange = ref<[Date, Date] | null>(null)
const chartLoading = ref(false)

// 图表引用
const statusPieRef = ref<HTMLElement | null>(null)
const statusPieChart = ref<echarts.ECharts | null>(null)

const typePieRef = ref<HTMLElement | null>(null)
const typePieChart = ref<echarts.ECharts | null>(null)

const amountBarRef = ref<HTMLElement | null>(null)
const amountBarChart = ref<echarts.ECharts | null>(null)

const trendLineRef = ref<HTMLElement | null>(null)
const trendLineChart = ref<echarts.ECharts | null>(null)

// 过滤条件
const filters = reactive({
  contractType: null as ContractType | null,
  status: null as ContractStatus | null,
  timeRange: 'year' as 'month' | 'quarter' | 'year' | 'custom',
  dateRange: null as [string, string] | null
})

// 类型选项
const typeOptions = [
  { label: '全部类型', value: null },
  { label: '销售合同', value: 'sales' },
  { label: '采购合同', value: 'purchase' },
  { label: '服务合同', value: 'service' },
  { label: '劳动合同', value: 'employment' },
  { label: '租赁合同', value: 'lease' },
  { label: '其他', value: 'other' }
]

// 状态选项
const statusOptions = [
  { label: '全部状态', value: null },
  { label: '草稿', value: 'draft' },
  { label: '待审批', value: 'pending' },
  { label: '生效中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已终止', value: 'terminated' },
  { label: '已过期', value: 'expired' }
]

// 时间范围选项
const timeRangeOptions = [
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
  { label: '自定义', value: 'custom' }
]

// 合同状态数据
const statusData = computed(() => {
  if (!contractStore.statistics) return []
  
  const { totalCount, activeCount, pendingCount, expiredCount } = contractStore.statistics
  const completedCount = totalCount - activeCount - pendingCount - expiredCount
  
  return [
    { value: activeCount, name: '生效中' },
    { value: pendingCount, name: '待审批' },
    { value: completedCount, name: '已完成' },
    { value: expiredCount, name: '已过期' }
  ]
})

// 合同类型数量数据
const typeData = computed(() => {
  if (!contractStore.statistics?.typeDistribution) return []
  
  const typeDistribution = contractStore.statistics.typeDistribution
  return Object.keys(typeDistribution).map(key => ({
    value: typeDistribution[key as ContractType],
    name: getTypeName(key as ContractType)
  }))
})

// 合同金额数据
const amountData = computed(() => {
  if (!contractStore.statistics?.amountDistribution) return { categories: [], data: [] }
  
  const amountDistribution = contractStore.statistics.amountDistribution
  const categories = Object.keys(amountDistribution).map(key => getTypeName(key as ContractType))
  const data = Object.values(amountDistribution)
  
  return { categories, data }
})

// 合同趋势数据
const trendData = computed(() => {
  if (!contractStore.statistics?.monthlyContractCount) return { months: [], counts: [] }
  
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const counts = contractStore.statistics.monthlyContractCount
  
  return { months, counts }
})

// 统计数字
const stats = computed(() => {
  if (!contractStore.statistics) {
    return {
      totalCount: 0,
      activeCount: 0,
      pendingCount: 0,
      expiringCount: 0,
      totalAmount: 0,
      avgAmount: 0
    }
  }
  
  const { totalCount, activeCount, pendingCount, expiringSoonCount } = contractStore.statistics
  
  // 计算总金额和平均金额
  let totalAmount = 0
  let contractCount = 0
  
  if (contractStore.statistics.amountDistribution) {
    Object.values(contractStore.statistics.amountDistribution).forEach(amount => {
      totalAmount += amount
      contractCount++
    })
  }
  
  const avgAmount = contractCount > 0 ? totalAmount / contractCount : 0
  
  return {
    totalCount,
    activeCount,
    pendingCount,
    expiringCount: expiringSoonCount,
    totalAmount,
    avgAmount
  }
})

// 获取类型名称
function getTypeName(type: ContractType): string {
  const typeMap: Record<ContractType, string> = {
    'sales': '销售合同',
    'purchase': '采购合同',
    'service': '服务合同',
    'employment': '劳动合同',
    'lease': '租赁合同',
    'other': '其他'
  }
  return typeMap[type] || '未知类型'
}

// 格式化金额
function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// 初始化图表
function initCharts() {
  // 状态饼图
  if (statusPieRef.value) {
    statusPieChart.value = echarts.init(statusPieRef.value)
    statusPieChart.value.setOption({
      title: {
        text: '合同状态分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: ['生效中', '待审批', '已完成', '已过期']
      },
      series: [
        {
          name: '合同状态',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: statusData.value
        }
      ]
    })
  }
  
  // 类型饼图
  if (typePieRef.value) {
    typePieChart.value = echarts.init(typePieRef.value)
    typePieChart.value.setOption({
      title: {
        text: '合同类型分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: typeData.value.map(item => item.name)
      },
      series: [
        {
          name: '合同类型',
          type: 'pie',
          radius: '60%',
          data: typeData.value,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  }
  
  // 金额柱状图
  if (amountBarRef.value) {
    amountBarChart.value = echarts.init(amountBarRef.value)
    amountBarChart.value.setOption({
      title: {
        text: '各类型合同金额',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          const data = params[0]
          return `${data.name}: ${formatAmount(data.value)}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: amountData.value.categories,
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value: number) {
            return (value / 10000) + '万'
          }
        }
      },
      series: [
        {
          name: '合同金额',
          type: 'bar',
          barWidth: '60%',
          data: amountData.value.data
        }
      ]
    })
  }
  
  // 趋势线图
  if (trendLineRef.value) {
    trendLineChart.value = echarts.init(trendLineRef.value)
    trendLineChart.value.setOption({
      title: {
        text: '合同数量趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.value.months
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '合同数量',
          type: 'line',
          data: trendData.value.counts,
          areaStyle: {},
          smooth: true
        }
      ]
    })
  }
}

// 更新图表
function updateCharts() {
  if (statusPieChart.value) {
    statusPieChart.value.setOption({
      series: [
        {
          data: statusData.value
        }
      ]
    })
  }
  
  if (typePieChart.value) {
    typePieChart.value.setOption({
      legend: {
        data: typeData.value.map(item => item.name)
      },
      series: [
        {
          data: typeData.value
        }
      ]
    })
  }
  
  if (amountBarChart.value) {
    amountBarChart.value.setOption({
      xAxis: {
        data: amountData.value.categories
      },
      series: [
        {
          data: amountData.value.data
        }
      ]
    })
  }
  
  if (trendLineChart.value) {
    trendLineChart.value.setOption({
      xAxis: {
        data: trendData.value.months
      },
      series: [
        {
          data: trendData.value.counts
        }
      ]
    })
  }
}

// 应用筛选器
const applyFilters = async () => {
  try {
    chartLoading.value = true
    
    // 构建过滤参数
    const params: any = {}
    
    if (filters.contractType) {
      params.type = filters.contractType
    }
    
    if (filters.status) {
      params.status = filters.status
    }
    
    if (filters.timeRange === 'custom' && dateRange.value) {
      const [start, end] = dateRange.value
      params.startDate = start.toISOString().split('T')[0]
      params.endDate = end.toISOString().split('T')[0]
    } else {
      // 根据选择的时间范围设置日期
      const now = new Date()
      let startDate = new Date()
      
      if (filters.timeRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (filters.timeRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
      } else if (filters.timeRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1)
      }
      
      params.startDate = startDate.toISOString().split('T')[0]
      params.endDate = now.toISOString().split('T')[0]
    }
    
    // 获取统计数据
    await contractStore.fetchStatistics()
    
    updateCharts()
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    chartLoading.value = false
  }
}

// 重置筛选器
const resetFilters = () => {
  filters.contractType = null
  filters.status = null
  filters.timeRange = 'year'
  filters.dateRange = null
  dateRange.value = null
  
  applyFilters()
}

// 导出报表
const exportReport = () => {
  ElMessage.success('报表导出功能待实现')
}

// 窗口尺寸变化时重绘图表
window.addEventListener('resize', () => {
  statusPieChart.value?.resize()
  typePieChart.value?.resize()
  amountBarChart.value?.resize()
  trendLineChart.value?.resize()
})

// 初始化数据
const fetchData = async () => {
  try {
    isLoading.value = true
    await contractStore.fetchStatistics()
    
    // 等DOM更新后初始化图表
    setTimeout(() => {
      initCharts()
    }, 0)
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// Store
const reportStore = useReportStore()

// 状态
const activeTab = ref('favorite')
const previewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const templateToDelete = ref<ReportTemplate | null>(null)
const templateToExport = ref<ReportTemplate | null>(null)
const exportFormat = ref<'excel' | 'pdf' | 'csv'>('excel')
const exportTimeRange = ref<[string, string] | null>(null)
const reportParams = ref<ReportParams>({})

// 计算属性
const loading = computed(() => reportStore.loading)
const error = computed(() => reportStore.error)
const reportData = computed(() => reportStore.reportData)
const favoriteTemplates = computed(() => reportStore.getFavoriteTemplates)
const systemTemplates = computed(() => reportStore.getSystemTemplates)
const userTemplates = computed(() => reportStore.getUserTemplates)
const currentTemplate = computed(() => reportStore.currentTemplate)

// 检查报表模板是否已收藏
const isFavorite = (id: string) => {
  return reportStore.favoriteTemplates.includes(id)
}

// 选择报表模板
const selectTemplate = async (template: ReportTemplate) => {
  await reportStore.fetchReportTemplate(template.id)
  reportParams.value = { ...template.defaultParams }
  loadReportData()
  previewDialogVisible.value = true
}

// 切换收藏状态
const toggleFavorite = (template: ReportTemplate) => {
  if (isFavorite(template.id)) {
    reportStore.removeFavoriteTemplate(template.id)
    ElMessage.success('已取消收藏')
  } else {
    reportStore.addFavoriteTemplate(template.id)
    ElMessage.success('已添加到收藏')
  }
}

// 创建新的报表模板
const createNewTemplate = () => {
  reportStore.createNewTemplate()
  editDialogVisible.value = true
}

// 确认删除报表模板
const confirmDelete = (template: ReportTemplate) => {
  templateToDelete.value = template
  deleteDialogVisible.value = true
}

// 删除报表模板
const deleteTemplate = async () => {
  if (!templateToDelete.value) return
  
  const success = await reportStore.removeReportTemplate(templateToDelete.value.id)
  if (success) {
    ElMessage.success('报表模板已删除')
    deleteDialogVisible.value = false
  }
}

// 准备导出报表
const exportTemplate = (template: ReportTemplate) => {
  templateToExport.value = template
  exportTimeRange.value = template.defaultParams.timeRange || [
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ]
  exportDialogVisible.value = true
}

// 执行报表导出
const doExportReport = async () => {
  if (!templateToExport.value) return
  
  const params: ReportParams = {
    ...templateToExport.value.defaultParams,
    timeRange: exportTimeRange.value || undefined
  }
  
  const success = await reportStore.exportReportData(
    templateToExport.value.type,
    params,
    exportFormat.value
  )
  
  if (success) {
    ElMessage.success('报表导出成功')
    exportDialogVisible.value = false
  }
}

// 导出当前正在预览的报表
const exportCurrentReport = () => {
  if (!currentTemplate.value) return
  
  exportTemplate(currentTemplate.value)
}

// 保存报表模板
const saveTemplate = async (template: Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'>) => {
  const result = await reportStore.saveReportTemplate(template)
  if (result) {
    ElMessage.success('报表模板保存成功')
    editDialogVisible.value = false
  }
}

// 加载报表数据
const loadReportData = async () => {
  if (!currentTemplate.value) return
  
  await reportStore.fetchReportData(
    currentTemplate.value.type,
    reportParams.value
  )
}

// 更新报表参数并重新加载数据
const updateReportParams = (params: ReportParams) => {
  reportParams.value = params
  loadReportData()
}

// 生命周期钩子
onMounted(async () => {
  await reportStore.init()
})
</script>

<template>
  <div class="report-container">
    <!-- 页面标题与操作按钮 -->
    <div class="page-header">
      <div class="left">
        <h2><el-icon><DataAnalysis /></el-icon> 报表分析</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>报表分析</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="right">
        <el-button type="primary" @click="createNewTemplate">
          <el-icon><Plus /></el-icon> 新建报表
        </el-button>
      </div>
    </div>

    <!-- 报表模板选择与展示 -->
    <el-tabs v-model="activeTab" class="report-tabs">
      <el-tab-pane label="收藏报表" name="favorite" lazy>
        <div v-if="favoriteTemplates.length === 0" class="empty-tip">
          <el-empty description="暂无收藏的报表模板" />
        </div>
        <div v-else class="template-cards">
          <report-template-card 
            v-for="template in favoriteTemplates" 
            :key="template.id"
            :template="template"
            :is-favorite="true"
            @select="selectTemplate"
            @toggle-favorite="toggleFavorite"
            @delete="confirmDelete"
            @export="exportTemplate"
          />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="系统报表" name="system" lazy>
        <div class="template-cards">
          <report-template-card 
            v-for="template in systemTemplates" 
            :key="template.id"
            :template="template"
            :is-favorite="isFavorite(template.id)"
            @select="selectTemplate"
            @toggle-favorite="toggleFavorite"
            @export="exportTemplate"
          />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="自定义报表" name="custom" lazy>
        <div v-if="userTemplates.length === 0" class="empty-tip">
          <el-empty description="暂无自定义报表模板">
            <el-button type="primary" @click="createNewTemplate">新建报表</el-button>
          </el-empty>
        </div>
        <div v-else class="template-cards">
          <report-template-card 
            v-for="template in userTemplates" 
            :key="template.id"
            :template="template"
            :is-favorite="isFavorite(template.id)"
            @select="selectTemplate"
            @toggle-favorite="toggleFavorite"
            @delete="confirmDelete"
            @export="exportTemplate"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 报表预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="currentTemplate?.name || '报表预览'"
      fullscreen
      destroy-on-close
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="dialog-header">
          <h4 :id="titleId" :class="titleClass">
            {{ currentTemplate?.name || '报表预览' }}
          </h4>
          <div class="dialog-actions">
            <el-button type="primary" @click="exportCurrentReport">
              <el-icon><Download /></el-icon> 导出
            </el-button>
            <el-tooltip content="关闭" placement="bottom">
              <el-button circle @click="close">
                <el-icon><Close /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      
      <el-skeleton :loading="loading" animated :rows="10" v-if="loading">
        <template #template>
          <div style="padding: 20px">
            <el-skeleton-item variant="p" style="width: 100%; height: 60px;"/>
            <el-skeleton-item variant="p" style="width: 100%; height: 400px; margin-top: 20px"/>
          </div>
        </template>
      </el-skeleton>
      
      <report-viewer 
        v-else
        :data="reportData"
        :error="error"
        :params="reportParams"
        @params-change="updateReportParams"
        @refresh="loadReportData"
      />
    </el-dialog>

    <!-- 报表编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="(currentTemplate?.id ? '编辑' : '新建') + '报表模板'"
      width="50%"
      destroy-on-close
    >
      <report-template-editor
        :template="currentTemplate"
        @save="saveTemplate"
        @cancel="editDialogVisible = false"
      />
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除报表模板"
      width="30%"
    >
      <span>确定要删除报表模板"{{ templateToDelete?.name }}"吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteTemplate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导出报表对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出报表"
      width="30%"
    >
      <div class="export-form">
        <el-form label-position="top">
          <el-form-item label="文件格式">
            <el-radio-group v-model="exportFormat">
              <el-radio label="excel">Excel</el-radio>
              <el-radio label="pdf">PDF</el-radio>
              <el-radio label="csv">CSV</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="exportTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="doExportReport">导出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.report-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header .left {
  display: flex;
  flex-direction: column;
}

.page-header h2 {
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.page-header h2 .el-icon {
  margin-right: 8px;
}

.report-tabs {
  margin-top: 20px;
}

.template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.empty-tip {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-header h4 {
  margin: 0;
  font-size: 18px;
}

.dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-form {
  padding: 10px;
}
</style>