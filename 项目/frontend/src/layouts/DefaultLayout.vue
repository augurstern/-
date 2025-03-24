<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMenu, ElMenuItem, ElSubMenu, ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage, ElAvatar, ElBadge, ElTooltip } from 'element-plus'
import { Document, Folder, Setting, User, Bell, Search, FullScreen, Refresh, Moon, Sunny, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import NotificationPanel from '../components/notification/NotificationPanel.vue'
import NotificationBadge from '../components/notification/NotificationBadge.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const isCollapse = ref(false)
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const showSearchBox = ref(false)
const searchKeyword = ref('')
const notifications = ref([
  { id: 1, title: '新合同需要审批', time: '10分钟前', read: false },
  { id: 2, title: '合同XYZ即将到期', time: '1小时前', read: false },
  { id: 3, title: '用户管理员更新了系统设置', time: '2小时前', read: true }
])

// 从状态管理获取用户信息
const userInfo = computed(() => authStore.user || { name: '未登录' })

// 未读通知数量
const unreadCount = computed(() => notificationStore.unreadCount)

// 是否有新通知
const hasNewNotifications = computed(() => notificationStore.hasNewNotifications)

// 显示通知面板
const showNotificationPanel = computed({
  get: () => notificationStore.showNotificationPanel,
  set: (value) => {
    notificationStore.showNotificationPanel = value
  }
})

// 移动设备判断
const isMobile = ref(window.innerWidth < 768)

// 当前路由标题
const currentRouteTitle = computed(() => {
  const matched = route.matched
  if (matched.length > 1 && matched[1].meta.title) {
    return matched[1].meta.title
  }
  return '合同管理系统'
})

// 菜单项
const menuItems = [
  {
    name: '仪表盘',
    icon: Document,
    route: '/'
  },
  {
    name: '合同管理',
    icon: Folder,
    route: '/contracts'
  },
  {
    name: '系统设置',
    icon: Setting,
    route: '/settings'
  }
]

// 处理菜单点击
const handleMenuSelect = (route: string): void => {
  router.push(route)
}

// 处理登出
const handleLogout = async (): Promise<void> => {
  try {
    await authStore.logout()
    ElMessage.success('已成功登出')
  } catch (error) {
    ElMessage.error('登出失败')
    console.error('登出错误:', error)
  }
}

// 切换侧边栏折叠状态
const toggleSidebar = (): void => {
  isCollapse.value = !isCollapse.value
  localStorage.setItem('sidebarCollapsed', isCollapse.value ? 'true' : 'false')
}

// 切换暗色/亮色模式
const toggleDarkMode = (): void => {
  isDarkMode.value = !isDarkMode.value
  
  // 保存到本地存储
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  
  // 设置文档根元素的 data-theme 属性
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
}

// 全屏切换
const toggleFullScreen = (): void => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

// 刷新页面
const refreshPage = (): void => {
  window.location.reload()
}

// 搜索功能
const handleSearch = (): void => {
  if (searchKeyword.value.trim()) {
    // 这里可以实现搜索逻辑，如导航到搜索结果页面
    ElMessage.info(`搜索关键词: ${searchKeyword.value}`)
    searchKeyword.value = ''
    showSearchBox.value = false
  }
}

// 标记全部已读
const markAllAsRead = async (): Promise<void> => {
  await notificationStore.readAllNotifications()
  ElMessage.success('已将所有通知标记为已读')
}

// 处理通知点击
const handleNotificationClick = (notification: any): void => {
  // 处理导航逻辑
  if (notification.relatedType && notification.relatedId) {
    // 根据类型导航到不同页面
    switch (notification.relatedType) {
      case 'contract':
        router.push(`/contract/detail/${notification.relatedId}`)
        break
      case 'task':
        router.push(`/task/detail/${notification.relatedId}`)
        break
      case 'approval':
        router.push(`/approval/detail/${notification.relatedId}`)
        break
      default:
        // 默认行为
        break
    }
  }
  
  // 关闭通知面板
  showNotificationPanel.value = false
}

// 切换通知面板显示状态
const toggleNotificationPanel = (): void => {
  showNotificationPanel.value = !showNotificationPanel.value
}

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 监听窗口大小变化
// 初始化
onMounted(() => {
  // 恢复侧边栏状态
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState) {
    isCollapse.value = savedState === 'true'
  }
  
  // 应用主题
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
})

// 监听路由变化，在移动设备上自动收起侧边栏
watch(route, () => {
  if (window.innerWidth < 768) {
    isCollapse.value = true
  }
})
</script>

