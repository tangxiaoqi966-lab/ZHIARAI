import axios from 'axios'
import type * as Types from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 这里可以添加认证token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error.response?.data?.error || error.message)
  }
)

// 项目管理API
export const projectApi = {
  // 获取所有项目
  getProjects: () => api.get<Project[]>('/projects'),
  
  // 获取单个项目
  getProject: (id: string) => api.get<Project>(`/projects/${id}`),
  
  // 创建项目
  createProject: (data: CreateProjectRequest) => api.post<Project>('/projects', data),
  
  // 更新项目
  updateProject: (id: string, data: UpdateProjectRequest) => api.put<Project>(`/projects/${id}`, data),
  
  // 删除项目
  deleteProject: (id: string, confirm: string = 'DELETE') => api.delete(`/projects/${id}`, { data: { confirm } }),
  
  // 生成新API Key
  generateApiKey: (id: string) => api.post<Project>(`/projects/${id}/apikey`),
}

// 迁移管理API（待实现）
export const migrationApi = {
  // 获取迁移列表
  getMigrations: (params?: { project_id?: string; schema_name?: string; limit?: number }) => 
    api.get<Migration[]>('/migrations', { params }),
  
  // 创建迁移
  createMigration: (data: CreateMigrationRequest) => api.post<Migration>('/migrations', data),
  
  // 执行迁移
  executeMigration: (id: number) => api.post(`/migrations/${id}/execute`),
  
  // 回滚迁移
  rollbackMigration: (id: number) => api.post(`/migrations/${id}/rollback`),
  
  // 删除迁移
  deleteMigration: (id: number) => api.delete(`/migrations/${id}`),
}

// 数据库管理API
export const databaseApi = {
  // 获取项目表列表
  getTables: (projectId: string, schemaName?: string) => 
    api.get<Table[]>(`/projects/${projectId}/tables`, { params: { schema_name: schemaName } }),
  
  // 获取表结构
  getTableStructure: (projectId: string, tableName: string) => 
    api.get<Table>(`/projects/${projectId}/tables/${tableName}`),
  
  // 创建表
  createTable: (projectId: string, data: CreateTableRequest) => 
    api.post<Table>(`/projects/${projectId}/tables`, data),
  
  // 更新表结构
  updateTable: (projectId: string, tableName: string, data: Partial<CreateTableRequest>) => 
    api.put<Table>(`/projects/${projectId}/tables/${tableName}`, data),
  
  // 删除表
  deleteTable: (projectId: string, tableName: string, confirm: string = 'DELETE') => 
    api.delete(`/projects/${projectId}/tables/${tableName}`, { data: { confirm } }),
  
  // 获取表数据
  getTableData: (projectId: string, tableName: string, params?: { page?: number; page_size?: number; filter?: string }) => 
    api.get<any[]>(`/projects/${projectId}/tables/${tableName}/data`, { params }),
  
  // 执行SQL查询
  executeSQL: (projectId: string, sql: string) => 
    api.post<any>(`/projects/${projectId}/sql`, { sql }),
  
  // 获取SQL历史
  getSQLHistory: (projectId: string, limit?: number) => 
    api.get<any[]>(`/projects/${projectId}/sql/history`, { params: { limit } }),
}

// API Key管理API
export const apiKeyApi = {
  // 获取API Keys
  getApiKeys: (projectId: string) => 
    api.get<ApiKey[]>(`/projects/${projectId}/apikeys`),
  
  // 创建API Key
  createApiKey: (projectId: string, data: CreateApiKeyRequest) => 
    api.post<ApiKey>(`/projects/${projectId}/apikeys`, data),
  
  // 更新API Key
  updateApiKey: (projectId: string, keyId: string, data: Partial<ApiKey>) => 
    api.put<ApiKey>(`/projects/${projectId}/apikeys/${keyId}`, data),
  
  // 删除API Key
  deleteApiKey: (projectId: string, keyId: string) => 
    api.delete(`/projects/${projectId}/apikeys/${keyId}`),
  
  // 轮换API Key
  rotateApiKey: (projectId: string, keyId: string) => 
    api.post<ApiKey>(`/projects/${projectId}/apikeys/${keyId}/rotate`),
  
  // 禁用/启用API Key
  toggleApiKey: (projectId: string, keyId: string, isActive: boolean) => 
    api.put<ApiKey>(`/projects/${projectId}/apikeys/${keyId}/toggle`, { is_active: isActive }),
}

// 日志管理API
export const logApi = {
  // 获取日志
  getLogs: (projectId: string, params?: LogQuery) => 
    api.get<Log[]>(`/projects/${projectId}/logs`, { params }),
  
  // 导出日志
  exportLogs: (projectId: string, params?: LogQuery) => 
    api.get(`/projects/${projectId}/logs/export`, { params, responseType: 'blob' }),
  
  // 清空日志
  clearLogs: (projectId: string, confirm: string = 'CLEAR') => 
    api.delete(`/projects/${projectId}/logs`, { data: { confirm } }),
}

// 系统API
export const systemApi = {
  // 健康检查
  healthCheck: () => api.get('/health'),
  
  // 获取系统设置
  getSettings: () => api.get<SystemSettings>('/settings'),
  
  // 更新系统设置
  updateSettings: (data: Partial<SystemSettings>) => api.put<SystemSettings>('/settings', data),
  
  // 测试数据库连接
  testDatabaseConnection: (config: any) => api.post('/settings/database/test', config),
  
  // 测试SMTP连接
  testSMTPConnection: (config: any) => api.post('/settings/smtp/test', config),
  
  // 获取系统统计
  getSystemStats: () => api.get<SystemStats>('/stats'),
}

// 管理员管理API
export const adminApi = {
  // 获取管理员列表
  getAdmins: () => api.get<AdminUser[]>('/admins'),
  
  // 创建管理员
  createAdmin: (data: CreateAdminRequest) => api.post<AdminUser>('/admins', data),
  
  // 更新管理员
  updateAdmin: (id: string, data: UpdateAdminRequest) => api.put<AdminUser>(`/admins/${id}`, data),
  
  // 删除管理员
  deleteAdmin: (id: string, confirm: string = 'DELETE') => api.delete(`/admins/${id}`, { data: { confirm } }),
  
  // 禁用/启用管理员
  toggleAdmin: (id: string, isActive: boolean) => api.put<AdminUser>(`/admins/${id}/toggle`, { is_active: isActive }),
}

export default api