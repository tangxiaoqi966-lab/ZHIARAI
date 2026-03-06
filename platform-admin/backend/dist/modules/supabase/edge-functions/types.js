"use strict";
/**
 * Supabase Edge Functions 类型定义
 * 提供与官方 Supabase Edge Functions API 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDGE_FUNCTIONS_ERRORS = void 0;
// 错误定义
exports.EDGE_FUNCTIONS_ERRORS = {
    FUNCTION_NOT_FOUND: { code: 'FUNCTION_NOT_FOUND', message: 'Edge Function 不存在', status: 404 },
    FUNCTION_ALREADY_EXISTS: { code: 'FUNCTION_ALREADY_EXISTS', message: 'Edge Function 已存在', status: 409 },
    FUNCTION_VALIDATION_FAILED: { code: 'FUNCTION_VALIDATION_FAILED', message: 'Edge Function 验证失败', status: 400 },
    FUNCTION_DEPLOYMENT_FAILED: { code: 'FUNCTION_DEPLOYMENT_FAILED', message: 'Edge Function 部署失败', status: 500 },
    FUNCTION_INSUFFICIENT_PERMISSIONS: { code: 'FUNCTION_INSUFFICIENT_PERMISSIONS', message: '权限不足', status: 403 },
    FUNCTION_INACTIVE: { code: 'FUNCTION_INACTIVE', message: 'Edge Function 已被禁用', status: 400 },
    FUNCTION_RUNTIME_NOT_SUPPORTED: { code: 'FUNCTION_RUNTIME_NOT_SUPPORTED', message: '不支持的运行时', status: 400 },
    FUNCTION_MEMORY_LIMIT_EXCEEDED: { code: 'FUNCTION_MEMORY_LIMIT_EXCEEDED', message: '内存限制超出', status: 400 },
    FUNCTION_TIMEOUT_EXCEEDED: { code: 'FUNCTION_TIMEOUT_EXCEEDED', message: '执行超时', status: 400 },
};
//# sourceMappingURL=types.js.map