<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Contract } from '../types/contract'
import { parseTemplateVariables, areAllVariablesFilled, getUnfilledVariables, replaceTemplateVariables } from '../utils/templateUtils'

const props = defineProps({
  templateContent: {
    type: String,
    required: true
  },
  contractData: {
    type: Object as () => Partial<Contract>,
    default: () => ({})
  }
})

const emit = defineEmits(['content-updated'])

// 变量列表
const variables = ref<string[]>([])
// 变量值映射
const variableValues = reactive<Record<string, string>>({})
// 提取的变量是否都已填充
const allVariablesFilled = computed(() => areAllVariablesFilled(variables.value, variableValues))
// 未填充的变量列表
const unfilledVariables = computed(() => getUnfilledVariables(variables.value, variableValues))

// 当前内容
const currentContent = ref(props.templateContent)

// 合同字段与变量的映射关系
const contractFieldMap: Record<string, string> = {
  '合同编号': 'contractNumber',
  '合同标题': 'title',
  '合同金额': 'amount',
  '甲方': 'partyA',
  '乙方': 'partyB',
  '对方名称': 'partyName',
  '开始日期': 'startDate',
  '结束日期': 'endDate',
  '签署日期': 'signDate',
  '负责部门': 'department',
  '负责人': 'responsible'
}

// 监听templateContent变化
watch(() => props.templateContent, (newVal) => {
  currentContent.value = newVal
  extractVariables()
})

// 监听contractData变化
watch(() => props.contractData, (newVal) => {
  if (newVal) {
    // 尝试从合同数据中提取匹配的值
    extractMatchingValues()
  }
}, { deep: true })

// 提取模板中的变量
const extractVariables = () => {
  if (!currentContent.value) return
  
  // 使用工具函数提取变量
  const extractedVars = parseTemplateVariables(currentContent.value)
  variables.value = extractedVars
  
  // 初始化变量值
  extractedVars.forEach(variable => {
    if (!variableValues[variable]) {
      variableValues[variable] = ''
    }
  })
  
  // 尝试从合同数据中提取匹配的值
  extractMatchingValues()
}

// 从合同数据中提取匹配的值
const extractMatchingValues = () => {
  const contractData = props.contractData || {}
  
  variables.value.forEach(variable => {
    // 直接匹配合同属性
    if (contractData[variable as keyof typeof contractData]) {
      variableValues[variable] = String(contractData[variable as keyof typeof contractData])
    }
    // 通过映射关系匹配
    else if (contractFieldMap[variable] && contractData[contractFieldMap[variable] as keyof typeof contractData]) {
      variableValues[variable] = String(contractData[contractFieldMap[variable] as keyof typeof contractData])
    }
    // 尝试转换驼峰命名
    else {
      const camelCaseVar = variable.replace(/[\u4e00-\u9fa5]+/g, '').replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        return index === 0 ? match.toLowerCase() : match.toUpperCase()
      }).replace(/\s+/g, '')
      
      if (contractData[camelCaseVar as keyof typeof contractData]) {
        variableValues[variable] = String(contractData[camelCaseVar as keyof typeof contractData])
      }
    }
  })
  
  // 更新内容
  updateContent()
}

// 更新变量值
const updateVariableValue = (variable: string, value: string) => {
  variableValues[variable] = value
  updateContent()
}

// 更新内容，替换变量
const updateContent = () => {
  // 使用工具函数替换变量
  const updatedContent = replaceTemplateVariables(currentContent.value, variableValues)
  
  // 发送更新后的内容
  emit('content-updated', updatedContent)
}

// 初始化
const init = () => {
  extractVariables()
}

// 初始执行
init()
</script>

<template>
  <div class="variable-replacer">
    <div class="header">
      <h3>变量替换</h3>
      <div class="alert-info" v-if="variables.length > 0">
        已从模板中提取 {{ variables.length }} 个变量，
        <span class="success" v-if="allVariablesFilled">所有变量已填充</span>
        <span class="warning" v-else>还有 {{ unfilledVariables.length }} 个变量未填充</span>
      </div>
      <div class="alert-info empty" v-else>
        未从模板中提取到变量
      </div>
    </div>
    
    <div v-if="variables.length > 0" class="variables-form">
      <el-form label-position="top">
        <el-row :gutter="20">
          <el-col :span="8" v-for="variable in variables" :key="variable">
            <el-form-item :label="variable">
              <el-input 
                v-model="variableValues[variable]" 
                :placeholder="`请输入${variable}`"
                clearable
                @input="updateVariableValue(variable, variableValues[variable])"
                :class="{ 'unfilled': !variableValues[variable] }"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    
    <div v-if="unfilledVariables.length > 0" class="unfilled-alert">
      <el-alert
        title="存在未填充的变量"
        type="warning"
        :description="`以下变量未填充：${unfilledVariables.join(', ')}`"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<style scoped>
.variable-replacer {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.alert-info {
  font-size: 14px;
  color: #606266;
}

.alert-info.empty {
  color: #909399;
}

.success {
  color: #67c23a;
  font-weight: 500;
}

.warning {
  color: #e6a23c;
  font-weight: 500;
}

.variables-form {
  margin-bottom: 20px;
}

.unfilled {
  border-color: #e6a23c;
}

.unfilled-alert {
  margin-top: 15px;
}
</style> 