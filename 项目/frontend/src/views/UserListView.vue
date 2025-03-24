<template>
  <div class="user-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="left">
        <h2>用户管理</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>系统管理</el-breadcrumb-item>
          <el-breadcrumb-item>用户管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="right">
        <el-button type="primary" @click="showCreateUserDialog">
          新增用户
        </el-button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-container">
        <el-form :model="filterForm" inline>
          <el-form-item label="关键字">
            <el-input 
              v-model="filterForm.keyword" 
              placeholder="用户名/邮箱/手机号" 
              clearable 
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          
          <el-form-item label="角色">
            <el-select v-model="filterForm.role" placeholder="请选择角色" clearable>
              <el-option 
                v-for="role in roles" 
                :key="role.id" 
                :label="role.name" 
                :value="role.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="部门">
            <el-select v-model="filterForm.department" placeholder="请选择部门" clearable>
              <el-option 
                v-for="dept in departments" 
                :key="dept.id" 
                :label="dept.name" 
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
              <el-option label="锁定" value="locked" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="left">
            <span>用户列表</span>
          </div>
          
          <div class="right">
            <el-tooltip content="刷新" placement="top">
              <el-button :icon="Refresh" circle @click="refreshList" />
            </el-tooltip>
            
            <el-tooltip content="批量删除" placement="top">
              <el-button 
                :icon="Delete" 
                circle 
                type="danger" 
                :disabled="selectedUsers.length === 0" 
                @click="confirmBatchDelete" 
              />
            </el-tooltip>
            
            <el-tooltip content="导出" placement="top">
              <el-button :icon="Download" circle @click="exportUsers" />
            </el-tooltip>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="userList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <div class="user-item">
              <el-avatar :size="32" :src="row.avatar || '/avatar-placeholder.png'" />
              <span class="username">{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="email" label="邮箱" min-width="180" />
        
        <el-table-column prop="role" label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag v-if="roleMap[row.role]" size="small">
              {{ roleMap[row.role] }}
            </el-tag>
            <span v-else>{{ row.role }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="department" label="部门" min-width="120">
          <template #default="{ row }">
            <span>{{ departmentMap[row.department] || row.department || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="phone" label="手机号" min-width="120" />
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : row.status === 'inactive' ? 'info' : 'danger'"
              effect="dark"
              size="small"
            >
              {{ row.status === 'active' ? '启用' : row.status === 'inactive' ? '禁用' : '锁定' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="lastLogin" label="最近登录" width="180" />
        
        <el-table-column fixed="right" label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editUser(row)">
              编辑
            </el-button>
            
            <el-button v-if="row.status === 'active'" type="warning" link size="small" @click="toggleStatus(row, 'inactive')">
              禁用
            </el-button>
            
            <el-button v-else-if="row.status === 'inactive'" type="success" link size="small" @click="toggleStatus(row, 'active')">
              启用
            </el-button>
            
            <el-button v-else type="success" link size="small" @click="toggleStatus(row, 'active')">
              解锁
            </el-button>
            
            <el-dropdown>
              <el-button link type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="resetPassword(row)">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item @click="deleteUser(row)">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option 
              v-for="role in roles" 
              :key="role.id" 
              :label="role.name" 
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="部门" prop="department">
          <el-select v-model="userForm.department" placeholder="请选择部门" clearable>
            <el-option 
              v-for="dept in departments" 
              :key="dept.id" 
              :label="dept.name" 
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="职位" prop="position">
          <el-input v-model="userForm.position" placeholder="请输入职位" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUserForm">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 重置密码结果对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="重置密码成功" width="400px" center>
      <div class="password-result">
        <el-alert
          title="密码已重置，请妥善保管临时密码"
          type="success"
          :closable="false"
          show-icon
        />
        <div class="temp-password">
          <span>临时密码：</span>
          <el-input v-model="tempPassword" readonly>
            <template #append>
              <el-button @click="copyPassword">复制</el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useUserStore } from '../stores/user'
import type { User, UserCreatePayload, UserUpdatePayload } from '../api/user'
import { Refresh, Delete, Download, ArrowDown } from '@element-plus/icons-vue'

// 用户存储
const userStore = useUserStore()

// 状态变量
const loading = computed(() => userStore.loading)
const userList = computed(() => userStore.userList)
const total = computed(() => userStore.total)
const roleMap = computed(() => userStore.roleMap)
const departmentMap = computed(() => userStore.departmentMap)
const roles = computed(() => userStore.roles)
const departments = computed(() => userStore.departments)

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  role: '',
  department: '',
  status: ''
})

// 筛选表单
const filterForm = reactive({
  keyword: '',
  role: '',
  department: '',
  status: ''
})

// 选中的用户列表
const selectedUsers = ref<User[]>([])

// 用户表单相关
const userDialogVisible = ref(false)
const isEdit = ref(false)
const userFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const userForm = reactive<UserCreatePayload & { id?: string }>({
  username: '',
  email: '',
  password: '',
  role: '',
  department: '',
  position: '',
  phone: '',
  status: 'active'
})

// 用户表单校验规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 重置密码相关
const passwordDialogVisible = ref(false)
const tempPassword = ref('')

// 页面加载时获取数据
onMounted(async () => {
  // 并行加载数据
  await Promise.all([
    fetchUserList(),
    userStore.fetchRoles(),
    userStore.fetchDepartments()
  ])
})

// 获取用户列表
const fetchUserList = async () => {
  await userStore.fetchUsers({
    page: queryParams.page,
    pageSize: queryParams.pageSize,
    keyword: queryParams.keyword,
    role: queryParams.role,
    status: queryParams.status,
    department: queryParams.department
  })
}

// 刷新列表
const refreshList = () => {
  fetchUserList()
}

// 处理搜索
const handleSearch = () => {
  // 将筛选条件同步到查询参数
  queryParams.keyword = filterForm.keyword
  queryParams.role = filterForm.role
  queryParams.department = filterForm.department
  queryParams.status = filterForm.status
  queryParams.page = 1
  
  fetchUserList()
}

// 重置筛选条件
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key as keyof typeof filterForm] = ''
  })
  handleSearch()
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  fetchUserList()
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  queryParams.page = page
  fetchUserList()
}

