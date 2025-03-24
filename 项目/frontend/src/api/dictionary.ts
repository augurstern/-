import { get, post } from './index'

/**
 * 字典项接口
 */
export interface DictItem {
  id: string;
  value: string;
  label: string;
  sort: number;
  status: 'active' | 'disabled';
  cssClass?: string;
  listClass?: string;
  description?: string;
  typeId: string;
  typeCode: string;
  createTime: string;
  updateTime: string;
}

/**
 * 字典类型接口
 */
export interface DictType {
  id: string;
  typeName: string;
  typeCode: string;
  status: 'active' | 'disabled';
  description?: string;
  isSystem: boolean;
  createTime: string;
  updateTime: string;
}

/**
 * 字典类型分页数据
 */
export interface DictTypePageResult {
  items: DictType[];
  total: number;
}

/**
 * 字典项分页数据
 */
export interface DictItemPageResult {
  items: DictItem[];
  total: number;
}

/**
 * 字典查询参数
 */
export interface DictQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  [key: string]: any;
}

// 模拟数据 - 仅在开发环境使用
const mockDictTypes: DictType[] = [
  {
    id: '1',
    typeCode: 'contract_status',
    typeName: '合同状态',
    description: '合同状态字典',
    status: 'active',
    isSystem: true,
    createTime: '2023-08-01 10:00:00',
    updateTime: '2023-08-01 10:00:00',
  },
  {
    id: '2',
    typeCode: 'contract_type',
    typeName: '合同类型',
    description: '合同类型字典',
    status: 'active',
    isSystem: true,
    createTime: '2023-08-01 10:00:00',
    updateTime: '2023-08-01 10:00:00',
  },
  {
    id: '3',
    typeCode: 'approval_status',
    typeName: '审批状态',
    description: '审批状态字典',
    status: 'active',
    isSystem: true,
    createTime: '2023-08-01 10:00:00',
    updateTime: '2023-08-01 10:00:00',
  },
  {
    id: '4',
    typeCode: 'priority_level',
    typeName: '优先级',
    description: '优先级字典',
    status: 'active',
    isSystem: true,
    createTime: '2023-08-01 10:00:00',
    updateTime: '2023-08-01 10:00:00',
  }
];

// 模拟字典项数据
const mockDictItems: Record<string, DictItem[]> = {
  contract_status: [
    { id: '1', typeId: '1', typeCode: 'contract_status', label: '草稿', value: 'draft', status: 'active', sort: 1, cssClass: 'info', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '2', typeId: '1', typeCode: 'contract_status', label: '审批中', value: 'approving', status: 'active', sort: 2, cssClass: 'warning', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '3', typeId: '1', typeCode: 'contract_status', label: '生效中', value: 'active', status: 'active', sort: 3, cssClass: 'success', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '4', typeId: '1', typeCode: 'contract_status', label: '已归档', value: 'archived', status: 'active', sort: 4, cssClass: 'default', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '5', typeId: '1', typeCode: 'contract_status', label: '已终止', value: 'terminated', status: 'active', sort: 5, cssClass: 'danger', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '6', typeId: '1', typeCode: 'contract_status', label: '已完成', value: 'completed', status: 'active', sort: 6, cssClass: 'primary', createTime: '2023-08-01', updateTime: '2023-08-01' }
  ],
  contract_type: [
    { id: '7', typeId: '2', typeCode: 'contract_type', label: '销售合同', value: 'sales', status: 'active', sort: 1, createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '8', typeId: '2', typeCode: 'contract_type', label: '采购合同', value: 'purchase', status: 'active', sort: 2, createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '9', typeId: '2', typeCode: 'contract_type', label: '技术服务', value: 'service', status: 'active', sort: 3, createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '10', typeId: '2', typeCode: 'contract_type', label: '咨询服务', value: 'consulting', status: 'active', sort: 4, createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '11', typeId: '2', typeCode: 'contract_type', label: '劳务合同', value: 'labor', status: 'active', sort: 5, createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '12', typeId: '2', typeCode: 'contract_type', label: '其他合同', value: 'other', status: 'active', sort: 6, createTime: '2023-08-01', updateTime: '2023-08-01' }
  ],
  approval_status: [
    { id: '13', typeId: '3', typeCode: 'approval_status', label: '待审批', value: 'pending', status: 'active', sort: 1, cssClass: 'warning', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '14', typeId: '3', typeCode: 'approval_status', label: '已通过', value: 'approved', status: 'active', sort: 2, cssClass: 'success', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '15', typeId: '3', typeCode: 'approval_status', label: '已拒绝', value: 'rejected', status: 'active', sort: 3, cssClass: 'danger', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '16', typeId: '3', typeCode: 'approval_status', label: '已撤回', value: 'withdrawn', status: 'active', sort: 4, cssClass: 'info', createTime: '2023-08-01', updateTime: '2023-08-01' }
  ],
  priority_level: [
    { id: '17', typeId: '4', typeCode: 'priority_level', label: '低', value: 'low', status: 'active', sort: 1, cssClass: 'info', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '18', typeId: '4', typeCode: 'priority_level', label: '中', value: 'medium', status: 'active', sort: 2, cssClass: 'warning', createTime: '2023-08-01', updateTime: '2023-08-01' },
    { id: '19', typeId: '4', typeCode: 'priority_level', label: '高', value: 'high', status: 'active', sort: 3, cssClass: 'danger', createTime: '2023-08-01', updateTime: '2023-08-01' }
  ]
};

