<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ElTable, ElTableColumn, ElButton, ElInput, 
  ElSelect, ElOption, ElPagination, ElMessage
} from 'element-plus'
import { Search, Plus, Delete, Edit, Download } from '@element-plus/icons-vue'

interface Contract {
  id: string;
  title: string;
  client_name: string;
  amount: number;
  sign_date: string;
  approval_status: string;
  update_time: string;
}

const router = useRouter()
const loading = ref(false)
const contracts = ref<Contract[]>([])

// 搜索条件
const searchForm = reactive({
  keyword: '',
  status: '',
  date_range: []
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 模拟从API获取合同列表
const fetchContracts = async (): Promise<void> => {
  try {
    loading.value = true
    
    // 在实际应用中，这里应当从API获取数据
    // const response = await fetch('/api/contracts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     keyword: searchForm.keyword,
    //     status: searchForm.status,
    //     date_range: searchForm.date_range,
    //     page: pagination.current,
    //     pageSize: pagination.pageSize
    //   })
    // })
    // const data = await response.json()
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟数据
    pagination.total = 56 // 模拟总数
    contracts.value = [
      {
        id: '1',
        title: '软件开发服务合同',
        client_name: 'ABC科技有限公司',
        amount: 120000,
        sign_date: '2023-03-15',
        approval_status: 'approved',
        update_time: '2023-03-20'
      },
      {
        id: '2',
        title: '网站维护服务合同',
        client_name: '华讯传媒集团',
        amount: 48000,
        sign_date: '2023-04-10',
        approval_status: 'pending',
        update_time: '2023-04-11'
      },
      {
        id: '3',
        title: '系统集成项目合同',
        client_name: '国信金融股份有限公司',
        amount: 350000,
        sign_date: '2023-02-18',
        approval_status: 'approved',
        update_time: '2023-03-01'
      },
      {
        id: '4',
        title: '数据分析服务合同',
        client_name: '远景教育科技',
        amount: 85000,
        sign_date: '2023-05-05',
        approval_status: 'draft',
        update_time: '2023-05-05'
      },
      {
        id: '5',
        title: '云服务迁移合同',
        client_name: '优鼎医疗科技有限公司',
        amount: 220000,
        sign_date: '2023-01-20',
        approval_status: 'approved',
        update_time: '2023-02-15'
      }
    ]
  } catch (error) {
    ElMessage.error('获取合同列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = (): void => {
  pagination.current = 1
  fetchContracts()
}

// 重置搜索
const resetSearch = (): void => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.date_range = []
  handleSearch()
}

// 新建合同
const createContract = (): void => {
  router.push('/contracts/new')
}

// 编辑合同
const editContract = (id: string): void => {
  router.push(`/contracts/${id}`)
}

// 删除合同
const deleteContract = async (id: string): Promise<void> => {
  try {
    // 在实际应用中，这里应当调用API删除数据
    // await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('合同已删除')
    fetchContracts()
  } catch (error) {
    ElMessage.error('删除合同失败')
  }
}

// 导出合同
const exportContract = (id: string): void => {
  // 在实际应用中，这里应当调用API导出合同
  ElMessage.success(`合同 ${id} 导出成功`)
}

// 状态文本与样式
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审批',
    'approved': '已批准',
    'rejected': '已拒绝',
    'expired': '已过期',
    'terminated': '已终止'
  }
  return statusMap[status] || status
}

const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    'draft': '',
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'expired': 'info',
    'terminated': 'info'
  }
  return typeMap[status] || ''
}

// 分页变化
const handlePageChange = (page: number): void => {
  pagination.current = page
  fetchContracts()
}

onMounted(fetchContracts)
</script>

<template>
  <div class="contract-list">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-input 
        v-model="searchForm.keyword" 
        placeholder="合同标题或客户名称"
        clearable
        :prefix-icon="Search"
        data-test="search-input"
      >
      </el-input>
      
      <el-select 
        v-model="searchForm.status" 
        placeholder="状态"
        clearable
        data-test="status-filter"
      >
        <el-option label="草稿" value="draft" />
        <el-option label="待审批" value="pending" />
        <el-option label="已批准" value="approved" />
        <el-option label="已拒绝" value="rejected" />
        <el-option label="已过期" value="expired" />
        <el-option label="已终止" value="terminated" />
      </el-select>
      
      <div class="search-buttons">
        <el-button type="primary" @click="handleSearch" data-test="search-button">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" :icon="Plus" @click="createContract" data-test="create-contract-button">新建合同</el-button>
      </div>
    </div>
    
    <!-- 表格区域 -->
    <el-table 
      :data="contracts" 
      v-loading="loading"
      border
      style="width: 100%"
    >
      <el-table-column prop="title" label="合同标题" min-width="180" />
      <el-table-column prop="client_name" label="客户名称" min-width="150" />
      <el-table-column prop="amount" label="合同金额" min-width="120">
        <template #default="{ row }">
          {{ row.amount.toLocaleString('zh-CN') }} 元
        </template>
      </el-table-column>
      <el-table-column prop="sign_date" label="签署日期" min-width="120" />
      <el-table-column prop="approval_status" label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.approval_status)" size="small" effect="light">
            {{ getStatusText(row.approval_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="update_time" label="更新时间" min-width="120" />
      <el-table-column fixed="right" label="操作" width="200">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link 
            :icon="Edit" 
            @click="editContract(row.id)"
          >
            编辑
          </el-button>
          <el-button 
            type="primary" 
            link 
            :icon="Download" 
            @click="exportContract(row.id)"
          >
            导出
          </el-button>
          <el-button 
            type="danger" 
            link 
            :icon="Delete" 
            @click="deleteContract(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页区域 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.contract-list {
  padding: 20px;
}

.search-container {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-container .el-input {
  max-width: 250px;
}

.search-container .el-select {
  width: 150px;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons {
  margin-left: auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 