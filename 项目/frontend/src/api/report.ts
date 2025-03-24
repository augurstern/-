import { get, post, downloadFile } from './index'

/**
 * 报表类型枚举
 */
export enum ReportType {
  CONTRACT_SUMMARY = 'contract_summary', // 合同汇总报表
  CONTRACT_CATEGORY = 'contract_category', // 合同分类统计
  CONTRACT_TREND = 'contract_trend', // 合同趋势统计
  CONTRACT_AMOUNT = 'contract_amount', // 合同金额统计
  CONTRACT_PARTY = 'contract_party', // 合同方统计
  CONTRACT_DEPARTMENT = 'contract_department', // 部门合同统计
  CONTRACT_STATUS = 'contract_status', // 合同状态统计
  CONTRACT_PERFORMANCE = 'contract_performance', // 合同履约情况
  CONTRACT_EXPIRING = 'contract_expiring', // 合同到期预警
  CONTRACT_APPROVAL = 'contract_approval', // 合同审批统计
  USER_PERFORMANCE = 'user_performance', // 用户绩效统计
}

/**
 * 图表类型
 */
export enum ChartType {
  BAR = 'bar', // 柱状图
  LINE = 'line', // 折线图
  PIE = 'pie', // 饼图
  RADAR = 'radar', // 雷达图
  SCATTER = 'scatter', // 散点图
  HEATMAP = 'heatmap', // 热力图
  TABLE = 'table', // 表格
  CUSTOM = 'custom', // 自定义
}

/**
 * 时间维度
 */
export enum TimeDimension {
  DAY = 'day', // 按天
  WEEK = 'week', // 按周
  MONTH = 'month', // 按月
  QUARTER = 'quarter', // 按季度
  YEAR = 'year', // 按年
}

/**
 * 报表参数
 */
export interface ReportParams {
  startTime?: string; // 开始时间
  endTime?: string; // 结束时间
  timeRange?: [string, string]; // 时间范围
  timeDimension?: TimeDimension; // 时间维度
  chartType?: ChartType; // 图表类型
  departments?: string[]; // 部门列表
  categories?: string[]; // 分类列表
  statuses?: string[]; // 状态列表
  users?: string[]; // 用户列表
  minAmount?: number; // 最小金额
  maxAmount?: number; // 最大金额
  filterExpired?: boolean; // 是否过滤已过期
  filterDraft?: boolean; // 是否过滤草稿
  groupBy?: string; // 分组字段
  limit?: number; // 限制数量
  [key: string]: any; // 其他自定义参数
}

/**
 * 报表数据项
 */
export interface ReportDataItem {
  name: string; // 名称
  value: number; // 值
  ratio?: number; // 占比
  color?: string; // 颜色
  [key: string]: any; // 其他属性
}

/**
 * 图表数据系列
 */
export interface ChartSeries {
  name: string; // 系列名称
  type: ChartType; // 系列类型
  data: any[]; // 系列数据
  color?: string; // 系列颜色
  [key: string]: any; // 其他属性
}

/**
 * 报表结果
 */
export interface ReportResult {
  title: string; // 报表标题
  chartType: ChartType; // 图表类型
  categories?: string[]; // 分类（用于X轴）
  series: ChartSeries[]; // 数据系列
  total?: number; // 总数/总额
  summary?: Record<string, any>; // 汇总数据
  details?: any[]; // 详细数据
  updateTime: string; // 数据更新时间
  params: ReportParams; // 查询参数
}

/**
 * 报表模板
 */
export interface ReportTemplate {
  id: string; // 模板ID
  name: string; // 模板名称
  type: ReportType; // 报表类型
  description?: string; // 描述
  icon?: string; // 图标
  defaultParams: ReportParams; // 默认参数
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  isSystem: boolean; // 是否系统模板
  creatorId?: string; // 创建者ID
  creatorName?: string; // 创建者名称
}

/**
 * 获取报表数据
 * @param type 报表类型
 * @param params 查询参数
 */
export function getReportData(type: ReportType, params: ReportParams): Promise<ReportResult> {
  return get<ReportResult>(`/report/${type}`, { params })
}

/**
 * 获取报表模板列表
 */
export function getReportTemplates(): Promise<ReportTemplate[]> {
  return get<ReportTemplate[]>('/report/templates')
}

/**
 * 获取报表模板详情
 * @param id 模板ID
 */
export function getReportTemplate(id: string): Promise<ReportTemplate> {
  return get<ReportTemplate>(`/report/templates/${id}`)
}