// 处理选择变化
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

// 显示创建用户对话框
const showCreateUserDialog = () => {
  isEdit.value = false
  // 重置表单
  Object.keys(userForm).forEach(key => {
    if (key !== 'status') {
      userForm[key as keyof typeof userForm] = ''
    } else {
      userForm.status = 'active'
    }
  })
  userDialogVisible.value = true
}

// 编辑用户
const editUser = (row: User) => {
  isEdit.value = true
  
  // 填充表单
  userForm.id = row.id
  userForm.username = row.username
  userForm.email = row.email
  userForm.role = row.role
  userForm.department = row.department || ''
  userForm.position = row.position || ''
  userForm.phone = row.phone || ''
  userForm.status = row.status === 'locked' ? 'inactive' : row.status
  
  userDialogVisible.value = true
}

// 提交用户表单
const submitUserForm = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value && userForm.id) {
        // 编辑用户
        const userData: UserUpdatePayload = { ...userForm }
        delete userData.password
        delete userData.id
        
        await userStore.updateUser(userForm.id, userData)
      } else {
        // 创建用户
        await userStore.createUser(userForm as UserCreatePayload)
      }
      
      userDialogVisible.value = false
      fetchUserList()
    }
  })
}

// 切换用户状态
const toggleStatus = async (user: User, status: 'active' | 'inactive' | 'locked') => {
  await userStore.toggleUserStatus(user.id, status)
  // 不需要重新获取列表，因为store已经更新了数据
}

// 重置用户密码
const resetPassword = async (user: User) => {
  ElMessageBox.confirm(
    `确定要重置 ${user.username} 的密码吗？`,
    '重置密码',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const password = await userStore.resetUserPassword(user.id)
    if (password) {
      tempPassword.value = password
      passwordDialogVisible.value = true
    }
  }).catch(() => {})
}

// 复制临时密码
const copyPassword = () => {
  navigator.clipboard.writeText(tempPassword.value).then(() => {
    ElMessage.success('密码已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 删除用户
const deleteUser = (user: User) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.username} 吗？此操作不可逆。`,
    '删除用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await userStore.deleteUser(user.id)
    fetchUserList()
  }).catch(() => {})
}

// 确认批量删除
const confirmBatchDelete = () => {
  if (selectedUsers.value.length === 0) return
  
  const usernames = selectedUsers.value.map(u => u.username).join('、')
  
  ElMessageBox.confirm(
    `确定要删除以下用户吗？此操作不可逆。\n${usernames}`,
    '批量删除用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const ids = selectedUsers.value.map(u => u.id)
    await userStore.batchDeleteUsers(ids)
    fetchUserList()
  }).catch(() => {})
}

// 导出用户列表
const exportUsers = () => {
  ElMessage.success('用户数据导出功能将在后续版本中提供')
}
</script>

<style scoped>
.user-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.password-result {
  padding: 20px 0;
}

.temp-password {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.temp-password span {
  white-space: nowrap;
}
</style> 