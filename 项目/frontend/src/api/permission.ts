import { get, post } from './index'

/**
 * 资源权限对象
 */
export interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api' | 'data';
  resourceId?: string;
  resourceType?: string;
  description?: string;
  createTime: string;
  updateTime: string;
}

/**
 * 角色权限关联
 */
export interface RolePermission {
  roleId: string;
  permissionId: string;
  createTime: string;
}

/**
 * 角色定义
 */
export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'disabled';
  isSystem: boolean;
  permissions: Permission[];
  createTime: string;
  updateTime: string;
}

/**
 * 分页数据接口
 */
export interface PageResult<T> {
  items: T[];
  total: number;
}

/**
 * 查询参数
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  type?: string;
  [key: string]: any;
}

/**
 * 获取所有权限列表
 */
export function getAllPermissions(params?: Omit<QueryParams, 'page' | 'pageSize'>) {
  return get<Permission[]>('/system/permission/list', { params })
}

/**
 * 获取权限分页列表
 */
export function getPermissionPage(params?: QueryParams) {
  return get<PageResult<Permission>>('/system/permission/page', { params })
}

/**
 * 获取权限详情
 */
export function getPermissionDetail(id: string) {
  return get<Permission>(`/system/permission/${id}`)
}

/**
 * 创建权限
 */
export function createPermission(data: Omit<Permission, 'id' | 'createTime' | 'updateTime'>) {
  return post<Permission>('/system/permission', data)
}

/**
 * 更新权限
 */
export function updatePermission(id: string, data: Partial<Omit<Permission, 'id' | 'createTime' | 'updateTime'>>) {
  return post<Permission>(`/system/permission/${id}`, data)
}

/**
 * 删除权限
 */
export function deletePermission(id: string) {
  return post('/system/permission/delete', { ids: [id] })
}

/**
 * 批量删除权限
 */
export function batchDeletePermissions(ids: string[]) {
  return post('/system/permission/delete', { ids })
}

/**
 * 获取所有角色列表
 */
export function getAllRoles(params?: Omit<QueryParams, 'page' | 'pageSize'>) {
  return get<Role[]>('/system/role/list', { params })
}

/**
 * 获取角色分页列表
 */
export function getRolePage(params?: QueryParams) {
  return get<PageResult<Role>>('/system/role/page', { params })
}

/**
 * 获取角色详情
 */
export function getRoleDetail(id: string) {
  return get<Role>(`/system/role/${id}`)
}

/**
 * 创建角色
 */
export function createRole(data: Omit<Role, 'id' | 'createTime' | 'updateTime' | 'permissions'>) {
  return post<Role>('/system/role', data)
}

/**
 * 更新角色
 */
export function updateRole(id: string, data: Partial<Omit<Role, 'id' | 'createTime' | 'updateTime' | 'permissions'>>) {
  return post<Role>(`/system/role/${id}`, data)
}

/**
 * 删除角色
 */
export function deleteRole(id: string) {
  return post('/system/role/delete', { ids: [id] })
}

/**
 * 批量删除角色
 */
export function batchDeleteRoles(ids: string[]) {
  return post('/system/role/delete', { ids })
}

/**
 * 获取角色的权限列表
 */
export function getRolePermissions(roleId: string) {
  return get<Permission[]>(`/system/role/${roleId}/permissions`)
}

/**
 * 分配角色权限
 */
export function assignRolePermissions(roleId: string, permissionIds: string[]) {
  return post(`/system/role/${roleId}/permissions`, { permissionIds })
}

/**
 * 验证用户是否有权限
 */
export function checkPermission(permissionCode: string) {
  return post<boolean>('/system/permission/check', { permissionCode })
}

/**
 * 获取当前用户的所有权限
 */
export function getCurrentUserPermissions() {
  return get<Permission[]>('/system/permission/currentUser')
}

// 模拟数据 - 仅在开发环境使用
const mockPermissions: Permission[] = [
  {
    id: '1',
    name: '用户管理查看',
    code: 'system:user:view',
    type: 'menu',
    description: '查看用户管理页面',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '2',
    name: '用户管理新增',
    code: 'system:user:add',
    type: 'button',
    description: '新增用户权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '3',
    name: '用户管理编辑',
    code: 'system:user:edit',
    type: 'button',
    description: '编辑用户权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '4',
    name: '用户管理删除',
    code: 'system:user:delete',
    type: 'button',
    description: '删除用户权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '5',
    name: '合同管理查看',
    code: 'contract:view',
    type: 'menu',
    description: '查看合同列表',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '6',
    name: '合同管理新增',
    code: 'contract:add',
    type: 'button',
    description: '新增合同权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '7',
    name: '合同管理编辑',
    code: 'contract:edit',
    type: 'button',
    description: '编辑合同权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '8',
    name: '合同管理删除',
    code: 'contract:delete',
    type: 'button',
    description: '删除合同权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '9',
    name: '合同审批',
    code: 'contract:approve',
    type: 'button',
    description: '合同审批权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '10',
    name: '合同归档',
    code: 'contract:archive',
    type: 'button',
    description: '合同归档权限',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  }
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: '系统管理员',
    code: 'admin',
    description: '系统管理员，拥有所有权限',
    status: 'active',
    isSystem: true,
    permissions: mockPermissions,
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '2',
    name: '合同管理员',
    code: 'contract_manager',
    description: '合同管理员，管理所有合同',
    status: 'active',
    isSystem: true,
    permissions: mockPermissions.filter(p => p.code.startsWith('contract:')),
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  },
  {
    id: '3',
    name: '普通用户',
    code: 'user',
    description: '普通用户，仅查看权限',
    status: 'active',
    isSystem: true,
    permissions: mockPermissions.filter(p => p.code.endsWith(':view')),
    createTime: '2023-01-01 00:00:00',
    updateTime: '2023-01-01 00:00:00'
  }
]; 