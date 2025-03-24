<template>
  <div class="report-template-editor">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="top"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="模板名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入模板名称" />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="报表类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择报表类型" style="width: 100%">
              <el-option label="合同汇总报表" :value="ReportType.CONTRACT_SUMMARY" />
              <el-option label="合同分类统计" :value="ReportType.CONTRACT_CATEGORY" />
              <el-option label="合同趋势统计" :value="ReportType.CONTRACT_TREND" />
              <el-option label="合同金额统计" :value="ReportType.CONTRACT_AMOUNT" />
              <el-option label="合同方统计" :value="ReportType.CONTRACT_PARTY" />
              <el-option label="部门合同统计" :value="ReportType.CONTRACT_DEPARTMENT" />
              <el-option label="合同状态统计" :value="ReportType.CONTRACT_STATUS" />
              <el-option label="合同履约情况" :value="ReportType.CONTRACT_PERFORMANCE" />
              <el-option label="合同到期预警" :value="ReportType.CONTRACT_EXPIRING" />
              <el-option label="合同审批统计" :value="ReportType.CONTRACT_APPROVAL" />
              <el-option label="用户绩效统计" :value="ReportType.USER_PERFORMANCE" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入模板描述"
        />
      </el-form-item>
      
      <el-divider content-position="left">默认参数设置</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="图表类型" prop="defaultParams.chartType">
            <el-select 
              v-model="form.defaultParams.chartType" 
              placeholder="请选择图表类型"
              style="width: 100%"
            >
              <el-option label="柱状图" :value="ChartType.BAR" />
              <el-option label="折线图" :value="ChartType.LINE" />
              <el-option label="饼图" :value="ChartType.PIE" />
              <el-option label="表格" :value="ChartType.TABLE" />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="时间维度" prop="defaultParams.timeDimension">
            <el-select 
              v-model="form.defaultParams.timeDimension" 
              placeholder="请选择时间维度"
              style="width: 100%"
            >
              <el-option label="按天" :value="TimeDimension.DAY" />
              <el-option label="按周" :value="TimeDimension.WEEK" />
              <el-option label="按月" :value="TimeDimension.MONTH" />
              <el-option label="按季度" :value="TimeDimension.QUARTER" />
              <el-option label="按年" :value="TimeDimension.YEAR" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="默认时间范围" prop="defaultParams.timeRange">
        <el-date-picker
          v-model="form.defaultParams.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示图标" prop="icon">
            <icon-selector v-model="form.icon" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-divider />
      
      <el-form-item>
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button @click="$emit('cancel')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ReportTemplate, ReportType, ChartType, TimeDimension } from '@/api/report'
import IconSelector from '@/components/common/IconSelector.vue'

// 接收的属性
const props = defineProps<{
  template: ReportTemplate | null;
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'save', template: Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'>): void;
  (e: 'cancel'): void;
}>()

// 表单引用
const formRef = ref()

// 默认日期范围
const defaultTimeRange = computed(() => {
  return [
    new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ] as [string, string]
})

// 表单数据
const form = reactive<Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'>>({
  name: '',
  type: ReportType.CONTRACT_SUMMARY,
  description: '',
  icon: 'PieChart',
  defaultParams: {
    chartType: ChartType.BAR,
    timeDimension: TimeDimension.MONTH,
    timeRange: defaultTimeRange.value
  },
  isSystem: false,
  creatorId: '',
  creatorName: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择报表类型', trigger: 'change' }
  ],
  'defaultParams.chartType': [
    { required: true, message: '请选择图表类型', trigger: 'change' }
  ],
  'defaultParams.timeRange': [
    { required: true, message: '请选择默认时间范围', trigger: 'change' }
  ]
}

// 初始化表单数据
const initForm = () => {
  if (!props.template) return
  
  // 拷贝模板数据到表单
  form.name = props.template.name
  form.type = props.template.type
  form.description = props.template.description || ''
  form.icon = props.template.icon || 'PieChart'
  form.isSystem = props.template.isSystem
  form.creatorId = props.template.creatorId || ''
  form.creatorName = props.template.creatorName || ''
  
  // 处理默认参数
  if (props.template.defaultParams) {
    form.defaultParams = { ...props.template.defaultParams }
    
    // 确保时间范围是数组类型
    if (!form.defaultParams.timeRange) {
      form.defaultParams.timeRange = defaultTimeRange.value
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 构建提交的模板数据
    const template: Omit<ReportTemplate, 'id' | 'createTime' | 'updateTime'> = {
      name: form.name,
      type: form.type,
      description: form.description,
      icon: form.icon,
      defaultParams: { ...form.defaultParams },
      isSystem: form.isSystem,
      creatorId: form.creatorId,
      creatorName: form.creatorName
    }
    
    emit('save', template)
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入')
    console.error('表单验证失败:', error)
  }
}

// 生命周期钩子
onMounted(() => {
  initForm()
})
</script>

<style scoped>
.report-template-editor {
  padding: 10px;
}
</style> 