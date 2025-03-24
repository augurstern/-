<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Contract } from '../types/contract'
import ContractTemplateManager from './ContractTemplateManager.vue'
import VariableReplacer from './VariableReplacer.vue'
import ContractEditor from './ContractEditor.vue'
import { useContractStore } from '../stores/contract'

const props = defineProps({
  existingContract: {
    type: Object as () => Partial<Contract> | null,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const contractStore = useContractStore()
const activeStep = ref(0)
const loading = ref(false)
const templateContent = ref('')
const selectedTemplateId = ref('')
const currentContract = reactive<Partial<Contract>>({})
const processedContent = ref('')

// 步骤设置
const steps = [
  {
    title: '选择模板',
    description: '从模板库中选择合同模板'
  },
  {
    title: '填充变量',
    description: '替换模板中的变量'
  },
  {
    title: '编辑合同',
    description: '编辑合同内容并完成'
  }
]

// 步骤是否可访问
const stepDisabled = computed(() => {
  return {
    0: false, // 选择模板步骤始终可访问
    1: !selectedTemplateId.value, // 需要选择模板后才能访问变量填充步骤
    2: !processedContent.value // 需要处理完变量后才能访问编辑合同步骤
  } as Record<number, boolean>
})

// 显示前一步按钮
const showPrevButton = computed(() => activeStep.value > 0)

// 显示下一步按钮
const showNextButton = computed(() => activeStep.value < steps.length - 1)

// 显示完成按钮
const showFinishButton = computed(() => activeStep.value === steps.length - 1)

// 选择模板后的处理
const handleTemplateSelected = (templateId: string, content: string) => {
  selectedTemplateId.value = templateId
  templateContent.value = content
  
  // 初始化合同数据
  if (props.existingContract) {
    // 复制现有合同数据
    Object.assign(currentContract, props.existingContract)
    // 更新模板ID和内容
    currentContract.templateId = templateId
    currentContract.content = content
  } else {
    // 创建新合同数据
    Object.assign(currentContract, {
      templateId: templateId,
      content: content,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
  
  // 自动进入下一步
  nextStep()
}

// 变量替换后的处理
const handleContentUpdated = (updatedContent: string) => {
  processedContent.value = updatedContent
  currentContract.content = updatedContent
}

// 保存合同
const saveContract = async (contractData: Partial<Contract>) => {
  loading.value = true
  
  try {
    // 合并表单数据
    Object.assign(currentContract, contractData)
    
    let savedContract: Contract
    
    if (currentContract.id) {
      // 更新现有合同
      savedContract = await contractStore.updateContract(currentContract.id, currentContract)
      ElMessage.success('合同已更新')
    } else {
      // 创建新合同
      savedContract = await contractStore.createContract(currentContract)
      ElMessage.success('合同已创建')
    }
    
    // 通知父组件保存成功
    emit('save', savedContract.id)
  } catch (error) {
    console.error('保存合同失败', error)
    ElMessage.error('保存合同失败')
  } finally {
    loading.value = false
  }
}

// 取消操作
const cancel = () => {
  ElMessageBox.confirm('确定取消？所有未保存的更改将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('cancel')
  }).catch(() => {})
}

// 下一步
const nextStep = () => {
  if (activeStep.value < steps.length - 1 && !stepDisabled.value[activeStep.value + 1]) {
    activeStep.value += 1
  }
}

// 上一步
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value -= 1
  }
}
</script>

<template>
  <div class="contract-integrator">
    <el-steps :active="activeStep" finish-status="success" class="contract-steps">
      <el-step 
        v-for="(step, index) in steps" 
        :key="index" 
        :title="step.title" 
        :description="step.description"
        :disabled="stepDisabled[index as keyof typeof stepDisabled]"
      />
    </el-steps>
    
    <div class="step-content" v-loading="loading">
      <!-- 步骤1: 选择模板 -->
      <div v-if="activeStep === 0" class="template-selection">
        <ContractTemplateManager 
          :contract-type="currentContract.type"
          @select-template="handleTemplateSelected"
        />
      </div>
      
      <!-- 步骤2: 填充变量 -->
      <div v-else-if="activeStep === 1" class="variable-filling">
        <VariableReplacer 
          :template-content="templateContent"
          :contract-data="currentContract"
          @content-updated="handleContentUpdated"
        />
      </div>
      
      <!-- 步骤3: 编辑合同 -->
      <div v-else-if="activeStep === 2" class="contract-editing">
        <ContractEditor 
          :contract="currentContract"
          @save="saveContract"
          @cancel="cancel"
        />
      </div>
    </div>
    
    <div class="step-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button 
        v-if="showPrevButton" 
        @click="prevStep"
        icon="arrow-left"
      >
        上一步
      </el-button>
      <el-button 
        v-if="showNextButton" 
        type="primary" 
        @click="nextStep"
        :disabled="stepDisabled[(activeStep + 1) as keyof typeof stepDisabled]"
        icon="arrow-right"
      >
        下一步
      </el-button>
      <el-button 
        v-if="showFinishButton" 
        type="success" 
        @click="saveContract(currentContract)"
        icon="check"
      >
        完成
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.contract-integrator {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.contract-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 400px;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.template-selection,
.variable-filling,
.contract-editing {
  width: 100%;
}
</style>