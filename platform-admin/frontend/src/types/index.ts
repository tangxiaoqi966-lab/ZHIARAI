// 项目相关类型
export interface Project {
  id: string
  name: string
  schema_name: string
  api_key: string
  created_at: string
  updated_at: string
  is_active: boolean
  migration_count?: number
  last_migration_at?: string
  description?: string
  database_name?: string
  template?: string
}

export interface CreateProjectRequest {
  name: string
  schema_name?: string
  description?: string
  database_name?: string
  template?: string
}

export interface UpdateProjectRequest {
  name?: string
  is_active?: boolean
  api_key?: string
  description?: string
}

// 迁移相关类型
export interface Migration {
  id: number
  project_id: string
  schema_name: string
  migration_sql: string
  executed_at: string
  version?: string
  description?: string
  project_name?: string
  status?: 'pending' | 'completed' | 'failed'
}

export interface CreateMigrationRequest {
  project_id: string
  migration_sql: string
  description?: string
  version?: string
}

// API Key 相关类型
export interface ApiKey {
  id: string
  name: string
  key: string
  project_id: string
  permissions: string[]
  created_at: string
  expires_at?: string
  is_active: boolean
  last_used_at?: string
}

export interface CreateApiKeyRequest {
  name: string
  permissions: string[]
  expires_in_days?: number
}

// 数据库表相关类型
export interface Table {
  name: string
  schema: string
  columns: Column[]
  indexes: Index[]
  row_count?: number
  size_bytes?: number
  created_at?: string
}

export interface Column {
  name: string
  type: string
  is_nullable: boolean
  is_primary_key: boolean
  default_value?: string
  description?: string
}

export interface Index {
  name: string
  columns: string[]
  is_unique: boolean
  type: string
}

export interface CreateTableRequest {
  name: string
  columns: ColumnDefinition[]
  indexes?: IndexDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  is_nullable?: boolean
  is_primary_key?: boolean
  default_value?: string
  description?: string
}

export interface IndexDefinition {
  name: string
  columns: string[]
  is_unique?: boolean
  type?: string
}

// 日志相关类型
export interface Log {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  user_id?: string
  user_name?: string
  project_id?: string
  action: string
  details?: any
  ip_address?: string
}

export interface LogQuery {
  level?: string[]
  project_id?: string
  user_id?: string
  action?: string
  start_date?: string
  end_date?: string
  search?: string
}

// 系统设置相关类型
export interface SystemSettings {
  database: {
    host: string
    port: number
    name: string
    user: string
    max_connections: number
    idle_timeout: number
  }
  smtp: {
    host: string
    port: number
    username: string
    password: string
    from_email: string
    enabled: boolean
  }
  backup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    retention_days: number
    storage_path: string
  }
  storage: {
    type: 'local' | 's3'
    local_path: string
    s3_bucket?: string
    s3_region?: string
    s3_access_key?: string
    s3_secret_key?: string
  }
  api: {
    rate_limit: number
    timeout: number
    cors_origins: string[]
  }
}

// 管理员相关类型
export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'
  is_active: boolean
  created_at: string
  last_login_at?: string
  avatar_url?: string
}

export interface CreateAdminRequest {
  username: string
  email: string
  password: string
  role: string
}

export interface UpdateAdminRequest {
  username?: string
  email?: string
  password?: string
  role?: string
  is_active?: boolean
}

// 系统统计类型
export interface SystemStats {
  total_projects: number
  total_databases: number
  total_api_calls: number
  total_migrations: number
  active_projects: number
  system_load: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }
  recent_projects: Project[]
  recent_migrations: Migration[]
}

// 通用API响应类型
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}