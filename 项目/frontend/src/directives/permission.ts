import { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'

/**
 * 权限指令参数类型
 */
export type PermissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding): void
  updated(el: HTMLElement, binding: DirectiveBinding): void
}

/**
 * 权限指令 - 基于权限码控制元素显示
 * 使用方式：
 * 1. 单个权限: v-permission="'system:user:add'"
 * 2. 多个权限(或关系): v-permission="'system:user:add,system:user:edit'"
 * 3. 多个权限(与关系): v-permission:all="['system:user:add', 'system:user:edit']"
 */
export const permission: PermissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  }
}

/**
 * 角色指令 - 基于角色控制元素显示
 * 使用方式：
 * 1. 单个角色: v-role="'admin'"
 * 2. 多个角色(或关系): v-role="['admin', 'manager']"
 */
export const role: PermissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding)
  }
}

/**
 * 检查权限
 */
function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const permissionStore = usePermissionStore()
  
  // 检查指令值类型
  const value = binding.value
  if (!value) {
    removeElement(el)
    return
  }
  
  // 检查修饰符 - all表示需要同时具有所有权限
  const allPermissions = binding.modifiers.all
  
  // 权限检查
  let hasPermission = false
  if (allPermissions && Array.isArray(value)) {
    // 必须拥有所有指定权限
    hasPermission = permissionStore.hasAllPermissions(value)
  } else if (typeof value === 'string') {
    // 至少拥有一个指定权限
    hasPermission = permissionStore.hasPermission(value)
  } else if (Array.isArray(value)) {
    // 至少拥有一个指定权限
    hasPermission = value.some(item => permissionStore.hasPermission(item))
  } else {
    console.error('v-permission指令值类型错误，必须是字符串或字符串数组')
    removeElement(el)
    return
  }
  
  if (!hasPermission) {
    removeElement(el)
  }
}

/**
 * 检查角色
 */
function checkRole(el: HTMLElement, binding: DirectiveBinding) {
  const authStore = useAuthStore()
  const userRole = authStore.userRole
  
  // 检查指令值类型
  const value = binding.value
  if (!value) {
    removeElement(el)
    return
  }
  
  // 角色检查
  let hasRole = false
  if (typeof value === 'string') {
    hasRole = userRole === value
  } else if (Array.isArray(value)) {
    hasRole = value.includes(userRole)
  } else {
    console.error('v-role指令值类型错误，必须是字符串或字符串数组')
    removeElement(el)
    return
  }
  
  if (!hasRole) {
    removeElement(el)
  }
}

/**
 * 移除元素
 */
function removeElement(el: HTMLElement) {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  } else {
    el.style.display = 'none'
  }
}

// 导出所有权限指令
export default {
  permission,
  role
} 