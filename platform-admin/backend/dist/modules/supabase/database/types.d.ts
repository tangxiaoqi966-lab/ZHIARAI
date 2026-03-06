/**
 * Supabase Database 模块类型定义
 * 与官方 Supabase Database API 完全兼容
 */
export interface TableSchema {
    name: string;
    schema: string;
    columns: ColumnDefinition[];
    primary_key?: string[];
    foreign_keys?: ForeignKeyDefinition[];
    indexes?: IndexDefinition[];
    rls_enabled?: boolean;
    rls_policies?: RLSPolicy[];
}
export interface ColumnDefinition {
    name: string;
    type: string;
    nullable?: boolean;
    default?: any;
    primary_key?: boolean;
    unique?: boolean;
    foreign_key?: ForeignKeyReference;
    check?: string;
    comment?: string;
}
export interface ForeignKeyReference {
    table: string;
    column: string;
    on_delete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    on_update?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}
export interface ForeignKeyDefinition {
    name: string;
    columns: string[];
    foreign_table: string;
    foreign_columns: string[];
    on_delete?: string;
    on_update?: string;
}
export interface IndexDefinition {
    name: string;
    columns: string[];
    unique?: boolean;
    method?: 'btree' | 'hash' | 'gist' | 'gin' | 'spgist' | 'brin';
    where?: string;
}
export interface RLSPolicy {
    name: string;
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    roles: string[];
    using?: string;
    with_check?: string;
}
export interface QueryParams {
    select?: string;
    where?: Record<string, any>;
    order?: Record<string, 'asc' | 'desc'>;
    limit?: number;
    offset?: number;
    range?: [number, number];
}
export interface SQLQueryRequest {
    query: string;
    params?: any[];
    timeout?: number;
    read_only?: boolean;
}
export interface SQLQueryResponse {
    data: any[];
    columns: string[];
    count: number;
    affected_rows?: number;
    execution_time: number;
    query: string;
}
export interface TableOperationResponse {
    success: boolean;
    message: string;
    table?: TableSchema;
    error?: string;
}
export interface DataOperationResponse {
    success: boolean;
    data?: any[];
    count?: number;
    affected_rows?: number;
    error?: string;
}
export interface BatchOperationRequest {
    operations: Array<{
        type: 'insert' | 'update' | 'delete' | 'select' | 'sql';
        table?: string;
        data?: any;
        where?: Record<string, any>;
        query?: string;
        params?: any[];
    }>;
    atomic?: boolean;
}
export interface BatchOperationResponse {
    results: Array<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    atomic: boolean;
    success: boolean;
}
export interface DatabaseConnection {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    pool_size?: number;
    timeout?: number;
}
export interface DatabaseStats {
    total_tables: number;
    total_rows: number;
    total_size: string;
    active_connections: number;
    max_connections: number;
    cache_hit_ratio: number;
    uptime: number;
    last_vacuum?: string;
    last_analyze?: string;
}
export interface DatabaseError {
    code: string;
    message: string;
    status: number;
    details?: any;
    hint?: string;
}
export declare const DATABASE_ERRORS: {
    readonly CONNECTION_FAILED: {
        readonly code: "CONNECTION_FAILED";
        readonly message: "数据库连接失败";
        readonly status: 500;
    };
    readonly QUERY_FAILED: {
        readonly code: "QUERY_FAILED";
        readonly message: "查询执行失败";
        readonly status: 500;
    };
    readonly TABLE_NOT_FOUND: {
        readonly code: "TABLE_NOT_FOUND";
        readonly message: "表不存在";
        readonly status: 404;
    };
    readonly COLUMN_NOT_FOUND: {
        readonly code: "COLUMN_NOT_FOUND";
        readonly message: "列不存在";
        readonly status: 404;
    };
    readonly INVALID_SCHEMA: {
        readonly code: "INVALID_SCHEMA";
        readonly message: "无效的表结构";
        readonly status: 400;
    };
    readonly PERMISSION_DENIED: {
        readonly code: "PERMISSION_DENIED";
        readonly message: "权限不足";
        readonly status: 403;
    };
    readonly TIMEOUT: {
        readonly code: "TIMEOUT";
        readonly message: "查询超时";
        readonly status: 408;
    };
    readonly CONSTRAINT_VIOLATION: {
        readonly code: "CONSTRAINT_VIOLATION";
        readonly message: "约束违反";
        readonly status: 400;
    };
    readonly DUPLICATE_TABLE: {
        readonly code: "DUPLICATE_TABLE";
        readonly message: "表已存在";
        readonly status: 409;
    };
    readonly DUPLICATE_COLUMN: {
        readonly code: "DUPLICATE_COLUMN";
        readonly message: "列已存在";
        readonly status: 409;
    };
};
export type SQLDialect = 'postgresql' | 'mysql' | 'sqlite';
export interface MigrationOperation {
    id: string;
    name: string;
    sql: string;
    rollback_sql?: string;
    applied_at?: string;
    applied_by?: string;
}
export interface DatabaseBackup {
    id: string;
    name: string;
    size: number;
    created_at: string;
    expires_at?: string;
    status: 'pending' | 'completed' | 'failed';
    download_url?: string;
}
//# sourceMappingURL=types.d.ts.map