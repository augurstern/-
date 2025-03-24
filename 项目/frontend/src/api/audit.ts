import { get, post } from './index'

/**
 * 审计日志类型
 */
export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  module: string;
  operation: string;
  method: string;
  requestUrl: string;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestParams?: string;
  responseData?: string;
  status: 'success' | 'fail';
  errorMsg?: string;
  operationTime: string;
  duration: number; // 操作耗时（毫秒）
  details?: string; // 操作详情JSON
}

/**
 * 敏感操作日志类型
 */
export interface SensitiveOperationLog extends AuditLog {
  // 敏感操作需要二次授权的信息
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalTime?: string;
  approverId?: string;
  approverName?: string;
  approvalComment?: string;
  requireApproval: boolean; // 是否需要审批
}

/**
 * 查询参数
 */
export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  username?: string;
  status?: string;
  module?: string;
  operation?: string;
  requestMethod?: string;
  [key: string]: any;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  items: T[];
  total: number;
}

/**
 * 获取操作日志列表
 */
export function getAuditLogList(params: AuditQueryParams) {
  return get<PageResult<AuditLog>>('/system/audit-log/list', { params })
}

/**
 * 获取敏感操作日志列表
 */
export function getSensitiveLogList(params: AuditQueryParams) {
  return get<PageResult<SensitiveOperationLog>>('/system/audit-log/sensitive', { params })
}

/**
 * 获取操作日志详情
 */
export function getAuditLogDetail(id: string) {
  return get<AuditLog>(`/system/audit-log/${id}`)
}

/**
 * 删除操作日志
 */
export function deleteAuditLog(id: string) {
  return post('/system/audit-log/delete', { ids: [id] })
}

/**
 * 批量删除操作日志
 */
export function batchDeleteAuditLogs(ids: string[]) {
  return post('/system/audit-log/delete', { ids })
}

/**
 * 清空操作日志
 */
export function clearAuditLogs() {
  return post('/system/audit-log/clear')
}

/**
 * 导出操作日志
 */
export function exportAuditLogs(params: AuditQueryParams) {
  return get('/system/audit-log/export', { params, responseType: 'blob' })
}

/**
 * 创建审计日志
 */
export function createAuditLog(data: Omit<AuditLog, 'id' | 'operationTime'>) {
  return post<AuditLog>('/system/audit-log', data)
}

/**
 * 申请敏感操作
 */
export function applySensitiveOperation(data: {
  module: string;
  operation: string;
  details: any;
  reason: string;
}) {
  return post<{ id: string; approved: boolean }>('/system/sensitive-operation/apply', data)
}

/**
 * 审批敏感操作
 */
export function approveSensitiveOperation(id: string, data: {
  approved: boolean;
  comment: string;
}) {
  return post(`/system/sensitive-operation/approve/${id}`, data)
}

/**
 * 获取待我审批的敏感操作列表
 */
export function getPendingApprovalList(params?: AuditQueryParams) {
  return get<PageResult<SensitiveOperationLog>>('/system/sensitive-operation/pending', { params })
}

/**
 * 获取我的敏感操作申请列表
 */
export function getMyOperationList(params?: AuditQueryParams) {
  return get<PageResult<SensitiveOperationLog>>('/system/sensitive-operation/my', { params })
}

/**
 * 获取敏感操作详情
 */
export function getSensitiveOperationDetail(id: string) {
  return get<SensitiveOperationLog>(`/system/sensitive-operation/${id}`)
}

/**
 * 记录登录日志
 */
export function recordLoginLog(data: {
  status: 'success' | 'fail';
  ipAddress: string;
  userAgent: string;
  username: string;
  errorMsg?: string;
}) {
  return post('/system/login-log', data)
}

/**
 * 获取登录日志列表
 */
export function getLoginLogList(params: AuditQueryParams) {
  return get<PageResult<AuditLog>>('/system/login-log/list', { params })
}

/**
 * 导出登录日志
 */
export function exportLoginLogs(params: AuditQueryParams) {
  return get('/system/login-log/export', { params, responseType: 'blob' })
}

// 模拟数据 - 仅在开发环境中使用
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    username: 'admin',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    module: '用户管理',
    operation: '新增用户',
    method: 'com.example.controller.UserController.createUser',
    requestUrl: '/api/system/user',
    requestMethod: 'POST',
    requestParams: '{"username":"test1","name":"测试用户","email":"test@example.com"}',
    responseData: '{"id":"123","username":"test1"}',
    status: 'success',
    operationTime: '2023-07-15 10:30:45',
    duration: 125
  },
  {
    id: '2',
    userId: '1',
    username: 'admin',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    module: '合同管理',
    operation: '删除合同',
    method: 'com.example.controller.ContractController.deleteContract',
    requestUrl: '/api/contract/123',
    requestMethod: 'DELETE',
    status: 'success',
    operationTime: '2023-07-15 11:20:18',
    duration: 86
  },
  {
    id: '3',
    userId: '2',
    username: 'manager',
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    module: '角色管理',
    operation: '更新角色',
    method: 'com.example.controller.RoleController.updateRole',
    requestUrl: '/api/system/role/2',
    requestMethod: 'PUT',
    requestParams: '{"name":"合同管理员","permissions":[1,2,3,4]}',
    status: 'fail',
    errorMsg: '权限不足',
    operationTime: '2023-07-16 09:15:30',
    duration: 56
  }
]; 