/**
 * 创建报表模板
 * @param template 模板信息
 */
export function createReportTemplate(template: Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'>): Promise<ReportTemplate> {
  return post<ReportTemplate>('/report/templates', template)
}

/**
 * 更新报表模板
 * @param id 模板ID
 * @param template 模板信息
 */
export function updateReportTemplate(id: string, template: Partial<Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'>>): Promise<ReportTemplate> {
  return post<ReportTemplate>(`/report/templates/${id}`, template)
}

/**
 * 删除报表模板
 * @param id 模板ID
 */
export function deleteReportTemplate(id: string): Promise<void> {
  return post(`/report/templates/${id}/delete`)
}

/**
 * 导出报表
 * @param type 报表类型
 * @param params 查询参数
 * @param fileType 文件类型
 */
export function exportReport(type: ReportType, params: ReportParams, fileType: 'excel' | 'pdf' | 'csv' = 'excel'): Promise<void> {
  return downloadFile(`/report/${type}/export`, { ...params, fileType })
}

/**
 * 获取合同汇总报表
 * @param params 查询参数
 */
export function getContractSummaryReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_SUMMARY, params)
}

/**
 * 获取合同分类统计报表
 * @param params 查询参数
 */
export function getContractCategoryReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_CATEGORY, params)
}

/**
 * 获取合同趋势统计报表
 * @param params 查询参数
 */
export function getContractTrendReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_TREND, params)
}

/**
 * 获取合同金额统计报表
 * @param params 查询参数
 */
export function getContractAmountReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_AMOUNT, params)
}

/**
 * 获取合同对方统计报表
 * @param params 查询参数
 */
export function getContractPartyReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_PARTY, params)
}

/**
 * 获取部门合同统计报表
 * @param params 查询参数
 */
export function getContractDepartmentReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_DEPARTMENT, params)
}

/**
 * 获取合同状态统计报表
 * @param params 查询参数
 */
export function getContractStatusReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_STATUS, params)
}

/**
 * 获取合同履约情况报表
 * @param params 查询参数
 */
export function getContractPerformanceReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_PERFORMANCE, params)
}

/**
 * 获取合同到期预警报表
 * @param params 查询参数
 */
export function getContractExpiringReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_EXPIRING, params)
}

/**
 * 获取合同审批统计报表
 * @param params 查询参数
 */
export function getContractApprovalReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.CONTRACT_APPROVAL, params)
}

/**
 * 获取用户绩效统计报表
 * @param params 查询参数
 */
export function getUserPerformanceReport(params: ReportParams): Promise<ReportResult> {
  return getReportData(ReportType.USER_PERFORMANCE, params)
}

// 模拟数据 - 仅在开发阶段使用
const mockReportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: '合同月度汇总报表',
    type: ReportType.CONTRACT_SUMMARY,
    description: '按月统计合同数量、金额等汇总数据',
    icon: 'PieChart',
    defaultParams: {
      timeDimension: TimeDimension.MONTH,
      chartType: ChartType.BAR,
      timeRange: [
        new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ]
    },
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00',
    isSystem: true
  },
  {
    id: '2',
    name: '合同分类统计报表',
    type: ReportType.CONTRACT_CATEGORY,
    description: '按合同分类统计数量和金额',
    icon: 'DataAnalysis',
    defaultParams: {
      chartType: ChartType.PIE,
      timeRange: [
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ]
    },
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00',
    isSystem: true
  },
  {
    id: '3',
    name: '合同金额分布报表',
    type: ReportType.CONTRACT_AMOUNT,
    description: '按金额区间统计合同分布',
    icon: 'Histogram',
    defaultParams: {
      chartType: ChartType.BAR,
      timeRange: [
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ]
    },
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00',
    isSystem: true
  },
  {
    id: '4',
    name: '合同趋势分析报表',
    type: ReportType.CONTRACT_TREND,
    description: '分析合同数量和金额的变化趋势',
    icon: 'TrendCharts',
    defaultParams: {
      timeDimension: TimeDimension.MONTH,
      chartType: ChartType.LINE,
      timeRange: [
        new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ]
    },
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00',
    isSystem: true
  },
  {
    id: '5',
    name: '部门合同统计报表',
    type: ReportType.CONTRACT_DEPARTMENT,
    description: '各部门合同签订情况统计',
    icon: 'OfficeBuilding',
    defaultParams: {
      chartType: ChartType.BAR,
      timeRange: [
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ]
    },
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00',
    isSystem: true
  }
]; 