/**
 * Supabase API Keys 模块类型定义
 * 与官方 Supabase API Keys 完全兼容
 */
export type ApiKeyType = 'anon' | 'service_role' | 'supabase_key';
export interface ApiKeyPermissions {
    read?: boolean;
    write?: boolean;
    delete?: boolean;
    admin?: boolean;
    [key: string]: any;
}
export interface ApiKey {
    id: string;
    project_id: string;
    name: string;
    key: string;
    key_type: ApiKeyType;
    permissions: ApiKeyPermissions[];
    created_at: string;
    updated_at: string;
    expires_at: string | null;
    last_used_at: string | null;
    is_active: boolean;
    description: string | null;
}
export interface CreateApiKeyRequest {
    name: string;
    key_type: ApiKeyType;
    permissions?: ApiKeyPermissions[];
    expires_at?: string;
    description?: string;
}
export interface UpdateApiKeyRequest {
    name?: string;
    permissions?: ApiKeyPermissions[];
    expires_at?: string | null;
    is_active?: boolean;
    description?: string;
}
export interface ListApiKeysParams {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    filter?: string;
    key_type?: ApiKeyType;
    is_active?: boolean;
}
export interface ListApiKeysResponse {
    api_keys: ApiKey[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
export interface RotateApiKeyRequest {
    keep_old_key?: boolean;
    invalidate_old_key?: boolean;
    new_key_name?: string;
}
export interface RotateApiKeyResponse {
    old_key: ApiKey | null;
    new_key: ApiKey;
    rotation_date: string;
}
export interface ValidateApiKeyRequest {
    key: string;
    required_permissions?: string[];
    project_ref?: string;
}
export interface ValidateApiKeyResponse {
    valid: boolean;
    api_key: ApiKey | null;
    has_permission: boolean;
    missing_permissions: string[];
    message?: string;
}
export interface ApiKeyError {
    code: string;
    message: string;
    status: number;
    details?: any;
}
export interface ApiKeyAuditLog {
    id: string;
    project_id: string;
    api_key_id: string;
    action: string;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    performed_by: string;
    performed_at: string;
    ip_address: string;
    user_agent: string;
}
export declare const API_KEY_TYPES: {
    readonly ANON: ApiKeyType;
    readonly SERVICE_ROLE: ApiKeyType;
    readonly SUPABASE_KEY: ApiKeyType;
};
export declare const API_KEY_ACTIONS: {
    readonly CREATE: "api_key.create";
    readonly READ: "api_key.read";
    readonly UPDATE: "api_key.update";
    readonly DELETE: "api_key.delete";
    readonly ROTATE: "api_key.rotate";
    readonly VALIDATE: "api_key.validate";
    readonly REVOKE: "api_key.revoke";
    readonly ENABLE: "api_key.enable";
    readonly DISABLE: "api_key.disable";
};
export declare const API_KEY_ERRORS: {
    readonly NOT_FOUND: {
        readonly code: "API_KEY_NOT_FOUND";
        readonly message: "API密钥不存在";
        readonly status: 404;
    };
    readonly ALREADY_EXISTS: {
        readonly code: "API_KEY_ALREADY_EXISTS";
        readonly message: "API密钥已存在";
        readonly status: 409;
    };
    readonly INVALID_TYPE: {
        readonly code: "INVALID_API_KEY_TYPE";
        readonly message: "无效的API密钥类型";
        readonly status: 400;
    };
    readonly EXPIRED: {
        readonly code: "API_KEY_EXPIRED";
        readonly message: "API密钥已过期";
        readonly status: 401;
    };
    readonly INACTIVE: {
        readonly code: "API_KEY_INACTIVE";
        readonly message: "API密钥已禁用";
        readonly status: 403;
    };
    readonly INVALID_PERMISSIONS: {
        readonly code: "INVALID_PERMISSIONS";
        readonly message: "权限不足";
        readonly status: 403;
    };
    readonly VALIDATION_FAILED: {
        readonly code: "API_KEY_VALIDATION_FAILED";
        readonly message: "API密钥验证失败";
        readonly status: 401;
    };
    readonly PROJECT_NOT_FOUND: {
        readonly code: "PROJECT_NOT_FOUND";
        readonly message: "项目不存在";
        readonly status: 404;
    };
    readonly UNAUTHORIZED: {
        readonly code: "UNAUTHORIZED";
        readonly message: "未授权操作";
        readonly status: 403;
    };
};
export declare const DEFAULT_PERMISSIONS: Record<ApiKeyType, ApiKeyPermissions[]>;
export interface ApiKeyJWTConfig {
    secret: string;
    expiry: number;
    issuer: string;
    algorithm: string;
}
export interface ApiKeyWebhookEvent {
    type: 'api_key.created' | 'api_key.updated' | 'api_key.deleted' | 'api_key.rotated' | 'api_key.revoked' | 'api_key.enabled' | 'api_key.disabled';
    api_key: ApiKey;
    timestamp: string;
    performed_by: string;
}
//# sourceMappingURL=types.d.ts.map