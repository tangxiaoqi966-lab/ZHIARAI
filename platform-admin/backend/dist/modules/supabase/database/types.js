"use strict";
/**
 * Supabase Database 模块类型定义
 * 与官方 Supabase Database API 完全兼容
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_ERRORS = void 0;
// 常量
exports.DATABASE_ERRORS = {
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
};
//# sourceMappingURL=types.js.map