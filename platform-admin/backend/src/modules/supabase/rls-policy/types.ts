/**
 * Supabase RLS Policy 类型定义
 * 提供与官方 Supabase RLS Policy API 完全兼容的接口
 */

// RLS 策略定义
export interface RLSPolicy {
  id: string
  name: string
  schema: string
  table: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  definition: string
  check: string | null
  using: string | null
  with_check: string | null
  roles: string[]
  enabled: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

// 创建策略请求
export interface CreatePolicyRequest {
  name: string
  schema?: string
  table: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  definition: string
  check?: string
  using?: string
  with_check?: string
  roles?: string[]
  enabled?: boolean
}

// 更新策略请求
export interface UpdatePolicyRequest {
  name?: string
  definition?: string
  check?: string
  using?: string
  with_check?: string
  roles?: string[]
  enabled?: boolean
}

// 列出策略参数
export interface ListPoliciesParams {
  schema?: string
  table?: string
  command?: string
  enabled?: boolean
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 批量操作请求
export interface BatchPolicyOperationRequest {
  operations: PolicyOperation[]
  atomic?: boolean
}

// 策略操作类型
export interface PolicyOperation {
  type: 'create' | 'update' | 'delete' | 'enable' | 'disable'
  policy_id?: string
  policy?: CreatePolicyRequest
  changes?: UpdatePolicyRequest
}

// 批量操作响应
export interface BatchPolicyOperationResponse {
  results: PolicyOperationResult[]
  atomic: boolean
  success: boolean
}

// 策略操作结果
export interface PolicyOperationResult {
  policy_id: string
  success: boolean
  error?: string
  policy?: RLSPolicy
}

// 策略统计信息
export interface PolicyStats {
  total_policies: number
  enabled_policies: number
  disabled_policies: number
  policies_by_command: Record<string, number>
  policies_by_schema: Record<string, number>
  policies_by_table: Record<string, number>
}

// 错误定义
export const RLS_ERRORS = {
  POLICY_NOT_FOUND: { code: 'POLICY_NOT_FOUND', message: '策略不存在', status: 404 },
  POLICY_ALREADY_EXISTS: { code: 'POLICY_ALREADY_EXISTS', message: '策略已存在', status: 409 },
  POLICY_VALIDATION_FAILED: { code: 'POLICY_VALIDATION_FAILED', message: '策略验证失败', status: 400 },
  POLICY_SYNTAX_ERROR: { code: 'POLICY_SYNTAX_ERROR', message: '策略语法错误', status: 400 },
  POLICY_INSUFFICIENT_PERMISSIONS: { code: 'POLICY_INSUFFICIENT_PERMISSIONS', message: '权限不足', status: 403 },
  POLICY_DISABLED: { code: 'POLICY_DISABLED', message: '策略已被禁用', status: 400 },
}