/**
 * 获取字典类型列表
 * @param params 查询参数
 * @returns 字典类型列表
 */
export function getDictTypeList(params?: DictQueryParams) {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<DictTypePageResult>((resolve) => {
      setTimeout(() => {
        const { keyword, status, page = 1, pageSize = 10 } = params || {};
        
        let result = [...mockDictTypes];
        
        // 关键词过滤
        if (keyword) {
          const kw = keyword.toLowerCase();
          result = result.filter(item => 
            item.typeName.toLowerCase().includes(kw) || 
            item.typeCode.toLowerCase().includes(kw) ||
            (item.description && item.description.toLowerCase().includes(kw))
          );
        }
        
        // 状态过滤
        if (status) {
          result = result.filter(item => item.status === status);
        }
        
        const total = result.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = result.slice(startIndex, endIndex);
        
        resolve({ items, total });
      }, 300);
    });
  }
  
  return get<DictTypePageResult>('/api/dict/types', { params })
}

/**
 * 获取所有字典类型（不分页）
 * @param params 查询参数
 * @returns 字典类型列表
 */
export function getAllDictTypes(params?: Omit<DictQueryParams, 'page' | 'pageSize'>) {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<DictType[]>((resolve) => {
      setTimeout(() => {
        const { keyword, status } = params || {};
        
        let result = [...mockDictTypes];
        
        // 关键词过滤
        if (keyword) {
          const kw = keyword.toLowerCase();
          result = result.filter(item => 
            item.typeName.toLowerCase().includes(kw) || 
            item.typeCode.toLowerCase().includes(kw) ||
            (item.description && item.description.toLowerCase().includes(kw))
          );
        }
        
        // 状态过滤
        if (status) {
          result = result.filter(item => item.status === status);
        }
        
        resolve(result);
      }, 300);
    });
  }
  
  return get<DictType[]>('/api/dict/types/all', { params })
}

/**
 * 获取字典类型详情
 * @param id 字典类型ID
 * @returns 字典类型
 */
export function getDictType(id: string) {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<DictType>((resolve, reject) => {
      setTimeout(() => {
        const type = mockDictTypes.find(item => item.id === id);
        if (type) {
          resolve(type);
        } else {
          reject(new Error('字典类型不存在'));
        }
      }, 300);
    });
  }
  
  return get<DictType>(`/api/dict/types/${id}`)
}

/**
 * 新增字典类型
 * @param data 字典类型数据
 * @returns 字典类型
 */
export function addDictType(data: Omit<DictType, 'id' | 'createTime' | 'updateTime'>) {
  return post<DictType>('/api/dict/types', data)
}

/**
 * 更新字典类型
 * @param id 字典类型ID
 * @param data 字典类型数据
 * @returns 字典类型
 */
export function updateDictType(id: string, data: Partial<Omit<DictType, 'id' | 'createTime' | 'updateTime'>>) {
  return post<DictType>(`/api/dict/types/${id}`, data)
}

/**
 * 删除字典类型
 * @param id 字典类型ID
 * @returns 删除结果
 */
export function deleteDictType(id: string) {
  return post('/api/dict/types/delete', { ids: [id] })
}

/**
 * 通过字典类型编码获取字典项列表
 * @param typeCode 字典类型编码
 * @param params 查询参数
 * @returns 字典项列表
 */
