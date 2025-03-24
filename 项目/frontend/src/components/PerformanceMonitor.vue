<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useContractStore } from '../stores/contract'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  contractId?: string
  showOverview?: boolean
}>()

const contractStore = useContractStore()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

const loading = ref(false)
const chartRef = ref<HTMLElement | null>(null)
const chart = ref<echarts.ECharts | null>(null)
const contractData = ref<any>(null)
const performanceMetrics = ref<any[]>([])
const alertSettings = ref<any[]>([])
const isAlertDialogVisible = ref(false)
const selectedContractType = ref('')

// 表单数据
const alertForm = reactive({
  id: '',
  name: '',
  contractType: '',
  metric: 'overdueRate',
  threshold: 25,
  channels: ['email', 'app'],
  recipients: [] as string[],
  isActive: true
})

// 指标选项
const metricOptions = [
  { label: '逾期率', value: 'overdueRate' },
  { label: '完成率', value: 'completionRate' },
  { label: '续约率', value: 'renewalRate' },
  { label: '平均执行周期', value: 'avgExecutionPeriod' }
]

// 通道选项
const channelOptions = [
  { label: '应用内通知', value: 'app' },
  { label: '电子邮件', value: 'email' },
  { label: '短信', value: 'sms' }
]

// 合同类型选项
const contractTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '销售合同', value: 'sales' },
  { label: '采购合同', value: 'purchase' },
  { label: '服务合同', value: 'service' },
  { label: '劳动合同', value: 'employment' },
  { label: '租赁合同', value: 'lease' },
  { label: '其他', value: 'other' }
]

// 获取指标名称
const getMetricName = (metric: string) => {
  const option = metricOptions.find(opt => opt.value === metric)
  return option ? option.label : metric
}

// 获取通道名称
const getChannelName = (channel: string) => {
  const option = channelOptions.find(opt => opt.value === channel)
  return option ? option.label : channel
}

// 获取合同类型名称
const getContractTypeName = (type: string) => {
  if (!type) return '全部类型'
  const option = contractTypeOptions.find(opt => opt.value === type)
  return option ? option.label : type
}

// 获取单个合同的绩效数据
const fetchContractPerformance = async () => {
  if (!props.contractId) return
  
  try {
    loading.value = true
    contractData.value = await contractStore.fetchContractById(props.contractId)
    
    // 获取相关绩效数据
    const metrics = await contractStore.fetchContractMetrics(props.contractId)
    performanceMetrics.value = metrics || []
    
    // 初始化图表
    initChart()
  } catch (error) {
    ElMessage.error('获取合同绩效数据失败')
  } finally {
    loading.value = false
  }
}

// 获取总体绩效数据
const fetchOverallPerformance = async () => {
  try {
    loading.value = true
    
    // 获取相关绩效数据
    const metrics = await contractStore.fetchOverallMetrics(selectedContractType.value)
    performanceMetrics.value = metrics || []
    
    // 初始化图表
    initChart()
  } catch (error) {
    ElMessage.error('获取总体绩效数据失败')
  } finally {
    loading.value = false
  }
}

// 获取告警设置
const fetchAlertSettings = async () => {
  try {
    loading.value = true
    alertSettings.value = await contractStore.fetchAlertSettings()
  } catch (error) {
    ElMessage.error('获取告警设置失败')
  } finally {
    loading.value = false
  }
}