<template>
  <div class="layout-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航 -->
    <header class="layout-header">
      <div class="header-left">
        <span @click="toggleSidebar" class="collapse-btn">
          <el-icon><Document /></el-icon>
        </span>
        <h1 class="site-title">{{ currentRouteTitle }}</h1>
      </div>
      
      <div class="header-right">
        <!-- 搜索框 -->
        <div class="search-container" :class="{ 'active': showSearchBox }">
          <el-icon class="search-icon" @click="showSearchBox = !showSearchBox">
            <Search />
          </el-icon>
          <input 
            v-show="showSearchBox" 
            v-model="searchKeyword" 
            class="search-input" 
            placeholder="搜索..." 
            @keyup.enter="handleSearch"
          >
        </div>
        
        <!-- 功能按钮 -->
        <div class="header-actions">
          <el-tooltip content="刷新页面" placement="bottom">
            <el-icon class="action-icon" @click="refreshPage"><Refresh /></el-icon>
          </el-tooltip>
          
          <el-tooltip :content="isDarkMode ? '切换亮色模式' : '切换暗色模式'" placement="bottom">
            <el-icon class="action-icon" @click="toggleDarkMode">
              <component :is="isDarkMode ? 'Sunny' : 'Moon'" />
            </el-icon>
          </el-tooltip>
          
          <el-tooltip content="全屏显示" placement="bottom">
            <el-icon class="action-icon" @click="toggleFullScreen"><FullScreen /></el-icon>
          </el-tooltip>
          
          <!-- 通知 -->
          <notification-badge size="small" />
          
          <!-- 用户头像 -->
          <el-dropdown trigger="click" @command="handleUserCommand">
            <span class="user-avatar">
              <el-avatar :size="32" :icon="User">
                {{ userInfo?.name?.substring(0, 1) || 'U' }}
              </el-avatar>
              <span class="user-name" v-if="!isCollapse">{{ userInfo?.name || '未登录' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <div class="layout-main">
      <!-- 侧边菜单 -->
      <aside class="layout-sidebar" :class="{ 'is-collapsed': isCollapse }">
        <div class="sidebar" :class="{ 'is-collapsed': isCollapse }">
          <div class="logo-container">
            <div class="text-logo">CM</div>
            <h1 class="logo-text" v-if="!isCollapse">合同管理系统</h1>
          </div>
          
          <!-- 菜单 -->
          <el-menu
            :default-active="route.path"
            class="sidebar-menu"
            :collapse="isCollapse"
            @select="handleMenuSelect"
          >
            <!-- 菜单项 -->
            <el-menu-item v-for="item in menuItems" :key="item.name" :index="item.route">
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.name }}</template>
            </el-menu-item>
          </el-menu>
        </div>
        
        <div class="sidebar-footer" :class="{ 'collapsed': isCollapse }">
          <el-tooltip content="切换侧边栏" placement="top">
            <div class="collapse-trigger" @click="toggleSidebar">
              <el-icon><component :is="isCollapse ? 'ArrowRight' : 'ArrowLeft'" /></el-icon>
            </div>
          </el-tooltip>
        </div>
      </aside>
      
      <!-- 主内容区 -->
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
  transition: all 0.3s;
}

.dark-mode {
  --el-bg-color-page: #141414;
  --el-text-color-primary: #f0f0f0;
  --el-text-color-regular: #d0d0d0;
  --el-border-color-light: #434343;
}

.layout-header {
  height: 60px;
  background-color: var(--el-color-primary, #409EFF);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.site-title {
  font-size: 18px;
  font-weight: 500;
  margin-left: 15px;
}

.collapse-btn {
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-icon {
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.action-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-avatar:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-name {
  margin-left: 8px;
  font-size: 14px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 240px;
  height: 100%;
  transition: width 0.3s;
  background-color: var(--el-bg-color, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 900;
}

.layout-sidebar.is-collapsed {
  width: 64px;
}

.sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-border-color-light, #e4e7ed);
}

.text-logo {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
  white-space: nowrap;
}

.logo-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.sidebar-footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  border-top: 1px solid var(--el-border-color-light, #e4e7ed);
}

.sidebar-footer.collapsed {
  justify-content: center;
  padding: 0;
}

.collapse-trigger {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.collapse-trigger:hover {
  background-color: var(--el-fill-color-light, #f5f7fa);
}

.layout-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--el-bg-color-page, #f5f7fa);
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 20px;
  transition: width 0.3s;
  width: 32px;
}

.search-container.active {
  width: 200px;
}

.search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  z-index: 2;
}

.search-input {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 20px;
  color: white;
  padding: 6px 12px 6px 30px;
  width: 100%;
  transition: all 0.3s;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.notification-badge {
  margin-right: 5px;
}

.notification-menu {
  width: 300px;
  max-height: 400px;
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid var(--el-border-color-light, #e4e7ed);
  font-weight: bold;
  font-size: 14px;
}

.mark-read-btn {
  color: var(--el-color-primary, #409EFF);
  cursor: pointer;
  font-size: 12px;
}

.notification-item {
  padding: 10px 0;
}

.notification-content {
  display: flex;
  flex-direction: column;
}

.notification-title {
  font-size: 14px;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.unread {
  background-color: rgba(64, 158, 255, 0.1);
}

.empty-notifications {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary, #909399);
}

@media (max-width: 768px) {
  .layout-sidebar:not(.is-collapsed) {
    position: absolute;
    height: calc(100vh - 60px);
    z-index: 1000;
  }
  
  .username {
    display: none;
  }
  
  .search-container.active {
    width: 150px;
  }
  
  .layout-content {
    padding: 15px;
  }
}
</style> 