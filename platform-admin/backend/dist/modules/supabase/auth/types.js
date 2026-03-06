"use strict";
/**
 * Supabase Auth 模块类型定义
 * 与官方 Supabase Auth API 完全兼容
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_ACTIONS = exports.USER_ROLES = void 0;
// 常量
exports.USER_ROLES = {
    authenticated: 'authenticated',
    service: 'service_role',
    anon: 'anon',
    admin: 'admin'
};
exports.AUTH_ACTIONS = {
    CREATE_USER: 'user.create',
    UPDATE_USER: 'user.update',
    DELETE_USER: 'user.delete',
    BAN_USER: 'user.ban',
    UNBAN_USER: 'user.unban',
    INVITE_USER: 'user.invite',
    RESET_PASSWORD: 'user.reset_password',
    SIGN_IN: 'user.sign_in',
    SIGN_OUT: 'user.sign_out',
    REFRESH_TOKEN: 'token.refresh',
    VERIFY_TOKEN: 'token.verify'
};
//# sourceMappingURL=types.js.map