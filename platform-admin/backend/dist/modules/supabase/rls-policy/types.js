"use strict";
/**
 * Supabase RLS Policy 类型定义
 * 提供与官方 Supabase RLS Policy API 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RLS_ERRORS = void 0;
// 错误定义
exports.RLS_ERRORS = {
    POLICY_NOT_FOUND: { code: 'POLICY_NOT_FOUND', message: '策略不存在', status: 404 },
    POLICY_ALREADY_EXISTS: { code: 'POLICY_ALREADY_EXISTS', message: '策略已存在', status: 409 },
    POLICY_VALIDATION_FAILED: { code: 'POLICY_VALIDATION_FAILED', message: '策略验证失败', status: 400 },
    POLICY_SYNTAX_ERROR: { code: 'POLICY_SYNTAX_ERROR', message: '策略语法错误', status: 400 },
    POLICY_INSUFFICIENT_PERMISSIONS: { code: 'POLICY_INSUFFICIENT_PERMISSIONS', message: '权限不足', status: 403 },
    POLICY_DISABLED: { code: 'POLICY_DISABLED', message: '策略已被禁用', status: 400 },
};
//# sourceMappingURL=types.js.map