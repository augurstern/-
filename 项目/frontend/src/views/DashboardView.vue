<script setup lang="ts">
import { onMounted, computed } from 'vue'
import StatisticsReport from '../components/StatisticsReport.vue'
import { ElCard, ElButton, ElRow, ElCol, ElSkeleton, ElTag } from 'element-plus'
import { useContractStore } from '../stores/contract'

// 使用合同状态管理
const contractStore = useContractStore()
const loading = computed(() => contractStore.loading)

// 计算属性 - 合同统计数据
const stats = computed(() => {
  return contractStore.statistics || {
    totalContracts: 0,
    activeContracts: 0,
    draftContracts: 0,
    archivedContracts: 0,
    overdueContracts: 0,
    overdueRate: 0,
    contractTypeDistribution: [30, 40, 30],
    contractTypeLabels: ['采购类', '服务类', '工程类'],
    recentContracts: []
  }
})

// 异步获取统计数据
const fetchStatistics = async () => {
  try {
    await contractStore.fetchStatistics()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取状态颜色
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'draft': '#909399',
    'pending': '#E6A23C',
    'approved': '#67C23A',
    'rejected': '#F56C6C',
    'expired': '#909399',
    'terminated': '#F56C6C'
  }
  return colorMap[status] || '#909399'
}

// 组件挂载时获取数据
onMounted(fetchStatistics)
</script>

<template>
  <div class="dashboard-container">
    <div class="welcome-card">
      <div class="user-info">
        <h2>{{ greeting }}，{{ userName }}</h2>
        <p>{{ today }}</p>
      </div>
      <div class="quick-links">
        <el-button type="primary" @click="createNewContract">
          <el-icon><Plus /></el-icon> 新建合同
        </el-button>
        <el-button @click="viewApprovals" :disabled="!hasPendingApprovals">
          <el-icon><Document /></el-icon> 待审批 <el-badge v-if="hasPendingApprovals" :value="pendingCount" />
        </el-button>
        <el-button @click="viewExpiring">
          <el-icon><Warning /></el-icon> 即将到期 <el-badge v-if="hasExpiringContracts" :value="expiringCount" />
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20" class="statistics-cards">
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card total">
          <template #header>
            <div class="card-header">
              <el-icon><Files /></el-icon>
              <span>合同总数</span>
            </div>
          </template>
          <div class="card-value">{{ loading ? '-' : totalCount }}</div>
          <div class="trend-info">
            <el-icon color="#67c23a"><ArrowUp /></el-icon> 
            <span>较上月增长 {{ monthlyGrowth }}%</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card active">
          <template #header>
            <div class="card-header">
              <el-icon><SetUp /></el-icon>
              <span>生效中</span>
            </div>
          </template>
          <div class="card-value">{{ loading ? '-' : activeCount }}</div>
          <div class="trend-info">占比 {{ activeRate }}%</div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card expiring">
          <template #header>
            <div class="card-header">
              <el-icon><AlarmClock /></el-icon>
              <span>即将到期</span>
            </div>
          </template>
          <div class="card-value">{{ loading ? '-' : expiringCount }}</div>
          <div class="trend-info">未来30天内</div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card pending">
          <template #header>
            <div class="card-header">
              <el-icon><Timer /></el-icon>
              <span>待审批</span>
            </div>
          </template>
          <div class="card-value">{{ loading ? '-' : pendingCount }}</div>
          <div class="trend-info">处理时间 {{ avgApprovalTime }} 小时</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>合同状态分布</span>
              <el-radio-group v-model="statusChartType" size="small">
                <el-radio-button label="pie">饼图</el-radio-button>
                <el-radio-button label="bar">柱状图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" v-loading="loading">
            <div ref="statusChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>合同类型金额分布</span>
              <el-select v-model="amountChartPeriod" size="small" placeholder="选择时间范围">
                <el-option label="近6个月" value="6" />
                <el-option label="近12个月" value="12" />
                <el-option label="全部" value="all" />
              </el-select>
            </div>
          </template>
          <div class="chart-container" v-loading="loading">
            <div ref="amountChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>合同趋势</span>
              <el-radio-group v-model="trendChartPeriod" size="small">
                <el-radio-button label="month">月度</el-radio-button>
                <el-radio-button label="quarter">季度</el-radio-button>
                <el-radio-button label="year">年度</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container trend-chart" v-loading="loading">
            <div ref="trendChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="recent-table">
          <template #header>
            <div class="card-header">
              <span>近期合同</span>
              <el-button type="primary" link @click="viewAllContracts">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentContracts" style="width: 100%" v-loading="loading">
            <el-table-column prop="contractNumber" label="合同编号" min-width="120" />
            <el-table-column prop="title" label="合同标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="type" label="合同类型" min-width="100">
              <template #default="scope">
                <el-tag :type="getContractTypeTag(scope.row.type)">
                  {{ getContractTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="party" label="签约方" min-width="150" show-overflow-tooltip />
            <el-table-column prop="amount" label="金额" min-width="120">
              <template #default="scope">
                <span>{{ formatCurrency(scope.row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="scope">
                <el-tag :type="getStatusTag(scope.row.status)">
                  {{ getStatusName(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="更新时间" min-width="150" />
            <el-table-column fixed="right" label="操作" width="120">
              <template #default="scope">
                <el-button type="primary" link @click="viewContractDetail(scope.row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.welcome-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  font-weight: 500;
}

.user-info p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.quick-links {
  display: flex;
  gap: 10px;
}

.statistics-cards {
  margin-bottom: 20px;
}

.data-card {
  position: relative;
  height: 150px;
  overflow: hidden;
  transition: all 0.3s;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.data-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-card .card-value {
  font-size: 2.5rem;
  font-weight: 600;
  margin: 15px 0;
}

.data-card .trend-info {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
}

.data-card.total {
  border-top: 4px solid var(--el-color-primary);
}

.data-card.active {
  border-top: 4px solid var(--el-color-success);
}

.data-card.expiring {
  border-top: 4px solid var(--el-color-warning);
}

.data-card.pending {
  border-top: 4px solid var(--el-color-danger);
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.chart-container.trend-chart {
  height: 350px;
}

.chart {
  width: 100%;
  height: 100%;
}

.recent-table {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .quick-links {
    width: 100%;
    flex-direction: column;
  }
  
  .data-card {
    height: auto;
    padding-bottom: 15px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .chart-container.trend-chart {
    height: 300px;
  }
}
</style> 