// 预测未来趋势
const predictFutureTrend = () => {
  if (!performanceMetrics.value || performanceMetrics.value.length < 3) {
    return []
  }
  
  // 使用简单的线性回归预测未来3个月
  const recentData = [...performanceMetrics.value].slice(-6)
  const timestamps = recentData.map((_, index) => index)
  const values = recentData.map(item => item.value)
  
  // 计算线性回归参数
  const n = timestamps.length
  const sumX = timestamps.reduce((acc, val) => acc + val, 0)
  const sumY = values.reduce((acc, val) => acc + val, 0)
  const sumXY = timestamps.reduce((acc, val, index) => acc + val * values[index], 0)
  const sumX2 = timestamps.reduce((acc, val) => acc + val * val, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // 生成预测数据
  const predictions = []
  const lastDate = new Date(recentData[recentData.length - 1].date)
  
  for (let i = 1; i <= 3; i++) {
    const predictedValue = intercept + slope * (timestamps.length - 1 + i)
    
    // 创建未来日期
    const futureDate = new Date(lastDate)
    futureDate.setMonth(futureDate.getMonth() + i)
    
    predictions.push({
      date: futureDate.toISOString().substring(0, 10),
      value: Math.max(0, Math.min(100, parseFloat(predictedValue.toFixed(2)))),
      isPrediction: true
    })
  }
  
  return predictions
}

// 计算逾期概率
const calculateOverdueProbability = computed(() => {
  if (!contractData.value || !performanceMetrics.value.length) return 'N/A'
  
  // 获取此类型合同的历史逾期率
  const overdueRates = performanceMetrics.value
    .filter(metric => metric.metric === 'overdueRate')
    .map(metric => metric.value)
  
  if (!overdueRates.length) return 'N/A'
  
  // 计算平均逾期率
  const avgOverdueRate = overdueRates.reduce((acc, val) => acc + val, 0) / overdueRates.length
  
  // 基于一些风险因素调整概率
  let probability = avgOverdueRate
  
  // 如果合同金额较大，增加风险
  if (contractData.value.amount > 100000) {
    probability += 5
  }
  
  // 如果合同期限较长，增加风险
  const startDate = new Date(contractData.value.startDate)
  const endDate = new Date(contractData.value.endDate)
  const durationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth())
  
  if (durationMonths > 12) {
    probability += 3
  }
  
  // 确保概率在0-100之间
  probability = Math.max(0, Math.min(100, probability))
  
  return `${probability.toFixed(1)}%`
})

// 风险等级
const riskLevel = computed(() => {
  if (!contractData.value) return 'unknown'
  
  const probability = parseFloat(calculateOverdueProbability.value)
  
  if (isNaN(probability)) return 'unknown'
  
  if (probability < 10) return 'low'
  if (probability < 30) return 'medium'
  if (probability < 60) return 'high'
  return 'critical'
})

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  if (chart.value) {
    chart.value.dispose()
  }
  
  chart.value = echarts.init(chartRef.value)
  
  const metrics = [...performanceMetrics.value]
  const predictions = predictFutureTrend()
  const combinedData = [...metrics, ...predictions]
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any[]) {
        const param = params[0]
        const isPrediction = param.data.isPrediction
        return `${param.name}<br/>${param.marker}${param.seriesName}: ${param.value}%${isPrediction ? ' (预测)' : ''}`
      }
    },
    xAxis: {
      type: 'category',
      data: combinedData.map(item => item.date),
      axisLabel: {
        formatter: (value: string) => {
          return value.substring(5)  // 只显示月-日
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: getMetricName(metrics[0]?.metric || 'overdueRate'),
      type: 'line',
      data: combinedData.map(item => ({
        value: item.value,
        isPrediction: item.isPrediction || false
      })),
      markLine: {
        data: [
          { 
            name: '警戒线', 
            yAxis: 30,
            lineStyle: { color: '#F56C6C' }
          }
        ]
      },
      // 使用不同的样式显示预测数据
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: function(params: any) {
          return params.data.isPrediction ? '#E6A23C' : '#409EFF'
        }
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(64, 158, 255, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(64, 158, 255, 0.1)'
          }]
        }
      }
    }]
  }
  
  chart.value.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.value?.resize()
  })
}

// 打开创建告警对话框
const openCreateAlertDialog = () => {
  Object.assign(alertForm, {
    id: '',
    name: '',
    contractType: selectedContractType.value,
    metric: 'overdueRate',
    threshold: 25,
    channels: ['email', 'app'],
    recipients: [],
    isActive: true
  })
  
  isAlertDialogVisible.value = true
}

// 打开编辑告警对话框
const openEditAlertDialog = (alert: any) => {
  Object.assign(alertForm, {
    id: alert.id,
    name: alert.name,
    contractType: alert.contractType,
    metric: alert.metric,
    threshold: alert.threshold,
    channels: [...alert.channels],
    recipients: [...alert.recipients],
    isActive: alert.isActive
  })
  
  isAlertDialogVisible.value = true
}

// 保存告警设置
const saveAlertSetting = async () => {
  if (!alertForm.name) {
    ElMessage.warning('请输入告警名称')
    return
  }
  
  try {
    loading.value = true
    
    const alertData = { ...alertForm }
    
    let result
    if (alertForm.id) {
      // 更新现有告警
      result = await contractStore.updateAlertSetting(alertForm.id, alertData)
    } else {
      // 创建新告警
      result = await contractStore.createAlertSetting(alertData)
    }
    
    if (result) {
      ElMessage.success(alertForm.id ? '告警设置已更新' : '告警设置已创建')
      isAlertDialogVisible.value = false
      await fetchAlertSettings()
    }
  } catch (error) {
    ElMessage.error(alertForm.id ? '更新告警设置失败' : '创建告警设置失败')
  } finally {
    loading.value = false
  }
}

