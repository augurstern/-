<template>
  <div class="backup-settings-panel" v-loading="loading">
    <div class="backup-settings">
      <h3>备份设置</h3>
      <el-form :model="backupSettings" label-width="120px" class="settings-form">
        <el-form-item label="自动备份">
          <el-switch v-model="backupSettings.autoBackup" />
        </el-form-item>
        
        <el-form-item label="备份频率">
          <el-select v-model="backupSettings.backupFrequency" style="width: 100%" :disabled="!backupSettings.autoBackup">
            <el-option
              v-for="item in backupFrequencyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备份时间">
          <el-time-picker 
            v-model="backupTime"
            format="HH:mm"
            placeholder="选择时间"
            :disabled="!backupSettings.autoBackup"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="最大备份数量">
          <el-input v-model="backupSettings.maxBackupCount" type="number" min="1" max="365" />
        </el-form-item>
        
        <el-form-item label="包含附件">
          <el-switch v-model="backupSettings.includeAttachments" />
        </el-form-item>
        
        <el-form-item label="备份位置">
          <el-radio-group v-model="backupSettings.backupLocation">
            <el-radio label="local">本地存储</el-radio>
            <el-radio label="cloud">云存储</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <template v-if="backupSettings.backupLocation === 'cloud'">
          <el-form-item label="云服务提供商">
            <el-select v-model="backupSettings.cloudProvider" style="width: 100%">
              <el-option label="AWS S3" value="aws" />
              <el-option label="阿里云OSS" value="aliyun" />
              <el-option label="腾讯云COS" value="tencent" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="云存储凭证">
            <el-button type="primary" @click="configureCloudCredentials">配置云存储凭证</el-button>
          </el-form-item>
        </template>
        
        <el-form-item>
          <el-button type="primary" @click="saveBackupSettings" style="margin-right: 10px" :loading="isSaving">保存设置</el-button>
          <el-button type="success" @click="runManualBackup" :loading="isBackingUp">手动备份</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="backup-history">
      <h3>备份历史记录</h3>
      
      <el-table :data="backupHistory" style="width: 100%" v-loading="isLoadingHistory">
        <el-table-column label="备份日期" prop="createdAt" :formatter="formatDate" />
        <el-table-column label="文件大小" prop="fileSize" :formatter="formatFileSize" />
        <el-table-column label="备份类型" prop="type">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'manual' ? 'success' : 'primary'">
              {{ scope.row.type === 'manual' ? '手动备份' : '自动备份' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" type="primary" @click="downloadBackup(scope.row.id)" :loading="isDownloading">下载</el-button>
            <el-button size="small" type="success" @click="restoreBackup(scope.row.id)" :loading="isRestoring">恢复</el-button>
            <el-button size="small" type="danger" @click="confirmDeleteBackup(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container" v-if="backupHistoryTotal > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="backupHistoryTotal"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 确认删除对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
      <span>确定要删除此备份吗？此操作不可撤销。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteBackup" :loading="isDeleting">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 确认恢复对话框 -->
    <el-dialog v-model="restoreDialogVisible" title="确认恢复" width="30%">
      <span>确定要从此备份恢复数据吗？当前数据将被覆盖。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="restoreDialogVisible = false">取消</el-button>
          <el-button type="success" @click="confirmRestore" :loading="isRestoring">确认恢复</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 云存储凭证配置对话框 -->
    <el-dialog v-model="cloudConfigDialogVisible" title="配置云存储凭证" width="50%">
      <el-form :model="cloudCredentials" label-width="120px">
        <template v-if="backupSettings.cloudProvider === 'aws'">
          <el-form-item label="访问密钥ID">
            <el-input v-model="cloudCredentials.accessKeyId" />
          </el-form-item>
          <el-form-item label="访问密钥">
            <el-input v-model="cloudCredentials.secretAccessKey" type="password" />
          </el-form-item>
          <el-form-item label="区域">
            <el-input v-model="cloudCredentials.region" />
          </el-form-item>
          <el-form-item label="存储桶名称">
            <el-input v-model="cloudCredentials.bucketName" />
          </el-form-item>
        </template>
        
        <template v-else-if="backupSettings.cloudProvider === 'aliyun'">
          <el-form-item label="AccessKey ID">
            <el-input v-model="cloudCredentials.accessKeyId" />
          </el-form-item>
          <el-form-item label="AccessKey Secret">
            <el-input v-model="cloudCredentials.accessKeySecret" type="password" />
          </el-form-item>
          <el-form-item label="地域节点">
            <el-input v-model="cloudCredentials.region" />
          </el-form-item>
          <el-form-item label="Bucket">
            <el-input v-model="cloudCredentials.bucket" />
          </el-form-item>
        </template>
        
        <template v-else-if="backupSettings.cloudProvider === 'tencent'">
          <el-form-item label="SecretId">
            <el-input v-model="cloudCredentials.secretId" />
          </el-form-item>
          <el-form-item label="SecretKey">
            <el-input v-model="cloudCredentials.secretKey" type="password" />
          </el-form-item>
          <el-form-item label="地域">
            <el-input v-model="cloudCredentials.region" />
          </el-form-item>
          <el-form-item label="存储桶名称">
            <el-input v-model="cloudCredentials.bucket" />
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cloudConfigDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCloudCredentials">保存凭证</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingsStore } from '../../stores/settings'
import dayjs from 'dayjs'

// 接收父组件传递的加载状态
const props = defineProps<{
  loading: boolean
}>()

const settingsStore = useSettingsStore()
const isSaving = ref(false)
const isBackingUp = ref(false)
const isLoadingHistory = ref(false)
const isDownloading = ref(false)
const isRestoring = ref(false)
const isDeleting = ref(false)

// 备份设置数据
const backupSettings = computed(() => settingsStore.backupSettings)

// 时间选择器的值
const backupTime = computed({
  get: () => {
    const [hours, minutes] = backupSettings.value.backupTime.split(':')
    const time = new Date()
    time.setHours(parseInt(hours))
    time.setMinutes(parseInt(minutes))
    return time
  },
  set: (newVal: Date) => {
    if (newVal) {
      const hours = newVal.getHours().toString().padStart(2, '0')
      const minutes = newVal.getMinutes().toString().padStart(2, '0')
      backupSettings.value.backupTime = `${hours}:${minutes}`
    }
  }
})

// 备份频率选项
const backupFrequencyOptions = [
  {
    value: 'daily',
    label: '每日'
  },
  {
    value: 'weekly',
    label: '每周'
  },
  {
    value: 'monthly',
    label: '每月'
  }
]

// 备份历史相关
const backupHistory = ref([])
const backupHistoryTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框控制
const deleteDialogVisible = ref(false)
const restoreDialogVisible = ref(false)
const cloudConfigDialogVisible = ref(false)
const backupIdToDelete = ref('')
const backupIdToRestore = ref('')

// 云存储凭证
const cloudCredentials = ref({
  accessKeyId: '',
  secretAccessKey: '',
  accessKeySecret: '',
  secretId: '',
  secretKey: '',
  region: '',
  bucketName: '',
  bucket: ''
})

// 获取备份历史
const fetchBackupHistory = async () => {
  isLoadingHistory.value = true
  try {
    const result = await settingsStore.fetchBackupHistory({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    backupHistory.value = result?.items || []
    backupHistoryTotal.value = result?.total || 0
  } catch (error) {
    console.error('获取备份历史失败:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

// 保存备份设置
const saveBackupSettings = async () => {
  try {
    isSaving.value = true
    await settingsStore.saveBackupSettings(backupSettings.value)
    ElMessage.success('保存备份设置成功')
  } catch (error) {
    ElMessage.error('保存备份设置失败')
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

// 执行手动备份
const runManualBackup = async () => {
  try {
    isBackingUp.value = true
    await settingsStore.runManualBackup()
    ElMessage.success('手动备份成功')
    // 刷新备份历史
    fetchBackupHistory()
  } catch (error) {
    ElMessage.error('手动备份失败')
    console.error(error)
  } finally {
    isBackingUp.value = false
  }
}

// 下载备份
const downloadBackup = async (id: string) => {
  try {
    isDownloading.value = true
    await settingsStore.downloadBackup(id)
    ElMessage.success('备份下载成功')
  } catch (error) {
    ElMessage.error('备份下载失败')
    console.error(error)
  } finally {
    isDownloading.value = false
  }
}

// 恢复备份确认
const restoreBackup = (id: string) => {
  backupIdToRestore.value = id
  restoreDialogVisible.value = true
}

// 确认恢复
const confirmRestore = async () => {
  try {
    isRestoring.value = true
    await settingsStore.restoreBackup(backupIdToRestore.value)
    ElMessage.success('从备份恢复成功')
    restoreDialogVisible.value = false
  } catch (error) {
    ElMessage.error('从备份恢复失败')
    console.error(error)
  } finally {
    isRestoring.value = false
  }
}

// 删除备份确认
const confirmDeleteBackup = (id: string) => {
  backupIdToDelete.value = id
  deleteDialogVisible.value = true
}

// 删除备份
const deleteBackup = async () => {
  try {
    isDeleting.value = true
    await settingsStore.deleteBackup(backupIdToDelete.value)
    ElMessage.success('备份删除成功')
    deleteDialogVisible.value = false
    // 刷新备份历史
    fetchBackupHistory()
  } catch (error) {
    ElMessage.error('备份删除失败')
    console.error(error)
  } finally {
    isDeleting.value = false
  }
}

// 显示云存储配置对话框
const configureCloudCredentials = () => {
  // 初始化凭证数据
  if (backupSettings.value.cloudCredentials) {
    cloudCredentials.value = { ...backupSettings.value.cloudCredentials }
  }
  cloudConfigDialogVisible.value = true
}

// 保存云存储凭证
const saveCloudCredentials = () => {
  backupSettings.value.cloudCredentials = { ...cloudCredentials.value }
  cloudConfigDialogVisible.value = false
  ElMessage.success('云存储凭证已更新，请点击保存设置以应用更改')
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchBackupHistory()
}

// 分页页码变更
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchBackupHistory()
}

// 格式化日期
const formatDate = (row: any) => {
  return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (row: any) => {
  const size = row.fileSize
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

// 组件挂载时获取备份历史
onMounted(() => {
  fetchBackupHistory()
  
  // 初始化云存储凭证
  if (backupSettings.value.cloudCredentials) {
    cloudCredentials.value = { ...backupSettings.value.cloudCredentials }
  }
})

// 监听分页参数变化
watch([currentPage, pageSize], () => {
  fetchBackupHistory()
})
</script>

<style scoped>
.backup-settings-panel {
  padding: 20px;
}

.backup-settings, .backup-history {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.settings-form {
  max-width: 600px;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-weight: 500;
  color: #303133;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style> 