/**
 * Supabase Edge Functions 类型定义
 * 提供与官方 Supabase Edge Functions API 完全兼容的接口
 */

// Edge Function 定义
export interface EdgeFunction {
  id: string
  name: string
  slug: string
  version: string
  status: 'ACTIVE' | 'INACTIVE' | 'DEPLOYING' | 'FAILED'
  runtime: 'nodejs' | 'deno' | 'python' | 'go'
  entrypoint: string
  memory_mb: number
  timeout_seconds: number
  environment_variables: Record<string, string>
  secrets: Record<string, string>
  regions: string[]
  created_at: string
  updated_at: string
  deployed_at: string | null
  deployed_by: string
  project_ref: string
}

// 创建 Edge Function 请求
export interface CreateEdgeFunctionRequest {
  name: string
  slug?: string
  runtime: 'nodejs' | 'deno' | 'python' | 'go'
  entrypoint: string
  code: string
  memory_mb?: number
  timeout_seconds?: number
  environment_variables?: Record<string, string>
  secrets?: Record<string, string>
  regions?: string[]
}

// 更新 Edge Function 请求
export interface UpdateEdgeFunctionRequest {
  name?: string
  code?: string
  runtime?: 'nodejs' | 'deno' | 'python' | 'go'
  entrypoint?: string
  memory_mb?: number
  timeout_seconds?: number
  environment_variables?: Record<string, string>
  secrets?: Record<string, string>
  regions?: string[]
}

// 部署 Edge Function 请求
export interface DeployEdgeFunctionRequest {
  code?: string
  environment_variables?: Record<string, string>
  secrets?: Record<string, string>
  regions?: string[]
}

// 列出 Edge Functions 参数
export interface ListEdgeFunctionsParams {
  status?: string
  runtime?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// 批量操作请求
export interface BatchEdgeFunctionOperationRequest {
  operations: EdgeFunctionOperation[]
  atomic?: boolean
}

// Edge Function 操作类型
export interface EdgeFunctionOperation {
  type: 'create' | 'update' | 'delete' | 'deploy' | 'activate' | 'deactivate'
  function_id?: string
  function?: CreateEdgeFunctionRequest
  changes?: UpdateEdgeFunctionRequest
  deploy?: DeployEdgeFunctionRequest
}

// 批量操作响应
export interface BatchEdgeFunctionOperationResponse {
  results: EdgeFunctionOperationResult[]
  atomic: boolean
  success: boolean
}

// Edge Function 操作结果
export interface EdgeFunctionOperationResult {
  function_id: string
  success: boolean
  error?: string
  function?: EdgeFunction
}

// Edge Function 统计信息
export interface EdgeFunctionStats {
  total_functions: number
  active_functions: number
  inactive_functions: number
  deploying_functions: number
  failed_functions: number
  functions_by_runtime: Record<string, number>
  functions_by_region: Record<string, number>
  total_invocations: number
  average_execution_time_ms: number
  total_memory_mb: number
}

// 调用日志
export interface EdgeFunctionInvocationLog {
  id: string
  function_id: string
  function_name: string
  timestamp: string
  duration_ms: number
  status_code: number
  request_id: string
  memory_used_mb: number
  region: string
  error?: string
  request_body?: string
  response_body?: string
}

// 错误定义
export const EDGE_FUNCTIONS_ERRORS = {
  FUNCTION_NOT_FOUND: { code: 'FUNCTION_NOT_FOUND', message: 'Edge Function 不存在', status: 404 },
  FUNCTION_ALREADY_EXISTS: { code: 'FUNCTION_ALREADY_EXISTS', message: 'Edge Function 已存在', status: 409 },
  FUNCTION_VALIDATION_FAILED: { code: 'FUNCTION_VALIDATION_FAILED', message: 'Edge Function 验证失败', status: 400 },
  FUNCTION_DEPLOYMENT_FAILED: { code: 'FUNCTION_DEPLOYMENT_FAILED', message: 'Edge Function 部署失败', status: 500 },
  FUNCTION_INSUFFICIENT_PERMISSIONS: { code: 'FUNCTION_INSUFFICIENT_PERMISSIONS', message: '权限不足', status: 403 },
  FUNCTION_INACTIVE: { code: 'FUNCTION_INACTIVE', message: 'Edge Function 已被禁用', status: 400 },
  FUNCTION_RUNTIME_NOT_SUPPORTED: { code: 'FUNCTION_RUNTIME_NOT_SUPPORTED', message: '不支持的运行时', status: 400 },
  FUNCTION_MEMORY_LIMIT_EXCEEDED: { code: 'FUNCTION_MEMORY_LIMIT_EXCEEDED', message: '内存限制超出', status: 400 },
  FUNCTION_TIMEOUT_EXCEEDED: { code: 'FUNCTION_TIMEOUT_EXCEEDED', message: '执行超时', status: 400 },
}