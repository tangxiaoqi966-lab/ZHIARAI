"use strict";
/**
 * Supabase API Keys 模块类型定义
 * 与官方 Supabase API Keys 完全兼容
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PERMISSIONS = exports.API_KEY_ERRORS = exports.API_KEY_ACTIONS = exports.API_KEY_TYPES = void 0;
// 常量
exports.API_KEY_TYPES = {
    ANON: 'anon',
    SERVICE_ROLE: 'service_role',
    SUPABASE_KEY: 'supabase_key'
};
exports.API_KEY_ACTIONS = {
    CREATE: 'api_key.create',
    READ: 'api_key.read',
    UPDATE: 'api_key.update',
    DELETE: 'api_key.delete',
    ROTATE: 'api_key.rotate',
    VALIDATE: 'api_key.validate',
    REVOKE: 'api_key.revoke',
    ENABLE: 'api_key.enable',
    DISABLE: 'api_key.disable'
};
exports.API_KEY_ERRORS = {
    NOT_FOUND: { code: 'API_KEY_NOT_FOUND', message: 'API密钥不存在', status: 404 },
    ALREADY_EXISTS: { code: 'API_KEY_ALREADY_EXISTS', message: 'API密钥已存在', status: 409 },
    INVALID_TYPE: { code: 'INVALID_API_KEY_TYPE', message: '无效的API密钥类型', status: 400 },
    EXPIRED: { code: 'API_KEY_EXPIRED', message: 'API密钥已过期', status: 401 },
    INACTIVE: { code: 'API_KEY_INACTIVE', message: 'API密钥已禁用', status: 403 },
    INVALID_PERMISSIONS: { code: 'INVALID_PERMISSIONS', message: '权限不足', status: 403 },
    VALIDATION_FAILED: { code: 'API_KEY_VALIDATION_FAILED', message: 'API密钥验证失败', status: 401 },
    PROJECT_NOT_FOUND: { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 },
    UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '未授权操作', status: 403 }
};
// 默认权限配置
exports.DEFAULT_PERMISSIONS = {
    anon: [
        { read: true, write: false, delete: false, admin: false }
    ],
    service_role: [
        { read: true, write: true, delete: true, admin: true }
    ],
    supabase_key: [
        { read: true, write: true, delete: false, admin: false }
    ]
};
//# sourceMappingURL=types.js.map