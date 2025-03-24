import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { RouteRecordRaw } from 'vue-router'

// 布局组件
const DefaultLayout = () => import('../layouts/DefaultLayout.vue')

// 视图组件
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const ContractView = () => import('../views/ContractView.vue')
const ContractDetailView = () => import('../views/ContractDetailView.vue')
const SettingsView = () => import('../views/SettingsView.vue')
const UserProfileView = () => import('../views/UserProfileView.vue')
const NotificationSettingsView = () => import('../views/profile/NotificationSettingsView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')
const ContractFormView = () => import('../views/ContractFormView.vue')

// 系统管理路由
const systemRoutes: RouteRecordRaw[] = [
  {
    path: 'user',
    name: 'UserList',
    component: () => import('@/views/UserListView.vue'),
    meta: { title: '用户管理', icon: 'user', roles: ['admin'] }
  },
  /* 暂时注释不存在的组件路由
  {
    path: 'role',
    name: 'RoleList',
    component: () => import('@/views/system/RoleList.vue'),
    meta: { title: '角色管理', icon: 'user-filled', roles: ['admin'] }
  },
  {
    path: 'menu',
    name: 'MenuList',
    component: () => import('@/views/system/MenuList.vue'),
    meta: { title: '菜单管理', icon: 'menu', roles: ['admin'] }
  },
  {
    path: 'dept',
    name: 'DeptList',
    component: () => import('@/views/system/DeptList.vue'),
    meta: { title: '部门管理', icon: 'office-building', roles: ['admin'] }
  },
  {
    path: 'post',
    name: 'PostList',
    component: () => import('@/views/system/PostList.vue'),
    meta: { title: '岗位管理', icon: 'postcard', roles: ['admin'] }
  },
  */
  {
    path: 'dict',
    name: 'DictTypeList',
    component: () => import('@/views/system/DictTypeView.vue'),
    meta: { title: '字典管理', icon: 'notebook', roles: ['admin'] }
  },
  {
    path: 'dict/item',
    name: 'DictItemList',
    component: () => import('@/views/system/DictItemList.vue'),
    meta: { title: '字典数据', icon: 'document', roles: ['admin'], hideInMenu: true }
  },
  {
    path: 'config',
    name: 'ConfigList',
    component: () => import('@/views/system/ConfigList.vue'),
    meta: { title: '参数设置', icon: 'setting', roles: ['admin'] }
  },
  /* 暂时注释不存在的组件路由
  {
    path: 'notice',
    name: 'NoticeList',
    component: () => import('@/views/system/NoticeList.vue'),
    meta: { title: '通知公告', icon: 'bell', roles: ['admin'] }
  },
  {
    path: 'log',
    name: 'Log',
    component: () => import('@/views/system/Log.vue'),
    meta: { title: '日志管理', icon: 'document', roles: ['admin'] },
    children: [
      {
        path: 'operlog',
        name: 'OperLog',
        component: () => import('@/views/system/log/OperLog.vue'),
        meta: { title: '操作日志', roles: ['admin'] }
      },
      {
        path: 'loginlog',
        name: 'LoginLog',
        component: () => import('@/views/system/log/LoginLog.vue'),
        meta: { title: '登录日志', roles: ['admin'] }
      }
    ]
  }
  */
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: DefaultLayout,
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: '首页', icon: 'Odometer' }
        },
        {
          path: '/contract',
          name: 'contract',
          component: ContractView,
          meta: { title: '合同管理', icon: 'Document' }
        },
        {
          path: '/contract/detail/:id',
          name: 'contract-detail',
          component: ContractDetailView,
          meta: { title: '合同详情', hideInMenu: true }
        },
        {
          path: '/contract/create',
          name: 'contract-create',
          component: ContractFormView,
          meta: { title: '创建合同', hideInMenu: true }
        },
        {
          path: '/contract/edit/:id',
          name: 'contract-edit',
          component: ContractFormView,
          meta: { title: '编辑合同', hideInMenu: true }
        },
        {
          path: '/profile',
          name: 'profile',
          component: UserProfileView,
          meta: { title: '个人中心', hideInMenu: true }
        },
        {
          path: '/profile/notification-settings',
          name: 'notification-settings',
          component: NotificationSettingsView,
          meta: { title: '通知设置', hideInMenu: true }
        },
        {
          path: '/system',
          name: 'system',
          component: () => import('@/views/system/index.vue'),
          meta: { title: '系统管理', icon: 'Setting', roles: ['admin'] },
          redirect: '/system/user',
          children: systemRoutes
        },
        {
          path: '/report',
          name: 'Report',
          component: () => import('../views/ReportView.vue'),
          meta: {
            title: '报表分析',
            requiresAuth: true,
            icon: 'PieChart',
            permission: 'report:view'
          }
        },
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: '登录' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: '404' }
    }
  ]
})

// 导航守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title ? to.meta.title : '合同管理系统'}`
  
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const isAuthenticated = authStore.isLoggedIn
  
  // 获取角色要求
  const requiredRole = to.meta.role as string[] | undefined
  
  // 检查用户是否已认证(代替initialized属性)
  if (requiresAuth && !isAuthenticated) {
    try {
      await authStore.initAuth()
    } catch (error) {
      console.error('初始化认证状态失败:', error)
    }
  }
  
  // 认证逻辑
  if (requiresAuth && !authStore.isLoggedIn) {
    // 需要认证但未登录，重定向到登录页
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    // 已登录用户访问登录页，重定向到首页
    next({ name: 'dashboard' })
  } else if (requiredRole && authStore.user?.role && !requiredRole.includes(authStore.user.role)) {
    // 角色检查，权限不足
    next({ name: 'dashboard' })
  } else {
    // 正常导航
    next()
  }
})

export default router