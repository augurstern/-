<template>
  <div class="contract-create">
    <div class="page-header">
      <div class="title-section">
        <h2>创建合同</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/contract' }">合同管理</el-breadcrumb-item>
          <el-breadcrumb-item>创建合同</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <el-card class="form-card">
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
              <el-input v-model="contractData.contractNo" placeholder="请输入合同编号" />
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
              <el-select v-model="contractData.type" placeholder="请选择合同类型">
                <el-option label="销售合同" value="sales" />
                <el-option label="采购合同" value="purchase" />
                <el-option label="服务合同" value="service" />
                <el-option label="租赁合同" value="lease" />
                <el-option label="劳务合同" value="labor" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签约状态" prop="status">
              <el-select v-model="contractData.status" placeholder="请选择签约状态">
                <el-option label="草稿" value="draft" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="已签约" value="signed" />
                <el-option label="执行中" value="executing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已终止" value="terminated" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同方信息</el-divider>

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
            <el-form-item label="联系电话" prop="partyPhone">
              <el-input v-model="contractData.partyPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="partyEmail">
              <el-input v-model="contractData.partyEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同周期与金额</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签订日期" prop="signDate">
              <el-date-picker
                v-model="contractData.signDate"
                type="date"
                placeholder="选择签订日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期" prop="endDate">
              <el-date-picker
                v-model="contractData.endDate"
                type="date"
                placeholder="选择到期日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

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
              <el-select v-model="contractData.currency" placeholder="请选择币种">
                <el-option label="人民币" value="CNY" />
                <el-option label="美元" value="USD" />
                <el-option label="欧元" value="EUR" />
                <el-option label="英镑" value="GBP" />
                <el-option label="日元" value="JPY" />
              </el-select>
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

        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            multiple
            :limit="5"
            :file-list="fileList"
            :on-exceed="handleExceed"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 jpg/png/pdf/doc/docx 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="saveAsDraft">保存为草稿</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.push('/contract')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 合同数据
const contractData = reactive({
  contractNo: '', // 合同编号
  title: '', // 合同名称
  type: '', // 合同类型
  status: 'draft', // 签约状态
  partyName: '', // 对方单位
  partyContact: '', // 对方联系人
  partyPhone: '', // 联系电话
  partyEmail: '', // 联系邮箱
  signDate: '', // 签订日期
  endDate: '', // 到期日期
  amount: 0, // 合同金额
  currency: 'CNY', // 币种
  summary: '', // 合同摘要
  terms: '', // 合同条款
  remarks: '' // 备注
})

// 附件列表
const fileList = ref([])

// 表单引用
const contractForm = ref()

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
  partyName: [
    { required: true, message: '请输入对方单位名称', trigger: 'blur' }
  ],
  signDate: [
    { type: 'date', required: true, message: '请选择签订日期', trigger: 'change' }
  ],
  endDate: [
    { type: 'date', required: true, message: '请选择到期日期', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入合同金额', trigger: 'blur' }
  ],
  currency: [
    { required: true, message: '请选择币种', trigger: 'change' }
  ]
}

// 提交表单
const submitForm = () => {
  contractForm.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟提交数据
      ElMessage.success('合同创建成功')
      setTimeout(() => {
        router.push('/contract')
      }, 1500)
    }
  })
}

// 保存为草稿
const saveAsDraft = () => {
  contractData.status = 'draft'
  ElMessage.success('已保存为草稿')
  setTimeout(() => {
    router.push('/contract')
  }, 1500)
}

// 重置表单
const resetForm = () => {
  contractForm.value.resetFields()
}

// 附件超出限制
const handleExceed = () => {
  ElMessage.warning('最多只能上传5个文件')
}

// 上传前校验
const beforeUpload = (file: File) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }
  
  return true
}
</script>

<style scoped>
.contract-create {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-section h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.form-card {
  margin-bottom: 20px;
}

.contract-form {
  padding: 20px 0;
}

.el-divider__text {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

@media (max-width: 768px) {
  .el-col {
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style> 