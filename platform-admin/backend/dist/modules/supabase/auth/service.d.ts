/**
 * Supabase Auth 服务
 * 提供用户管理和认证功能，与官方 Supabase Auth API 完全兼容
 */
import { AuthUser, CreateUserRequest, UpdateUserRequest, ListUsersParams, ListUsersResponse, AuthResponse } from './types';
export declare class AuthService {
    private getProjectId;
    listUsers(projectRef: string, params?: ListUsersParams): Promise<ListUsersResponse>;
    getUserById(projectRef: string, userId: string): Promise<AuthUser>;
    createUser(projectRef: string, userData: CreateUserRequest, adminId: string, ipAddress?: string, userAgent?: string): Promise<AuthUser>;
    updateUser(projectRef: string, userId: string, userData: UpdateUserRequest, adminId: string, ipAddress?: string, userAgent?: string): Promise<AuthUser>;
    deleteUser(projectRef: string, userId: string, adminId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    signIn(projectRef: string, email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse>;
    verifyToken(token: string): Promise<AuthUser | null>;
    resetPassword(projectRef: string, email: string, newPassword: string): Promise<boolean>;
    getAuthConfig(projectRef: string): Promise<any>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=service.d.ts.map