// 切换告警状态
const toggleAlertStatus = async (alert: any) => {
  try {
    loading.value = true
    
    const updatedAlert = {
      ...alert,
      isActive: !alert.isActive
    }
    
    const result = await contractStore.updateAlertSetting(alert.id, updatedAlert)
    
    if (result) {
      ElMessage.success(`告警已${updatedAlert.isActive ? '启用' : '禁用'}`)
      await fetchAlertSettings()
    }
  } catch (error) {
    ElMessage.error('更新告警状态失败')
  } finally {
    loading.value = false
  }
}

// 删除告警设置
const deleteAlertSetting = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除该告警设置吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const success = await contractStore.deleteAlertSetting(id)
    
    if (success) {
      ElMessage.success('告警设置已删除')
      await fetchAlertSettings()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除告警设置失败')
    }
  } finally {
    loading.value = false
  }
}

// 监听合同类型变化
watch(selectedContractType, () => {
  if (props.showOverview) {
    fetchOverallPerformance()
  }
})

// 初始化
onMounted(async () => {
  await fetchAlertSettings()
  
  if (props.contractId) {
    await fetchContractPerformance()
  } else if (props.showOverview) {
    await fetchOverallPerformance()
  }
})
</script>

<template>
  <div class="performance-monitor" v-loading="loading">
    <div class="monitor-header">
      <h3>合同绩效监控</h3>
      
      <div v-if="props.showOverview" class="type-filter">
        <el-select 
          v-model="selectedContractType" 
          placeholder="选择合同类型"
          size="small"
        >
          <el-option
            v-for="option in contractTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
    </div>
    
    <!-- 单个合同预测信息 -->
    <div v-if="props.contractId && contractData" class="contract-prediction">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>风险评估</span>
            <el-tag :type="getRiskTagType(riskLevel)" size="small">
              {{ getRiskLevelText(riskLevel) }}
            </el-tag>
          </div>
        </template>
        
        <div class="prediction-content">
          <div class="prediction-item">
            <span class="label">预计逾期概率:</span>
            <span class="value" :class="getProbabilityClass(calculateOverdueProbability)">
              {{ calculateOverdueProbability }}
            </span>
          </div>
          
          <div class="prediction-item">
            <span class="label">历史数据参考:</span>
            <span class="value">
              基于 {{ performanceMetrics.length }} 个数据点进行分析
            </span>
          </div>
          
          <div class="prediction-item">
            <span class="label">风险因素:</span>
            <div class="risk-factors">
              <el-tag 
                v-if="contractData.amount > 100000"
                type="danger" 
                effect="plain" 
                size="small"
              >
                高额合同
              </el-tag>
              <el-tag 
                v-if="getContractDurationMonths(contractData) > 12"
                type="warning"
                effect="plain"
                size="small"
              >
                长期合同
              </el-tag>
              <el-tag 
                v-if="contractData.type === 'service'"
                type="info"
                effect="plain"
                size="small"
              >
                服务类型
              </el-tag>
            </div>
          </div>
          
          <div class="prediction-help">
            <el-alert
              title="风险提示"
              type="info"
              :closable="false"
              show-icon
            >
              <p>此预测基于历史数据和合同特性分析，仅供参考。建议密切监控合同执行情况，确保按时履约。</p>
            </el-alert>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表展示 -->
    <div class="performance-chart">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>
              {{ props.contractId ? '合同执行趋势' : '整体绩效趋势' }}
            </span>
            <div class="legend">
              <span class="legend-item">
                <span class="color-dot actual"></span>实际数据
              </span>
              <span class="legend-item">
                <span class="color-dot prediction"></span>预测数据
              </span>
            </div>
          </div>
        </template>
        
        <div 
          ref="chartRef" 
          style="width: 100%; height: 350px;"
        ></div>
      </el-card>
    </div>
    
    <!-- 告警设置 -->
    <div class="alert-settings">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>告警设置</span>
            <el-button 
              type="primary" 
              size="small"
              @click="openCreateAlertDialog"
            >
              添加告警
            </el-button>
          </div>
        </template>
        
        <el-table 
          :data="alertSettings" 
          style="width: 100%"
          v-if="alertSettings.length > 0"
        >
          <el-table-column prop="name" label="告警名称" min-width="150" />
          
          <el-table-column label="合同类型" width="120">
            <template #default="scope">
              {{ getContractTypeName(scope.row.contractType) }}
            </template>
          </el-table-column>
          
          <el-table-column label="监控指标" width="120">
            <template #default="scope">
              {{ getMetricName(scope.row.metric) }}
            </template>
          </el-table-column>
          
          <el-table-column label="阈值" width="100">
            <template #default="scope">
              {{ scope.row.threshold }}%
            </template>
          </el-table-column>
          
          <el-table-column label="通知渠道" min-width="180">
            <template #default="scope">
              <el-tag 
                v-for="channel in scope.row.channels" 
                :key="channel"
                size="small"
                style="margin-right: 5px"
              >
                {{ getChannelName(channel) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="80" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.isActive"
                @change="() => toggleAlertStatus(scope.row)"
                :loading="loading"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button 
                type="primary" 
                link
                @click="openEditAlertDialog(scope.row)"
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                link
                @click="deleteAlertSetting(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty 
          v-else 
          description="暂无告警设置"
        />
      </el-card>
    </div>
    
    <!-- 告警设置对话框 -->
    <el-dialog
      v-model="isAlertDialogVisible"
      :title="alertForm.id ? '编辑告警' : '创建告警'"
      width="500px"
    >
      <el-form :model="alertForm" label-width="100px">
        <el-form-item label="告警名称" required>
          <el-input v-model="alertForm.name" placeholder="请输入告警名称" />
        </el-form-item>
        
        <el-form-item label="合同类型">
          <el-select v-model="alertForm.contractType" placeholder="选择合同类型">
            <el-option
              v-for="option in contractTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="监控指标" required>
          <el-select v-model="alertForm.metric" placeholder="选择监控指标">
            <el-option
              v-for="option in metricOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="阈值" required>
          <el-input-number 
            v-model="alertForm.threshold" 
            :min="0" 
            :max="100" 
            :step="5"
          />
          <span class="unit">%</span>
        </el-form-item>
        
        <el-form-item label="通知渠道" required>
          <el-checkbox-group v-model="alertForm.channels">
            <el-checkbox 
              v-for="option in channelOptions"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="接收人">
          <el-select
            v-model="alertForm.recipients"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入接收人邮箱"
          >
            <el-option
              v-for="(user, index) in ['admin@example.com', 'manager@example.com']"
              :key="index"
              :label="user"
              :value="user"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="是否启用">
          <el-switch v-model="alertForm.isActive" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isAlertDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAlertSetting" :loading="loading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ElMessageBox } from 'element-plus'
import { watch } from 'vue'

// 获取合同期限(月)
function getContractDurationMonths(contract: any) {
  if (!contract || !contract.startDate || !contract.endDate) return 0
  
  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)
  
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
         (endDate.getMonth() - startDate.getMonth())
}

