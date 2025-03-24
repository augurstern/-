import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import * as departmentApi from '../api/department'
import type { 
  Department, 
  DepartmentTreeNode,
  DepartmentQueryParams, 
  DepartmentCreatePayload, 
  DepartmentUpdatePayload 
} from '../api/department'

interface DepartmentState {
  departmentList: Department[]
  departmentTree: DepartmentTreeNode[]
  total: number
  currentDepartment: Department | null
  loading: boolean
  error: string | null
  queryParams: DepartmentQueryParams
}

export const useDepartmentStore = defineStore('department', {
  state: (): DepartmentState => ({
    departmentList: [],
    departmentTree: [],
    total: 0,
    currentDepartment: null,
    loading: false,
    error: null,
    queryParams: {
      page: 1,
      pageSize: 10
    }
  }),
  
  getters: {
    // 部门总数
    departmentCount: (state) => state.total,
    
    // 获取分页参数
    pagination: (state) => ({
      currentPage: state.queryParams.page,
      pageSize: state.queryParams.pageSize,
      total: state.total
    }),
    
    // 获取查询参数
    filters: (state) => ({
      keyword: state.queryParams.keyword || '',
      status: state.queryParams.status || '',
      parentId: state.queryParams.parentId || ''
    }),
    
    // 部门名称映射
    departmentMap: (state) => {
      const map: Record<string, string> = {}
      // 递归处理部门树
      const processDepartments = (departments: DepartmentTreeNode[]) => {
        departments.forEach(dept => {
          map[dept.id] = dept.name
          if (dept.children && dept.children.length > 0) {
            processDepartments(dept.children)
          }
        })
      }
      
      processDepartments(state.departmentTree)
      return map
    },
    
    // 部门路径映射
    departmentPathMap: (state) => {
      const map: Record<string, string> = {}
      // 递归处理部门树
      const processDepartments = (departments: DepartmentTreeNode[], parentPath = '') => {
        departments.forEach(dept => {
          const currentPath = parentPath ? `${parentPath} / ${dept.name}` : dept.name
          map[dept.id] = currentPath
          if (dept.children && dept.children.length > 0) {
            processDepartments(dept.children, currentPath)
          }
        })
      }
      
      processDepartments(state.departmentTree)
      return map
    },
    
    // 获取部门下拉选项（用于表单选择）
    departmentOptions: (state) => {
      const options: { label: string; value: string; disabled?: boolean }[] = []
      
      // 递归处理部门树
      const processDepartments = (departments: DepartmentTreeNode[], level = 0) => {
        departments.forEach(dept => {
          const prefix = level > 0 ? '│ '.repeat(level) : ''
          options.push({
            label: prefix + dept.name,
            value: dept.id,
            disabled: dept.status === 'inactive'
          })
          
          if (dept.children && dept.children.length > 0) {
            processDepartments(dept.children, level + 1)
          }
        })
      }
      
      processDepartments(state.departmentTree)
      return options
    }
  },
  
  actions: {
    // 设置加载状态
    setLoading(status: boolean): void {
      this.loading = status
    },
    
    // 设置错误信息
    setError(error: string | null): void {
      this.error = error
    },
    
    // 设置查询参数
    setQueryParams(params: Partial<DepartmentQueryParams>): void {
      this.queryParams = { ...this.queryParams, ...params }
    },
    
    // 重置查询参数
    resetQueryParams(): void {
      this.queryParams = {
        page: 1,
        pageSize: 10
      }
    },
    
    // 获取部门列表
    async fetchDepartments(params?: Partial<DepartmentQueryParams>): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      if (params) {
        this.setQueryParams(params)
      }
      
      try {
        const { items, total } = await departmentApi.getDepartments(this.queryParams)
        this.departmentList = items
        this.total = total
      } catch (error: any) {
        this.setError(error?.message || '获取部门列表失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取部门树形结构
    async fetchDepartmentTree(params?: { status?: string }): Promise<void> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        this.departmentTree = await departmentApi.getDepartmentTree(params)
      } catch (error: any) {
        this.setError(error?.message || '获取部门树形结构失败')
        ElMessage.error(this.error || '数据加载失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取单个部门信息
    async fetchDepartment(id: string): Promise<Department | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const department = await departmentApi.getDepartment(id)
        this.currentDepartment = department
        return department
      } catch (error: any) {
        this.setError(error?.message || '获取部门信息失败')
        ElMessage.error(this.error || '数据加载失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 创建部门
    async createDepartment(departmentData: DepartmentCreatePayload): Promise<Department | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const department = await departmentApi.createDepartment(departmentData)
        
        // 刷新部门树
        await this.fetchDepartmentTree()
        
        ElMessage.success('部门创建成功')
        return department
      } catch (error: any) {
        this.setError(error?.message || '创建部门失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 更新部门
    async updateDepartment(id: string, departmentData: DepartmentUpdatePayload): Promise<Department | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedDepartment = await departmentApi.updateDepartment(id, departmentData)
        
        // 更新列表中的部门数据
        const index = this.departmentList.findIndex(department => department.id === id)
        if (index !== -1) {
          this.departmentList[index] = updatedDepartment
        }
        
        // 如果当前查看的部门是被更新的部门，也更新当前部门
        if (this.currentDepartment && this.currentDepartment.id === id) {
          this.currentDepartment = updatedDepartment
        }
        
        // 刷新部门树
        await this.fetchDepartmentTree()
        
        ElMessage.success('部门信息更新成功')
        return updatedDepartment
      } catch (error: any) {
        this.setError(error?.message || '更新部门失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 删除部门
    async deleteDepartment(id: string): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        await departmentApi.deleteDepartment(id)
        
        // 从列表中移除部门
        this.departmentList = this.departmentList.filter(department => department.id !== id)
        this.total -= 1
        
        // 如果当前查看的部门是被删除的部门，清空当前部门
        if (this.currentDepartment && this.currentDepartment.id === id) {
          this.currentDepartment = null
        }
        
        // 刷新部门树
        await this.fetchDepartmentTree()
        
        ElMessage.success('部门删除成功')
        return true
      } catch (error: any) {
        this.setError(error?.message || '删除部门失败')
        ElMessage.error(this.error || '操作失败')
        return false
      } finally {
        this.setLoading(false)
      }
    },
    
    // 修改部门状态
    async toggleDepartmentStatus(id: string, status: 'active' | 'inactive'): Promise<Department | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedDepartment = await departmentApi.toggleDepartmentStatus(id, status)
        
        // 更新列表中的部门数据
        const index = this.departmentList.findIndex(department => department.id === id)
        if (index !== -1) {
          this.departmentList[index] = updatedDepartment
        }
        
        // 如果当前查看的部门是被更新的部门，也更新当前部门
        if (this.currentDepartment && this.currentDepartment.id === id) {
          this.currentDepartment = updatedDepartment
        }
        
        // 刷新部门树
        await this.fetchDepartmentTree()
        
        ElMessage.success(`部门状态已更新为${status === 'active' ? '启用' : '禁用'}`)
        return updatedDepartment
      } catch (error: any) {
        this.setError(error?.message || '更新部门状态失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 移动部门位置
    async moveDepartment(id: string, target: { parentId?: string; sort: number }): Promise<Department | null> {
      this.setLoading(true)
      this.setError(null)
      
      try {
        const updatedDepartment = await departmentApi.moveDepartment(id, target)
        
        // 刷新部门树
        await this.fetchDepartmentTree()
        
        ElMessage.success('部门位置已调整')
        return updatedDepartment
      } catch (error: any) {
        this.setError(error?.message || '移动部门失败')
        ElMessage.error(this.error || '操作失败')
        return null
      } finally {
        this.setLoading(false)
      }
    },
    
    // 获取部门下的用户列表
    async fetchDepartmentUsers(departmentId: string, params: { page: number; pageSize: number }) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        return await departmentApi.getDepartmentUsers(departmentId, params)
      } catch (error: any) {
        this.setError(error?.message || '获取部门用户列表失败')
        ElMessage.error(this.error || '数据加载失败')
        return { items: [], total: 0 }
      } finally {
        this.setLoading(false)
      }
    }
  }
}) 