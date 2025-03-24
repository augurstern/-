<template>
  <div class="contract-form-view">
    <div class="page-header">
      <div class="title-section">
        <h2>{{ isEdit ? '编辑合同' : '创建合同' }}</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/contract' }">合同管理</el-breadcrumb-item>
          <el-breadcrumb-item>{{ isEdit ? '编辑合同' : '创建合同' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <el-card class="form-card" v-loading="loading">
      <el-form
        ref="contractForm"
        :model="contractData"
        :rules="rules"
        label-width="100px"
        label-position="right"
        class="contract-form"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号" prop="contractNo">
              <el-input 
                v-model="contractData.contractNo" 
                placeholder="请输入合同编号" 
                :disabled="isEdit && !isAdmin"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同名称" prop="title">
              <el-input v-model="contractData.title" placeholder="请输入合同名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同类型" prop="type">
              <dict-select dict-code="contract_type" v-model="contractData.type" placeholder="请选择合同类型" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签约状态" prop="status">
              <dict-select dict-code="contract_status" v-model="contractData.status" placeholder="请选择签约状态" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同方信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="我方部门" prop="departmentId">
              <el-select 
                v-model="contractData.departmentId" 
                placeholder="请选择我方部门"
                filterable
              >
                <el-option 
                  v-for="dept in departmentOptions" 
                  :key="dept.value" 
                  :label="dept.label"
                  :value="dept.value"
                  :disabled="dept.disabled"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="我方负责人" prop="managerId">
              <el-select 
                v-model="contractData.managerId" 
                placeholder="请选择我方负责人"
                filterable
                :loading="userLoading"
              >
                <el-option 
                  v-for="user in userOptions" 
                  :key="user.value" 
                  :label="user.label"
                  :value="user.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对方单位" prop="partyName">
              <el-input v-model="contractData.partyName" placeholder="请输入对方单位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对方联系人" prop="partyContact">
              <el-input v-model="contractData.partyContact" placeholder="请输入对方联系人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对方电话" prop="partyPhone">
              <el-input v-model="contractData.partyPhone" placeholder="请输入对方联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对方邮箱" prop="partyEmail">
              <el-input v-model="contractData.partyEmail" placeholder="请输入对方联系邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同日期</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="签订日期" prop="signDate">
              <el-date-picker
                v-model="contractData.signDate"
                type="date"
                placeholder="请选择签订日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生效日期" prop="startDate">
              <el-date-picker
                v-model="contractData.startDate"
                type="date"
                placeholder="请选择生效日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到期日期" prop="endDate">
              <el-date-picker
                v-model="contractData.endDate"
                type="date"
                placeholder="请选择到期日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同金额</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同金额" prop="amount">
              <el-input-number
                v-model="contractData.amount"
                :precision="2"
                :step="1000"
                :min="0"
                style="width: 100%"
                placeholder="请输入合同金额"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种" prop="currency">
              <dict-select dict-code="currency_type" v-model="contractData.currency" placeholder="请选择币种" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支付方式" prop="paymentMethod">
              <dict-select dict-code="payment_method" v-model="contractData.paymentMethod" placeholder="请选择支付方式" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款条件" prop="paymentTerm">
              <dict-radio dict-code="payment_term" v-model="contractData.paymentTerm" is-button />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同详情</el-divider>

        <el-form-item label="合同摘要" prop="summary">
          <el-input
            v-model="contractData.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入合同摘要"
          />
        </el-form-item>

        <el-form-item label="合同条款" prop="terms">
          <el-input
            v-model="contractData.terms"
            type="textarea"
            :rows="5"
            placeholder="请输入主要合同条款"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="contractData.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useContractStore } from '@/stores/contract'
import { useDepartmentStore } from '@/stores/department'
import { useAuthStore } from '@/stores/auth'

// 引入字典组件
import DictSelect from '@/components/DictSelect.vue'
import DictRadio from '@/components/DictRadio.vue'
import DictTag from '@/components/DictTag.vue'

const router = useRouter()
const route = useRoute()
const contractStore = useContractStore()
const departmentStore = useDepartmentStore()
const authStore = useAuthStore()

// 表单ref
const contractForm = ref()
// 加载状态
const loading = ref(false)
// 提交状态
const submitting = ref(false)
// 用户加载状态
const userLoading = ref(false)
// 用户选项
const userOptions = ref([])

// 是否编辑模式
const isEdit = computed(() => {
  return route.name === 'contract-edit'
})

// 合同ID
const contractId = computed(() => {
  return route.params.id as string || ''
})

// 是否管理员
const isAdmin = computed(() => {
  return authStore.user?.role === 'admin'
})

// 部门选项
const departmentOptions = computed(() => {
  return departmentStore.departmentOptions
})

// 表单数据
const contractData = reactive({
  contractNo: '',
  title: '',
  type: '',
  status: 'draft', // 默认为草稿状态
  departmentId: '',
  managerId: '',
  partyName: '',
  partyContact: '',
  partyPhone: '',
  partyEmail: '',
  signDate: '',
  startDate: '',
  endDate: '',
  amount: 0,
  currency: 'CNY', // 默认人民币
  paymentMethod: '',
  paymentTerm: '',
  summary: '',
  terms: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  contractNo: [
    { required: true, message: '请输入合同编号', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入合同名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择合同类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择签约状态', trigger: 'change' }
  ],
  departmentId: [
    { required: true, message: '请选择我方部门', trigger: 'change' }
  ],
  managerId: [
    { required: true, message: '请选择我方负责人', trigger: 'change' }
  ],
  partyName: [
    { required: true, message: '请输入对方单位名称', trigger: 'blur' }
  ],
  signDate: [
    { required: true, message: '请选择签订日期', trigger: 'change' }
  ],
  startDate: [
    { required: true, message: '请选择生效日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择到期日期', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入合同金额', trigger: 'blur' }
  ],
  currency: [
    { required: true, message: '请选择币种', trigger: 'change' }
  ],
  paymentMethod: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
  ]
}

// 获取部门用户
const getDepartmentUsers = async (departmentId: string) => {
  if (!departmentId) {
    userOptions.value = []
    return
  }
  
  userLoading.value = true
  try {
    const result = await departmentStore.fetchDepartmentUsers(departmentId, {
      page: 1,
      pageSize: 100
    })
    
    userOptions.value = result.items.map(user => ({
      label: user.username,
      value: user.id
    }))
  } catch (error) {
    console.error('获取部门用户失败:', error)
  } finally {
    userLoading.value = false
  }
}

// 监听部门变化
const watchDepartment = () => {
  let prevDepartmentId = contractData.departmentId
  
  setInterval(() => {
    if (contractData.departmentId !== prevDepartmentId) {
      prevDepartmentId = contractData.departmentId
      getDepartmentUsers(contractData.departmentId)
      
      // 如果部门变化，清空负责人
      contractData.managerId = ''
    }
  }, 300)
}

// 加载合同数据
const loadContractData = async () => {
  if (!isEdit.value || !contractId.value) return
  
  loading.value = true
  try {
    const contract = await contractStore.getContract(contractId.value)
    if (contract) {
      // 填充表单数据
      Object.assign(contractData, {
        contractNo: contract.contractNo,
        title: contract.title,
        type: contract.type,
        status: contract.status,
        departmentId: contract.departmentId,
        managerId: contract.managerId,
        partyName: contract.partyName,
        partyContact: contract.partyContact,
        partyPhone: contract.partyPhone,
        partyEmail: contract.partyEmail,
        signDate: contract.signDate,
        startDate: contract.startDate,
        endDate: contract.endDate,
        amount: contract.amount,
        currency: contract.currency,
        paymentMethod: contract.paymentMethod,
        paymentTerm: contract.paymentTerm,
        summary: contract.summary,
        terms: contract.terms,
        remarks: contract.remarks
      })
      
      // 加载部门用户
      if (contract.departmentId) {
        getDepartmentUsers(contract.departmentId)
      }
    } else {
      ElMessage.error('找不到该合同')
      router.push('/contract')
    }
  } catch (error) {
    console.error('加载合同数据失败:', error)
    ElMessage.error('加载合同数据失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = () => {
  contractForm.value.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.warning('请完善表单信息')
      return
    }
    
    // 日期验证
    if (new Date(contractData.endDate) < new Date(contractData.startDate)) {
      ElMessage.warning('到期日期不能早于生效日期')
      return
    }
    
    submitting.value = true
    try {
      if (isEdit.value) {
        // 编辑模式
        await contractStore.updateContract(contractId.value, contractData)
        ElMessage.success('合同更新成功')
        router.push(`/contract/detail/${contractId.value}`)
      } else {
        // 创建模式
        const newContract = await contractStore.createContract(contractData)
        ElMessage.success('合同创建成功')
        router.push(`/contract/detail/${newContract.id}`)
      }
    } catch (error) {
      console.error('保存合同失败:', error)
      ElMessage.error('保存合同失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (isEdit.value) {
    // 编辑模式下重新加载原始数据
    ElMessageBox.confirm('确定要重置表单吗？将恢复原始数据。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      loadContractData()
    })
  } else {
    // 创建模式下清空表单
    contractForm.value.resetFields()
  }
}

// 取消操作
const cancel = () => {
  ElMessageBox.confirm('确定要取消编辑吗？未保存的内容将丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (isEdit.value && contractId.value) {
      router.push(`/contract/detail/${contractId.value}`)
    } else {
      router.push('/contract')
    }
  })
}

// 页面初始化
onMounted(async () => {
  // 加载部门列表
  await departmentStore.fetchDepartmentTree()
  
  // 监听部门变化
  watchDepartment()
  
  // 如果是编辑模式，加载合同数据
  if (isEdit.value) {
    loadContractData()
  } else {
    // 创建模式，设置默认部门和当前用户信息
    const currentUser = authStore.user
    if (currentUser?.departmentId) {
      contractData.departmentId = currentUser.departmentId
      getDepartmentUsers(currentUser.departmentId)
    }
  }
})
</script>

<style scoped>
.contract-form-view {
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-card {
  margin-bottom: 20px;
}

.contract-form {
  padding: 10px;
}

.el-divider {
  margin-top: 24px;
  margin-bottom: 24px;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style> 