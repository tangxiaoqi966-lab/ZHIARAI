/**
 * Supabase Auth 模块类型定义
 * 与官方 Supabase Auth API 完全兼容
 */
export interface AuthUserAttributes {
    email?: string;
    phone?: string;
    password?: string;
    email_confirm?: boolean;
    phone_confirm?: boolean;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
    role?: string;
    ban_duration?: string;
    confirmation_token?: string;
    recovery_token?: string;
    email_change_token?: string;
    phone_change_token?: string;
    reauthentication_token?: string;
}
export interface AuthUser {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string | null;
    invited_at: string | null;
    confirmation_sent_at: string | null;
    recovery_sent_at: string | null;
    last_sign_in_at: string | null;
    raw_app_meta_data: Record<string, any>;
    raw_user_meta_data: Record<string, any>;
    is_super_admin: boolean;
    created_at: string;
    updated_at: string;
    phone: string | null;
    phone_confirmed_at: string | null;
    confirmed_at: string | null;
    email_change_confirm_status: number;
    banned_until: string | null;
    reauthentication_sent_at: string | null;
    is_sso_user: boolean;
    deleted_at: string | null;
    is_anonymous: boolean;
    instance_id: string | null;
}
export interface CreateUserRequest {
    email: string;
    password?: string;
    phone?: string;
    email_confirm?: boolean;
    phone_confirm?: boolean;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
    role?: string;
    ban_duration?: string;
}
export interface UpdateUserRequest {
    email?: string;
    password?: string;
    phone?: string;
    email_confirm?: boolean;
    phone_confirm?: boolean;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
    role?: string;
    ban_duration?: string;
    confirmation_token?: string;
    recovery_token?: string;
    email_change_token?: string;
    phone_change_token?: string;
    reauthentication_token?: string;
}
export interface ListUsersParams {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    filter?: string;
}
export interface ListUsersResponse {
    users: AuthUser[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
export interface Session {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
    user: AuthUser;
}
export interface AuthResponse {
    user: AuthUser | null;
    session: Session | null;
    error?: {
        message: string;
        status: number;
    };
}
export interface AdminUserOperation {
    action: 'create' | 'update' | 'delete' | 'ban' | 'unban' | 'invite' | 'reset_password';
    user_id: string;
    admin_id: string;
    timestamp: string;
    ip_address: string;
    user_agent: string;
    details: Record<string, any>;
}
export interface AuthWebhookEvent {
    type: 'user.created' | 'user.updated' | 'user.deleted' | 'user.signed_in' | 'user.signed_out' | 'user.banned' | 'user.unbanned';
    user: AuthUser;
    timestamp: string;
}
export interface JWTConfig {
    secret: string;
    expiry: number;
    issuer: string;
    audience: string;
}
export interface IdentityProvider {
    provider: 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'facebook' | 'twitter' | 'apple';
    client_id: string;
    client_secret: string;
    enabled: boolean;
    scopes: string[];
}
export interface ProjectAuthConfig {
    project_id: string;
    jwt_config: JWTConfig;
    password_min_length: number;
    password_require_special: boolean;
    password_require_numbers: boolean;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    rate_limit_enabled: boolean;
    rate_limit_requests: number;
    rate_limit_period: number;
    mfa_enabled: boolean;
    mfa_max_enrolled_factors: number;
    session_timeout: number;
    refresh_token_rotation_enabled: boolean;
    identity_providers: IdentityProvider[];
    allow_anonymous_signup: boolean;
    allow_email_signup: boolean;
    allow_phone_signup: boolean;
    require_confirmation: boolean;
    mailer_enabled: boolean;
    sms_enabled: boolean;
    hooks_enabled: boolean;
    hooks_url: string;
    hooks_secret: string;
}
export interface AuthError {
    code: string;
    message: string;
    status: number;
    details?: any;
}
export declare const USER_ROLES: {
    readonly authenticated: "authenticated";
    readonly service: "service_role";
    readonly anon: "anon";
    readonly admin: "admin";
};
export declare const AUTH_ACTIONS: {
    readonly CREATE_USER: "user.create";
    readonly UPDATE_USER: "user.update";
    readonly DELETE_USER: "user.delete";
    readonly BAN_USER: "user.ban";
    readonly UNBAN_USER: "user.unban";
    readonly INVITE_USER: "user.invite";
    readonly RESET_PASSWORD: "user.reset_password";
    readonly SIGN_IN: "user.sign_in";
    readonly SIGN_OUT: "user.sign_out";
    readonly REFRESH_TOKEN: "token.refresh";
    readonly VERIFY_TOKEN: "token.verify";
};
//# sourceMappingURL=types.d.ts.map