export function getDictItemsByTypeCode(typeCode: string, params?: Omit<DictQueryParams, 'page' | 'pageSize'>) {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<DictItem[]>((resolve) => {
      setTimeout(() => {
        const { status } = params || {};
        
        let result = mockDictItems[typeCode] || [];
        
        // 状态过滤
        if (status) {
          result = result.filter(item => item.status === status);
        }
        
        resolve(result);
      }, 200);
    });
  }
  
  return get<DictItem[]>(`/api/dict/items/type/${typeCode}`, { params })
}

/**
 * 通过字典类型ID获取字典项列表（分页）
 * @param typeId 字典类型ID
 * @param params 查询参数
 * @returns 字典项分页数据
 */
export function getDictItemsByTypeId(typeId: string, params?: DictQueryParams) {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<DictItemPageResult>((resolve) => {
      setTimeout(() => {
        const { keyword, status, page = 1, pageSize = 10 } = params || {};
        
        // 找到类型编码
        const dictType = mockDictTypes.find(type => type.id === typeId);
        
        if (!dictType) {
          resolve({ items: [], total: 0 });
          return;
        }
        
        let result = mockDictItems[dictType.typeCode] || [];
        
        // 关键词过滤
        if (keyword) {
          const kw = keyword.toLowerCase();
          result = result.filter(item => 
            item.label.toLowerCase().includes(kw) || 
            item.value.toLowerCase().includes(kw) ||
            (item.description && item.description.toLowerCase().includes(kw))
          );
        }
        
        // 状态过滤
        if (status) {
          result = result.filter(item => item.status === status);
        }
        
        const total = result.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = result.slice(startIndex, endIndex);
        
        resolve({ items, total });
      }, 300);
    });
  }
  
  return get<DictItemPageResult>(`/api/dict/items/typeId/${typeId}`, { params })
}

/**
 * 获取字典项详情
 * @param id 字典项ID
 * @returns 字典项
 */
export function getDictItem(id: string) {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<DictItem>((resolve, reject) => {
      setTimeout(() => {
        // 在所有字典项中查找
        for (const typeCode in mockDictItems) {
          const item = mockDictItems[typeCode].find(item => item.id === id);
          if (item) {
            resolve(item);
            return;
          }
        }
        reject(new Error('字典项不存在'));
      }, 300);
    });
  }
  
  return get<DictItem>(`/api/dict/items/${id}`)
}

/**
 * 新增字典项
 * @param data 字典项数据
 * @returns 字典项
 */
export function addDictItem(data: Omit<DictItem, 'id' | 'createTime' | 'updateTime'>) {
  return post<DictItem>('/api/dict/items', data)
}

/**
 * 更新字典项
 * @param id 字典项ID
 * @param data 字典项数据
 * @returns 字典项
 */
export function updateDictItem(id: string, data: Partial<Omit<DictItem, 'id' | 'createTime' | 'updateTime'>>) {
  return post<DictItem>(`/api/dict/items/${id}`, data)
}

/**
 * 删除字典项
 * @param id 字典项ID
 * @returns 删除结果
 */
export function deleteDictItem(id: string) {
  return post('/api/dict/items/delete', { ids: [id] })
}

/**
 * 刷新字典缓存
 * @returns 刷新结果
 */
export function refreshDictCache() {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }
  
  return post('/api/dict/refresh-cache')
}

/**
 * 导出字典类型和字典项
 * @param typeCode 字典类型编码（可选，不传则导出所有）
 * @returns 二进制文件流
 */
export function exportDict(typeCode?: string) {
  return get('/api/dict/export', { typeCode })
}

/**
 * 导入字典数据
 * @param file 文件对象
 * @param updateExisting 是否更新已存在的数据
 * @returns 导入结果
 */
export function importDict(file: File, updateExisting: boolean = false) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateExisting', updateExisting.toString())
  
  return post('/api/dict/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取字典使用情况统计
 * @returns 字典使用情况统计
 */
export function getDictUsageStats() {
  // 模拟数据 - 仅开发环境
  if (import.meta.env.DEV) {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          totalTypes: mockDictTypes.length,
          totalItems: Object.values(mockDictItems).reduce((sum, items) => sum + items.length, 0),
          activeTypes: mockDictTypes.filter(t => t.status === 'active').length,
          activeItems: Object.values(mockDictItems).reduce((sum, items) => sum + items.filter(i => i.status === 'active').length, 0),
          systemTypes: mockDictTypes.filter(t => t.isSystem).length,
          mostUsedTypes: [
            { typeCode: 'contract_status', count: 156 },
            { typeCode: 'contract_type', count: 123 },
            { typeCode: 'approval_status', count: 87 }
          ]
        });
      }, 300);
    });
  }
  
  return get('/api/dict/stats/usage')
} 