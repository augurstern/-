<template>
  <el-card 
    class="report-template-card" 
    :body-style="{ padding: '0' }"
    :shadow="hover ? 'hover' : 'always'"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="card-header">
      <el-icon class="template-icon" :size="32">
        <component :is="getIconComponent(template.icon)" />
      </el-icon>
      <div class="header-content">
        <h3 class="template-title" @click="select">{{ template.name }}</h3>
        <p class="template-description">{{ template.description || '暂无描述' }}</p>
      </div>
      <div class="favorite-icon" @click="toggleFavorite">
        <el-icon :size="20" :color="isFavorite ? '#f8b416' : '#c0c4cc'">
          <Star v-if="isFavorite" />
          <StarFilled v-else />
        </el-icon>
      </div>
    </div>
    
    <div class="card-content">
      <div class="template-info">
        <div class="info-item">
          <span class="label">报表类型:</span>
          <span class="value">{{ getReportTypeName(template.type) }}</span>
        </div>
        <div class="info-item">
          <span class="label">图表类型:</span>
          <span class="value">{{ getChartTypeName(template.defaultParams.chartType) }}</span>
        </div>
        <div class="info-item" v-if="template.defaultParams.timeDimension">
          <span class="label">时间维度:</span>
          <span class="value">{{ getTimeDimensionName(template.defaultParams.timeDimension) }}</span>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="footer-info">
        <span class="update-time">{{ formatTime(template.updateTime) }}</span>
        <span class="template-type" v-if="template.isSystem">系统</span>
        <span class="template-type" v-else>自定义</span>
      </div>
      <div class="footer-actions">
        <el-tooltip content="预览" placement="top">
          <el-button 
            size="small" 
            circle
            @click="select"
          >
            <el-icon><View /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="导出" placement="top">
          <el-button 
            size="small" 
            circle
            @click="$emit('export', template)"
          >
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="删除" placement="top" v-if="!template.isSystem">
          <el-button 
            size="small" 
            circle
            type="danger"
            @click="$emit('delete', template)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star, StarFilled, View, Download, Delete } from '@element-plus/icons-vue'
import { ReportTemplate, ReportType, ChartType, TimeDimension } from '@/api/report'
import * as ElementPlusIcons from '@element-plus/icons-vue'

// 接收的属性
const props = defineProps<{
  template: ReportTemplate;
  isFavorite: boolean;
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'select', template: ReportTemplate): void;
  (e: 'toggle-favorite', template: ReportTemplate): void;
  (e: 'delete', template: ReportTemplate): void;
  (e: 'export', template: ReportTemplate): void;
}>()

// 状态
const hover = ref(false)

// 获取图标组件
const getIconComponent = (iconName: string) => {
  // 如果没有指定图标，默认使用 DataAnalysis
  if (!iconName) return ElementPlusIcons.DataAnalysis
  
  // 如果图标存在于 ElementPlusIcons 中，返回该图标
  if (iconName in ElementPlusIcons) {
    return (ElementPlusIcons as any)[iconName]
  }
  
  // 默认返回 DataAnalysis 图标
  return ElementPlusIcons.DataAnalysis
}

// 获取报表类型名称
const getReportTypeName = (type: ReportType) => {
  const typeMap: Record<ReportType, string> = {
    [ReportType.CONTRACT_SUMMARY]: '合同汇总',
    [ReportType.CONTRACT_CATEGORY]: '合同分类',
    [ReportType.CONTRACT_TREND]: '合同趋势',
    [ReportType.CONTRACT_AMOUNT]: '合同金额',
    [ReportType.CONTRACT_PARTY]: '合同方',
    [ReportType.CONTRACT_DEPARTMENT]: '部门合同',
    [ReportType.CONTRACT_STATUS]: '合同状态',
    [ReportType.CONTRACT_PERFORMANCE]: '合同履约',
    [ReportType.CONTRACT_EXPIRING]: '到期预警',
    [ReportType.CONTRACT_APPROVAL]: '合同审批',
    [ReportType.USER_PERFORMANCE]: '用户绩效'
  }
  
  return typeMap[type] || '未知类型'
}

// 获取图表类型名称
const getChartTypeName = (type?: ChartType) => {
  if (!type) return '未指定'
  
  const typeMap: Record<ChartType, string> = {
    [ChartType.BAR]: '柱状图',
    [ChartType.LINE]: '折线图',
    [ChartType.PIE]: '饼图',
    [ChartType.RADAR]: '雷达图',
    [ChartType.SCATTER]: '散点图',
    [ChartType.HEATMAP]: '热力图',
    [ChartType.TABLE]: '表格',
    [ChartType.CUSTOM]: '自定义'
  }
  
  return typeMap[type] || '未知类型'
}

// 获取时间维度名称
const getTimeDimensionName = (dimension?: TimeDimension) => {
  if (!dimension) return '未指定'
  
  const dimensionMap: Record<TimeDimension, string> = {
    [TimeDimension.DAY]: '按天',
    [TimeDimension.WEEK]: '按周',
    [TimeDimension.MONTH]: '按月',
    [TimeDimension.QUARTER]: '按季度',
    [TimeDimension.YEAR]: '按年'
  }
  
  return dimensionMap[dimension] || '未知维度'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '未知时间'
  
  const date = new Date(time)
  if (isNaN(date.getTime())) return time
  
  return date.toLocaleDateString()
}

// 选择模板
const select = () => {
  emit('select', props.template)
}

// 切换收藏状态
const toggleFavorite = () => {
  emit('toggle-favorite', props.template)
}
</script>

<style scoped>
.report-template-card {
  height: 100%;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.report-template-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  position: relative;
  background-color: #f5f7fa;
}

.template-icon {
  margin-right: 12px;
  color: var(--el-color-primary);
}

.header-content {
  flex: 1;
  overflow: hidden;
}

.template-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-title:hover {
  color: var(--el-color-primary);
}

.template-description {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  transition: transform 0.3s;
}

.favorite-icon:hover {
  transform: scale(1.2);
}

.card-content {
  padding: 16px;
  flex: 1;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  font-size: 13px;
}

.info-item .label {
  color: var(--el-text-color-secondary);
  width: 70px;
  flex-shrink: 0;
}

.info-item .value {
  color: var(--el-text-color-primary);
  flex: 1;
}

.card-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.update-time {
  white-space: nowrap;
}

.template-type {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

.footer-actions {
  display: flex;
  gap: 8px;
}
</style> 