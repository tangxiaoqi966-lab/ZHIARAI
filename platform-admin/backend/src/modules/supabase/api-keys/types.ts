/**
 * Supabase API Keys 模块类型定义
 * 与官方 Supabase API Keys 完全兼容
 */

// API 密钥类型
export type ApiKeyType = 'anon' | 'service_role' | 'supabase_key'

// API 密钥权限
export interface ApiKeyPermissions {
  read?: boolean
  write?: boolean
  delete?: boolean
  admin?: boolean
  [key: string]: any
}

// API 密钥实体
export interface ApiKey {
  id: string
  project_id: string
  name: string
  key: string
  key_type: ApiKeyType
  permissions: ApiKeyPermissions[]
  created_at: string
  updated_at: string
  expires_at: string | null
  last_used_at: string | null
  is_active: boolean
  description: string | null
}

// 创建 API 密钥请求
export interface CreateApiKeyRequest {
  name: string
  key_type: ApiKeyType
  permissions?: ApiKeyPermissions[]
  expires_at?: string
  description?: string
}

// 更新 API 密钥请求
export interface UpdateApiKeyRequest {
  name?: string
  permissions?: ApiKeyPermissions[]
  expires_at?: string | null
  is_active?: boolean
  description?: string
}

// API 密钥列表查询参数
export interface ListApiKeysParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filter?: string
  key_type?: ApiKeyType
  is_active?: boolean
}

// API 密钥列表响应
export interface ListApiKeysResponse {
  api_keys: ApiKey[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// 密钥轮换请求
export interface RotateApiKeyRequest {
  keep_old_key?: boolean
  invalidate_old_key?: boolean
  new_key_name?: string
}

// 密钥轮换响应
export interface RotateApiKeyResponse {
  old_key: ApiKey | null
  new_key: ApiKey
  rotation_date: string
}

// API 密钥验证请求
export interface ValidateApiKeyRequest {
  key: string
  required_permissions?: string[]
  project_ref?: string
}

// API 密钥验证响应
export interface ValidateApiKeyResponse {
  valid: boolean
  api_key: ApiKey | null
  has_permission: boolean
  missing_permissions: string[]
  message?: string
}

// 错误类型
export interface ApiKeyError {
  code: string
  message: string
  status: number
  details?: any
}

// 审计操作类型
export interface ApiKeyAuditLog {
  id: string
  project_id: string
  api_key_id: string
  action: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  performed_by: string
  performed_at: string
  ip_address: string
  user_agent: string
}

// 常量
export const API_KEY_TYPES = {
  ANON: 'anon' as ApiKeyType,
  SERVICE_ROLE: 'service_role' as ApiKeyType,
  SUPABASE_KEY: 'supabase_key' as ApiKeyType
} as const

export const API_KEY_ACTIONS = {
  CREATE: 'api_key.create',
  READ: 'api_key.read',
  UPDATE: 'api_key.update',
  DELETE: 'api_key.delete',
  ROTATE: 'api_key.rotate',
  VALIDATE: 'api_key.validate',
  REVOKE: 'api_key.revoke',
  ENABLE: 'api_key.enable',
  DISABLE: 'api_key.disable'
} as const

export const API_KEY_ERRORS = {
  NOT_FOUND: { code: 'API_KEY_NOT_FOUND', message: 'API密钥不存在', status: 404 },
  ALREADY_EXISTS: { code: 'API_KEY_ALREADY_EXISTS', message: 'API密钥已存在', status: 409 },
  INVALID_TYPE: { code: 'INVALID_API_KEY_TYPE', message: '无效的API密钥类型', status: 400 },
  EXPIRED: { code: 'API_KEY_EXPIRED', message: 'API密钥已过期', status: 401 },
  INACTIVE: { code: 'API_KEY_INACTIVE', message: 'API密钥已禁用', status: 403 },
  INVALID_PERMISSIONS: { code: 'INVALID_PERMISSIONS', message: '权限不足', status: 403 },
  VALIDATION_FAILED: { code: 'API_KEY_VALIDATION_FAILED', message: 'API密钥验证失败', status: 401 },
  PROJECT_NOT_FOUND: { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '未授权操作', status: 403 }
} as const

// 默认权限配置
export const DEFAULT_PERMISSIONS: Record<ApiKeyType, ApiKeyPermissions[]> = {
  anon: [
    { read: true, write: false, delete: false, admin: false }
  ],
  service_role: [
    { read: true, write: true, delete: true, admin: true }
  ],
  supabase_key: [
    { read: true, write: true, delete: false, admin: false }
  ]
}

// JWT 令牌生成配置
export interface ApiKeyJWTConfig {
  secret: string
  expiry: number // 秒
  issuer: string
  algorithm: string
}

// Webhook 事件类型
export interface ApiKeyWebhookEvent {
  type: 'api_key.created' | 'api_key.updated' | 'api_key.deleted' | 'api_key.rotated' | 'api_key.revoked' | 'api_key.enabled' | 'api_key.disabled'
  api_key: ApiKey
  timestamp: string
  performed_by: string
}