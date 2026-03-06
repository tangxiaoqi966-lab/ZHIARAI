/**
 * Supabase Database 模块类型定义
 * 与官方 Supabase Database API 完全兼容
 */

// 表结构定义
export interface TableSchema {
  name: string
  schema: string
  columns: ColumnDefinition[]
  primary_key?: string[]
  foreign_keys?: ForeignKeyDefinition[]
  indexes?: IndexDefinition[]
  rls_enabled?: boolean
  rls_policies?: RLSPolicy[]
}

// 列定义
export interface ColumnDefinition {
  name: string
  type: string
  nullable?: boolean
  default?: any
  primary_key?: boolean
  unique?: boolean
  foreign_key?: ForeignKeyReference
  check?: string
  comment?: string
}

// 外键引用
export interface ForeignKeyReference {
  table: string
  column: string
  on_delete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  on_update?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

// 外键定义
export interface ForeignKeyDefinition {
  name: string
  columns: string[]
  foreign_table: string
  foreign_columns: string[]
  on_delete?: string
  on_update?: string
}

// 索引定义
export interface IndexDefinition {
  name: string
  columns: string[]
  unique?: boolean
  method?: 'btree' | 'hash' | 'gist' | 'gin' | 'spgist' | 'brin'
  where?: string
}

// RLS 策略
export interface RLSPolicy {
  name: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: string[]
  using?: string
  with_check?: string
}

// 查询参数
export interface QueryParams {
  select?: string
  where?: Record<string, any>
  order?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
  range?: [number, number]
}

// SQL 查询请求
export interface SQLQueryRequest {
  query: string
  params?: any[]
  timeout?: number
  read_only?: boolean
}

// SQL 查询响应
export interface SQLQueryResponse {
  data: any[]
  columns: string[]
  count: number
  affected_rows?: number
  execution_time: number
  query: string
}

// 表操作响应
export interface TableOperationResponse {
  success: boolean
  message: string
  table?: TableSchema
  error?: string
}

// 数据操作响应
export interface DataOperationResponse {
  success: boolean
  data?: any[]
  count?: number
  affected_rows?: number
  error?: string
}

// 批量操作请求
export interface BatchOperationRequest {
  operations: Array<{
    type: 'insert' | 'update' | 'delete' | 'select' | 'sql'
    table?: string
    data?: any
    where?: Record<string, any>
    query?: string
    params?: any[]
  }>
  atomic?: boolean
}

// 批量操作响应
export interface BatchOperationResponse {
  results: Array<{
    success: boolean
    data?: any
    error?: string
  }>
  atomic: boolean
  success: boolean
}

// 数据库连接信息
export interface DatabaseConnection {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
  pool_size?: number
  timeout?: number
}

// 数据库统计信息
export interface DatabaseStats {
  total_tables: number
  total_rows: number
  total_size: string
  active_connections: number
  max_connections: number
  cache_hit_ratio: number
  uptime: number
  last_vacuum?: string
  last_analyze?: string
}

// 错误类型
export interface DatabaseError {
  code: string
  message: string
  status: number
  details?: any
  hint?: string
}

// 常量
export const DATABASE_ERRORS = {
  CONNECTION_FAILED: { code: 'CONNECTION_FAILED', message: '数据库连接失败', status: 500 },
  QUERY_FAILED: { code: 'QUERY_FAILED', message: '查询执行失败', status: 500 },
  TABLE_NOT_FOUND: { code: 'TABLE_NOT_FOUND', message: '表不存在', status: 404 },
  COLUMN_NOT_FOUND: { code: 'COLUMN_NOT_FOUND', message: '列不存在', status: 404 },
  INVALID_SCHEMA: { code: 'INVALID_SCHEMA', message: '无效的表结构', status: 400 },
  PERMISSION_DENIED: { code: 'PERMISSION_DENIED', message: '权限不足', status: 403 },
  TIMEOUT: { code: 'TIMEOUT', message: '查询超时', status: 408 },
  CONSTRAINT_VIOLATION: { code: 'CONSTRAINT_VIOLATION', message: '约束违反', status: 400 },
  DUPLICATE_TABLE: { code: 'DUPLICATE_TABLE', message: '表已存在', status: 409 },
  DUPLICATE_COLUMN: { code: 'DUPLICATE_COLUMN', message: '列已存在', status: 409 }
} as const

// 支持的 SQL 方言
export type SQLDialect = 'postgresql' | 'mysql' | 'sqlite'

// 迁移操作
export interface MigrationOperation {
  id: string
  name: string
  sql: string
  rollback_sql?: string
  applied_at?: string
  applied_by?: string
}

// 数据库备份信息
export interface DatabaseBackup {
  id: string
  name: string
  size: number
  created_at: string
  expires_at?: string
  status: 'pending' | 'completed' | 'failed'
  download_url?: string
}