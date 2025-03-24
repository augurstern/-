import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ReportType,
  ReportParams,
  ReportResult,
  ReportTemplate,
  getReportData,
  getReportTemplates,
  getReportTemplate,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  exportReport,
  ChartType,
  TimeDimension
} from '../api/report'

export const useReportStore = defineStore('report', () => {
  // 状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const reportData = ref<ReportResult | null>(null)
  const reportTemplates = ref<ReportTemplate[]>([])
  const currentTemplate = ref<ReportTemplate | null>(null)
  const favoriteTemplates = ref<string[]>([])

  // 从localStorage加载收藏的报表模板
  const loadFavoriteTemplates = () => {
    try {
      const saved = localStorage.getItem('favoriteReportTemplates')
      if (saved) {
        favoriteTemplates.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('加载收藏报表模板失败', e)
    }
  }

  // 保存收藏的报表模板到localStorage
  const saveFavoriteTemplates = () => {
    try {
      localStorage.setItem('favoriteReportTemplates', JSON.stringify(favoriteTemplates.value))
    } catch (e) {
      console.error('保存收藏报表模板失败', e)
    }
  }

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const errorMessage = computed(() => error.value)
  const hasReportData = computed(() => reportData.value !== null)
  
  // 获取收藏的报表模板
  const getFavoriteTemplates = computed(() => {
    return reportTemplates.value.filter(t => favoriteTemplates.value.includes(t.id))
  })

  // 获取系统默认报表模板
  const getSystemTemplates = computed(() => {
    return reportTemplates.value.filter(t => t.isSystem)
  })
  
  // 获取用户自定义报表模板
  const getUserTemplates = computed(() => {
    return reportTemplates.value.filter(t => !t.isSystem)
  })

  // 设置错误信息
  const setError = (message: string | null) => {
    error.value = message
  }

  // 设置加载状态
  const setLoading = (state: boolean) => {
    loading.value = state
  }

  // 获取报表数据
  const fetchReportData = async (type: ReportType, params: ReportParams) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getReportData(type, params)
      reportData.value = result
      return result
    } catch (err: any) {
      setError(err.message || '获取报表数据失败')
      console.error('获取报表数据失败', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 获取报表模板列表
  const fetchReportTemplates = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const templates = await getReportTemplates()
      reportTemplates.value = templates
      return templates
    } catch (err: any) {
      setError(err.message || '获取报表模板列表失败')
      console.error('获取报表模板列表失败', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  // 获取报表模板详情
  const fetchReportTemplate = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const template = await getReportTemplate(id)
      currentTemplate.value = template
      return template
    } catch (err: any) {
      setError(err.message || '获取报表模板详情失败')
      console.error('获取报表模板详情失败', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 保存报表模板
  const saveReportTemplate = async (template: Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'>) => {
    setLoading(true)
    setError(null)
    
    try {
      let result
      if (currentTemplate.value && currentTemplate.value.id) {
        // 更新现有模板
        result = await updateReportTemplate(currentTemplate.value.id, template)
        
        // 更新本地模板列表
        const index = reportTemplates.value.findIndex(t => t.id === currentTemplate.value?.id)
        if (index !== -1) {
          reportTemplates.value[index] = result
        }
      } else {
        // 创建新模板
        result = await createReportTemplate(template)
        reportTemplates.value.push(result)
      }
      
      currentTemplate.value = result
      return result
    } catch (err: any) {
      setError(err.message || '保存报表模板失败')
      console.error('保存报表模板失败', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 删除报表模板
  const removeReportTemplate = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await deleteReportTemplate(id)
      
      // 从本地模板列表中移除
      reportTemplates.value = reportTemplates.value.filter(t => t.id !== id)
      
      // 如果是当前模板，清空当前模板
      if (currentTemplate.value && currentTemplate.value.id === id) {
        currentTemplate.value = null
      }
      
      // 从收藏中移除
      if (favoriteTemplates.value.includes(id)) {
        favoriteTemplates.value = favoriteTemplates.value.filter(fid => fid !== id)
        saveFavoriteTemplates()
      }
      
      return true
    } catch (err: any) {
      setError(err.message || '删除报表模板失败')
      console.error('删除报表模板失败', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // 导出报表
  const exportReportData = async (type: ReportType, params: ReportParams, fileType: 'excel' | 'pdf' | 'csv' = 'excel') => {
    setLoading(true)
    setError(null)
    
    try {
      await exportReport(type, params, fileType)
      return true
    } catch (err: any) {
      setError(err.message || '导出报表失败')
      console.error('导出报表失败', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // 添加收藏模板
  const addFavoriteTemplate = (id: string) => {
    if (!favoriteTemplates.value.includes(id)) {
      favoriteTemplates.value.push(id)
      saveFavoriteTemplates()
    }
  }

  // 移除收藏模板
  const removeFavoriteTemplate = (id: string) => {
    favoriteTemplates.value = favoriteTemplates.value.filter(fid => fid !== id)
    saveFavoriteTemplates()
  }

  // 创建新的报表模板
  const createNewTemplate = () => {
    currentTemplate.value = {
      id: '',
      name: '新建报表模板',
      type: ReportType.CONTRACT_SUMMARY,
      description: '',
      icon: 'PieChart',
      defaultParams: {
        chartType: ChartType.BAR,
        timeDimension: TimeDimension.MONTH,
        timeRange: [
          new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ]
      },
      createTime: '',
      updateTime: '',
      isSystem: false,
      creatorId: '',
      creatorName: ''
    }
  }

  // 初始化
  const init = async () => {
    loadFavoriteTemplates()
    await fetchReportTemplates()
  }

  return {
    // 状态
    loading,
    error,
    reportData,
    reportTemplates,
    currentTemplate,
    favoriteTemplates,
    
    // 计算属性
    isLoading,
    hasError,
    errorMessage,
    hasReportData,
    getFavoriteTemplates,
    getSystemTemplates,
    getUserTemplates,
    
    // 方法
    setError,
    setLoading,
    fetchReportData,
    fetchReportTemplates,
    fetchReportTemplate,
    saveReportTemplate,
    removeReportTemplate,
    exportReportData,
    addFavoriteTemplate,
    removeFavoriteTemplate,
    createNewTemplate,
    init
  }
}) 