// 获取风险标签类型
function getRiskTagType(level: string) {
  switch (level) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'danger'
    case 'critical': return 'danger'
    default: return 'info'
  }
}

// 获取风险等级文本
function getRiskLevelText(level: string) {
  switch (level) {
    case 'low': return '低风险'
    case 'medium': return '中等风险'
    case 'high': return '高风险'
    case 'critical': return '极高风险'
    default: return '未知'
  }
}

// 获取概率CSS类
function getProbabilityClass(probability: string) {
  if (probability === 'N/A') return ''
  
  const value = parseFloat(probability)
  if (isNaN(value)) return ''
  
  if (value < 10) return 'low-risk'
  if (value < 30) return 'medium-risk'
  if (value < 60) return 'high-risk'
  return 'critical-risk'
}
</script>

<style scoped>
.performance-monitor {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.monitor-header h3 {
  margin: 0;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contract-prediction, .performance-chart, .alert-settings {
  margin-bottom: 20px;
}

.prediction-content {
  padding: 10px 0;
}

.prediction-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.prediction-item .label {
  width: 130px;
  color: #606266;
}

.prediction-item .value {
  font-weight: bold;
  color: #303133;
}

.low-risk {
  color: #67c23a;
}

.medium-risk {
  color: #e6a23c;
}

.high-risk {
  color: #f56c6c;
}

.critical-risk {
  color: #f56c6c;
  font-weight: bold;
}

.risk-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.prediction-help {
  margin-top: 20px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}

.color-dot.actual {
  background-color: #409EFF;
}

.color-dot.prediction {
  background-color: #E6A23C;
}

.unit {
  margin-left: 5px;
  color: #606266;
}

@media (max-width: 768px) {
  .prediction-item {
    flex-direction: column;
  }
  
  .prediction-item .label {
    width: 100%;
    margin-bottom: 5px;
  }
}
</style> 