import { get, post, put, del } from './index'

export interface Department {
  id: string
  name: string
  code: string
  parentId?: string
  path?: string
  level: number
  sort: number
  manager?: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[]
}

export interface DepartmentQueryParams {
  keyword?: string
  status?: string
  parentId?: string
  page: number
  pageSize: number
}

export interface DepartmentCreatePayload {
  name: string
  code: string
  parentId?: string
  sort?: number
  manager?: string
  description?: string
  status?: 'active' | 'inactive'
}

export interface DepartmentUpdatePayload {
  name?: string
  code?: string
  parentId?: string
  sort?: number
  manager?: string
  description?: string
  status?: 'active' | 'inactive'
}

/**
 * 获取部门列表
 */
export async function getDepartments(params: DepartmentQueryParams): Promise<{
  items: Department[]
  total: number
}> {
  return get('/departments', params)
}

/**
 * 获取部门树形结构
 */
export async function getDepartmentTree(params?: { status?: string }): Promise<DepartmentTreeNode[]> {
  return get('/departments/tree', params)
}

/**
 * 获取单个部门信息
 */
export async function getDepartment(id: string): Promise<Department> {
  return get(`/departments/${id}`)
}

/**
 * 创建新部门
 */
export async function createDepartment(departmentData: DepartmentCreatePayload): Promise<Department> {
  return post('/departments', departmentData)
}

/**
 * 更新部门信息
 */
export async function updateDepartment(id: string, departmentData: DepartmentUpdatePayload): Promise<Department> {
  return put(`/departments/${id}`, departmentData)
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: string): Promise<{ success: boolean; message: string }> {
  return del(`/departments/${id}`)
}

/**
 * 启用/禁用部门
 */
export async function toggleDepartmentStatus(id: string, status: 'active' | 'inactive'): Promise<Department> {
  return put(`/departments/${id}/status`, { status })
}

/**
 * 获取部门的用户列表
 */
export async function getDepartmentUsers(departmentId: string, params: { page: number; pageSize: number }): Promise<{
  items: {
    id: string
    username: string
    email: string
    role: string
    position?: string
    phone?: string
    status: string
  }[]
  total: number
}> {
  return get(`/departments/${departmentId}/users`, params)
}

/**
 * 移动部门位置
 */
export async function moveDepartment(id: string, target: { parentId?: string; sort: number }): Promise<Department> {
  return put(`/departments/${id}/move`, target)
}

/**
 * 获取部门统计数据
 */
export async function getDepartmentStats(): Promise<{
  totalDepartments: number
  activeDepartments: number
  inactiveDepartments: number
  maxLevel: number
}> {
  return get('/departments/stats')
} 