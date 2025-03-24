import { App } from 'vue'
import permissionDirectives from '@/directives/permission'
import { usePermissionStore } from '@/stores/permission'

// 注册自定义权限指令
export function setupPermissions(app: App) {
  // 注册v-permission指令
  app.directive('permission', permissionDirectives.permission)
  
  // 注册v-role指令
  app.directive('role', permissionDirectives.role)
  
  // 初始化权限数据
  const permissionStore = usePermissionStore()
  permissionStore.initPermissions()
  
  // 添加全局权限检查方法
  app.config.globalProperties.$hasPermission = (permission: string) => {
    return permissionStore.hasPermission(permission)
  }
  
  app.config.globalProperties.$hasAllPermissions = (permissions: string[]) => {
    return permissionStore.hasAllPermissions(permissions)
  }
  
  app.config.globalProperties.$hasButtonPermission = (permission: string) => {
    return permissionStore.hasButtonPermission(permission)
  }
  
  console.log('权限系统初始化完成')
}

export default {
  install(app: App) {
    setupPermissions(app)
  }
} 