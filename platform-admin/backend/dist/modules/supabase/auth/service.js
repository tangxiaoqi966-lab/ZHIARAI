"use strict";
/**
 * Supabase Auth 服务
 * 提供用户管理和认证功能，与官方 Supabase Auth API 完全兼容
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const dotenv_1 = require("dotenv");
const types_1 = require("./types");
(0, dotenv_1.config)();
// 数据库连接池
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'supabase_platform_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});
// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'supabase-jwt-secret-key-change-in-production';
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || '3600'); // 默认1小时
const JWT_ISSUER = process.env.JWT_ISSUER || 'supabase';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'authenticated';
class AuthService {
    // 获取项目ID
    async getProjectId(projectRef) {
        try {
            const result = await pool.query('SELECT project_id FROM supabase.project_metadata WHERE supabase_project_ref = $1', [projectRef]);
            return result.rows[0]?.project_id || null;
        }
        catch (error) {
            console.error('获取项目ID失败:', error);
            return null;
        }
    }
    // 列出所有用户 (管理员接口)
    async listUsers(projectRef, params = {}) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            const { page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc', filter = '' } = params;
            const offset = (page - 1) * per_page;
            let query = `
        SELECT *, COUNT(*) OVER() as total_count 
        FROM supabase.auth_users 
        WHERE instance_id = $1 AND deleted_at IS NULL
      `;
            const queryParams = [projectId];
            if (filter) {
                query += ` AND (email ILIKE $2 OR phone ILIKE $2)`;
                queryParams.push(`%${filter}%`);
            }
            query += ` ORDER BY ${sort_by} ${sort_order} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(per_page, offset);
            const result = await pool.query(query, queryParams);
            const total = parseInt(result.rows[0]?.total_count || '0');
            // 转换数据库格式到 API 格式
            const users = result.rows.map(row => ({
                id: row.id,
                aud: row.aud || 'authenticated',
                role: row.role || types_1.USER_ROLES.authenticated,
                email: row.email,
                email_confirmed_at: row.email_confirmed_at,
                invited_at: row.invited_at,
                confirmation_sent_at: row.confirmation_sent_at,
                recovery_sent_at: row.recovery_sent_at,
                last_sign_in_at: row.last_sign_in_at,
                raw_app_meta_data: row.raw_app_meta_data || {},
                raw_user_meta_data: row.raw_user_meta_data || {},
                is_super_admin: row.is_super_admin || false,
                created_at: row.created_at,
                updated_at: row.updated_at,
                phone: row.phone,
                phone_confirmed_at: row.phone_confirmed_at,
                confirmed_at: row.confirmed_at,
                email_change_confirm_status: row.email_change_confirm_status || 0,
                banned_until: row.banned_until,
                reauthentication_sent_at: row.reauthentication_sent_at,
                is_sso_user: row.is_sso_user || false,
                deleted_at: row.deleted_at,
                is_anonymous: row.is_anonymous || false,
                instance_id: row.instance_id
            }));
            return {
                users,
                total,
                page,
                per_page,
                total_pages: Math.ceil(total / per_page)
            };
        }
        catch (error) {
            console.error('列出用户失败:', error);
            throw { code: 'LIST_USERS_FAILED', message: '获取用户列表失败', status: 500, details: error };
        }
    }
    // 获取单个用户
    async getUserById(projectRef, userId) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            const result = await pool.query('SELECT * FROM supabase.auth_users WHERE id = $1 AND instance_id = $2 AND deleted_at IS NULL', [userId, projectId]);
            if (result.rows.length === 0) {
                throw { code: 'USER_NOT_FOUND', message: '用户不存在', status: 404 };
            }
            const row = result.rows[0];
            return {
                id: row.id,
                aud: row.aud || 'authenticated',
                role: row.role || types_1.USER_ROLES.authenticated,
                email: row.email,
                email_confirmed_at: row.email_confirmed_at,
                invited_at: row.invited_at,
                confirmation_sent_at: row.confirmation_sent_at,
                recovery_sent_at: row.recovery_sent_at,
                last_sign_in_at: row.last_sign_in_at,
                raw_app_meta_data: row.raw_app_meta_data || {},
                raw_user_meta_data: row.raw_user_meta_data || {},
                is_super_admin: row.is_super_admin || false,
                created_at: row.created_at,
                updated_at: row.updated_at,
                phone: row.phone,
                phone_confirmed_at: row.phone_confirmed_at,
                confirmed_at: row.confirmed_at,
                email_change_confirm_status: row.email_change_confirm_status || 0,
                banned_until: row.banned_until,
                reauthentication_sent_at: row.reauthentication_sent_at,
                is_sso_user: row.is_sso_user || false,
                deleted_at: row.deleted_at,
                is_anonymous: row.is_anonymous || false,
                instance_id: row.instance_id
            };
        }
        catch (error) {
            console.error('获取用户失败:', error);
            throw error.code ? error : { code: 'GET_USER_FAILED', message: '获取用户失败', status: 500 };
        }
    }
    // 创建用户 (管理员接口)
    async createUser(projectRef, userData, adminId, ipAddress, userAgent) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            // 检查邮箱是否已存在
            const existingUser = await client.query('SELECT id FROM supabase.auth_users WHERE email = $1 AND instance_id = $2 AND deleted_at IS NULL', [userData.email, projectId]);
            if (existingUser.rows.length > 0) {
                throw { code: 'USER_ALREADY_EXISTS', message: '用户已存在', status: 409 };
            }
            const userId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            let encryptedPassword = null;
            if (userData.password) {
                encryptedPassword = await bcryptjs_1.default.hash(userData.password, 10);
            }
            // 插入用户
            const result = await client.query(`INSERT INTO supabase.auth_users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          raw_user_meta_data, raw_app_meta_data, phone,
          is_super_admin, is_anonymous
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`, [
                userId,
                projectId,
                userData.app_metadata?.aud || 'authenticated',
                userData.role || types_1.USER_ROLES.authenticated,
                userData.email,
                encryptedPassword,
                userData.email_confirm ? now : null,
                now,
                now,
                JSON.stringify(userData.user_metadata || {}),
                JSON.stringify(userData.app_metadata || {}),
                userData.phone || null,
                userData.role === 'service_role',
                userData.role === 'anon'
            ]);
            const row = result.rows[0];
            // 记录审计日志
            await logAuditEvent(client, projectId, adminId, types_1.AUTH_ACTIONS.CREATE_USER, 'user', userId, null, {
                email: userData.email,
                role: userData.role
            }, ipAddress, userAgent);
            await client.query('COMMIT');
            return {
                id: row.id,
                aud: row.aud,
                role: row.role,
                email: row.email,
                email_confirmed_at: row.email_confirmed_at,
                invited_at: row.invited_at,
                confirmation_sent_at: row.confirmation_sent_at,
                recovery_sent_at: row.recovery_sent_at,
                last_sign_in_at: row.last_sign_in_at,
                raw_app_meta_data: row.raw_app_meta_data || {},
                raw_user_meta_data: row.raw_user_meta_data || {},
                is_super_admin: row.is_super_admin,
                created_at: row.created_at,
                updated_at: row.updated_at,
                phone: row.phone,
                phone_confirmed_at: row.phone_confirmed_at,
                confirmed_at: row.confirmed_at,
                email_change_confirm_status: row.email_change_confirm_status || 0,
                banned_until: row.banned_until,
                reauthentication_sent_at: row.reauthentication_sent_at,
                is_sso_user: row.is_sso_user || false,
                deleted_at: row.deleted_at,
                is_anonymous: row.is_anonymous || false,
                instance_id: row.instance_id
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('创建用户失败:', error);
            throw error.code ? error : { code: 'CREATE_USER_FAILED', message: '创建用户失败', status: 500 };
        }
        finally {
            client.release();
        }
    }
    // 更新用户
    async updateUser(projectRef, userId, userData, adminId, ipAddress, userAgent) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            // 获取旧用户数据
            const oldUser = await this.getUserById(projectRef, userId);
            // 构建更新字段
            const updateFields = [];
            const updateValues = [];
            let paramIndex = 1;
            if (userData.email !== undefined) {
                updateFields.push(`email = $${paramIndex}`);
                updateValues.push(userData.email);
                paramIndex++;
            }
            if (userData.password !== undefined) {
                const encryptedPassword = await bcryptjs_1.default.hash(userData.password, 10);
                updateFields.push(`encrypted_password = $${paramIndex}`);
                updateValues.push(encryptedPassword);
                paramIndex++;
            }
            if (userData.phone !== undefined) {
                updateFields.push(`phone = $${paramIndex}`);
                updateValues.push(userData.phone);
                paramIndex++;
            }
            if (userData.role !== undefined) {
                updateFields.push(`role = $${paramIndex}`);
                updateValues.push(userData.role);
                paramIndex++;
            }
            if (userData.user_metadata !== undefined) {
                updateFields.push(`raw_user_meta_data = $${paramIndex}`);
                updateValues.push(JSON.stringify(userData.user_metadata));
                paramIndex++;
            }
            if (userData.app_metadata !== undefined) {
                updateFields.push(`raw_app_meta_data = $${paramIndex}`);
                updateValues.push(JSON.stringify(userData.app_metadata));
                paramIndex++;
            }
            updateFields.push(`updated_at = $${paramIndex}`);
            updateValues.push(new Date().toISOString());
            paramIndex++;
            // 添加 WHERE 条件
            updateValues.push(userId, projectId);
            if (updateFields.length === 0) {
                throw { code: 'NO_UPDATE_FIELDS', message: '没有需要更新的字段', status: 400 };
            }
            const query = `
        UPDATE supabase.auth_users 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex - 1} AND instance_id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;
            const result = await client.query(query, updateValues);
            if (result.rows.length === 0) {
                throw { code: 'USER_NOT_FOUND', message: '用户不存在', status: 404 };
            }
            const row = result.rows[0];
            // 记录审计日志
            await logAuditEvent(client, projectId, adminId, types_1.AUTH_ACTIONS.UPDATE_USER, 'user', userId, oldUser, {
                email: row.email,
                role: row.role
            }, ipAddress, userAgent);
            await client.query('COMMIT');
            return {
                id: row.id,
                aud: row.aud,
                role: row.role,
                email: row.email,
                email_confirmed_at: row.email_confirmed_at,
                invited_at: row.invited_at,
                confirmation_sent_at: row.confirmation_sent_at,
                recovery_sent_at: row.recovery_sent_at,
                last_sign_in_at: row.last_sign_in_at,
                raw_app_meta_data: row.raw_app_meta_data || {},
                raw_user_meta_data: row.raw_user_meta_data || {},
                is_super_admin: row.is_super_admin,
                created_at: row.created_at,
                updated_at: row.updated_at,
                phone: row.phone,
                phone_confirmed_at: row.phone_confirmed_at,
                confirmed_at: row.confirmed_at,
                email_change_confirm_status: row.email_change_confirm_status || 0,
                banned_until: row.banned_until,
                reauthentication_sent_at: row.reauthentication_sent_at,
                is_sso_user: row.is_sso_user || false,
                deleted_at: row.deleted_at,
                is_anonymous: row.is_anonymous || false,
                instance_id: row.instance_id
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('更新用户失败:', error);
            throw error.code ? error : { code: 'UPDATE_USER_FAILED', message: '更新用户失败', status: 500 };
        }
        finally {
            client.release();
        }
    }
    // 删除用户 (软删除)
    async deleteUser(projectRef, userId, adminId, ipAddress, userAgent) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            // 获取旧用户数据
            const oldUser = await this.getUserById(projectRef, userId);
            const result = await client.query(`UPDATE supabase.auth_users 
         SET deleted_at = $1, updated_at = $1 
         WHERE id = $2 AND instance_id = $3 AND deleted_at IS NULL
         RETURNING id`, [new Date().toISOString(), userId, projectId]);
            if (result.rows.length === 0) {
                throw { code: 'USER_NOT_FOUND', message: '用户不存在', status: 404 };
            }
            // 记录审计日志
            await logAuditEvent(client, projectId, adminId, types_1.AUTH_ACTIONS.DELETE_USER, 'user', userId, oldUser, null, ipAddress, userAgent);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('删除用户失败:', error);
            throw error.code ? error : { code: 'DELETE_USER_FAILED', message: '删除用户失败', status: 500 };
        }
        finally {
            client.release();
        }
    }
    // 用户登录
    async signIn(projectRef, email, password, ipAddress, userAgent) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                return {
                    user: null,
                    session: null,
                    error: { message: '项目不存在', status: 404 }
                };
            }
            // 查找用户
            const result = await pool.query('SELECT * FROM supabase.auth_users WHERE email = $1 AND instance_id = $2 AND deleted_at IS NULL', [email, projectId]);
            if (result.rows.length === 0) {
                return {
                    user: null,
                    session: null,
                    error: { message: '无效的邮箱或密码', status: 400 }
                };
            }
            const user = result.rows[0];
            // 检查密码
            if (!user.encrypted_password || !(await bcryptjs_1.default.compare(password, user.encrypted_password))) {
                return {
                    user: null,
                    session: null,
                    error: { message: '无效的邮箱或密码', status: 400 }
                };
            }
            // 检查用户是否被禁用
            if (user.banned_until && new Date(user.banned_until) > new Date()) {
                return {
                    user: null,
                    session: null,
                    error: { message: '用户已被禁用', status: 403 }
                };
            }
            // 更新最后登录时间
            await pool.query('UPDATE supabase.auth_users SET last_sign_in_at = $1 WHERE id = $2', [new Date().toISOString(), user.id]);
            // 创建 JWT token
            const token = jsonwebtoken_1.default.sign({
                sub: user.id,
                email: user.email,
                role: user.role,
                aud: user.aud,
                iss: JWT_ISSUER,
                exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
                iat: Math.floor(Date.now() / 1000)
            }, JWT_SECRET);
            const session = {
                access_token: token,
                token_type: 'bearer',
                expires_in: JWT_EXPIRY,
                expires_at: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
                refresh_token: (0, uuid_1.v4)(),
                user: {
                    id: user.id,
                    aud: user.aud || 'authenticated',
                    role: user.role || types_1.USER_ROLES.authenticated,
                    email: user.email,
                    email_confirmed_at: user.email_confirmed_at,
                    invited_at: user.invited_at,
                    confirmation_sent_at: user.confirmation_sent_at,
                    recovery_sent_at: user.recovery_sent_at,
                    last_sign_in_at: user.last_sign_in_at,
                    raw_app_meta_data: user.raw_app_meta_data || {},
                    raw_user_meta_data: user.raw_user_meta_data || {},
                    is_super_admin: user.is_super_admin || false,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                    phone: user.phone,
                    phone_confirmed_at: user.phone_confirmed_at,
                    confirmed_at: user.confirmed_at,
                    email_change_confirm_status: user.email_change_confirm_status || 0,
                    banned_until: user.banned_until,
                    reauthentication_sent_at: user.reauthentication_sent_at,
                    is_sso_user: user.is_sso_user || false,
                    deleted_at: user.deleted_at,
                    is_anonymous: user.is_anonymous || false,
                    instance_id: user.instance_id
                }
            };
            // 记录审计日志
            await logAuditEvent(pool, projectId, user.id, types_1.AUTH_ACTIONS.SIGN_IN, 'user', user.id, null, null, ipAddress, userAgent);
            return { user: session.user, session, error: undefined };
        }
        catch (error) {
            console.error('登录失败:', error);
            return {
                user: null,
                session: null,
                error: { message: '登录失败', status: 500 }
            };
        }
    }
    // 验证 Token
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const result = await pool.query('SELECT * FROM supabase.auth_users WHERE id = $1 AND deleted_at IS NULL', [decoded.sub]);
            if (result.rows.length === 0) {
                return null;
            }
            const user = result.rows[0];
            return {
                id: user.id,
                aud: user.aud || 'authenticated',
                role: user.role || types_1.USER_ROLES.authenticated,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at,
                invited_at: user.invited_at,
                confirmation_sent_at: user.confirmation_sent_at,
                recovery_sent_at: user.recovery_sent_at,
                last_sign_in_at: user.last_sign_in_at,
                raw_app_meta_data: user.raw_app_meta_data || {},
                raw_user_meta_data: user.raw_user_meta_data || {},
                is_super_admin: user.is_super_admin || false,
                created_at: user.created_at,
                updated_at: user.updated_at,
                phone: user.phone,
                phone_confirmed_at: user.phone_confirmed_at,
                confirmed_at: user.confirmed_at,
                email_change_confirm_status: user.email_change_confirm_status || 0,
                banned_until: user.banned_until,
                reauthentication_sent_at: user.reauthentication_sent_at,
                is_sso_user: user.is_sso_user || false,
                deleted_at: user.deleted_at,
                is_anonymous: user.is_anonymous || false,
                instance_id: user.instance_id
            };
        }
        catch (error) {
            console.error('验证Token失败:', error);
            return null;
        }
    }
    // 重置密码
    async resetPassword(projectRef, email, newPassword) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            const encryptedPassword = await bcryptjs_1.default.hash(newPassword, 10);
            const result = await client.query(`UPDATE supabase.auth_users 
         SET encrypted_password = $1, updated_at = $2, recovery_sent_at = $2
         WHERE email = $3 AND instance_id = $4 AND deleted_at IS NULL
         RETURNING id`, [encryptedPassword, new Date().toISOString(), email, projectId]);
            if (result.rows.length === 0) {
                throw { code: 'USER_NOT_FOUND', message: '用户不存在', status: 404 };
            }
            await client.query('COMMIT');
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('重置密码失败:', error);
            throw error.code ? error : { code: 'RESET_PASSWORD_FAILED', message: '重置密码失败', status: 500 };
        }
        finally {
            client.release();
        }
    }
    // 获取项目认证配置
    async getAuthConfig(projectRef) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
            }
            // 这里可以查询项目特定的认证配置表
            // 暂时返回默认配置
            return {
                project_id: projectId,
                jwt_config: {
                    secret: JWT_SECRET,
                    expiry: JWT_EXPIRY,
                    issuer: JWT_ISSUER,
                    audience: JWT_AUDIENCE
                },
                password_min_length: 6,
                password_require_special: false,
                password_require_numbers: false,
                password_require_uppercase: false,
                password_require_lowercase: false,
                rate_limit_enabled: true,
                rate_limit_requests: 10,
                rate_limit_period: 60,
                mfa_enabled: false,
                mfa_max_enrolled_factors: 1,
                session_timeout: 86400,
                refresh_token_rotation_enabled: true,
                identity_providers: [],
                allow_anonymous_signup: true,
                allow_email_signup: true,
                allow_phone_signup: true,
                require_confirmation: false,
                mailer_enabled: false,
                sms_enabled: false,
                hooks_enabled: false,
                hooks_url: '',
                hooks_secret: ''
            };
        }
        catch (error) {
            console.error('获取认证配置失败:', error);
            throw { code: 'GET_CONFIG_FAILED', message: '获取认证配置失败', status: 500 };
        }
    }
}
exports.AuthService = AuthService;
// 审计日志函数
async function logAuditEvent(client, projectId, userId, action, resourceType, resourceId, oldValues, newValues, ipAddress, userAgent) {
    try {
        await client.query(`INSERT INTO supabase.audit_logs (
        project_id, user_id, action, resource_type, resource_id,
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            projectId,
            userId,
            action,
            resourceType,
            resourceId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            ipAddress || null,
            userAgent || null
        ]);
    }
    catch (error) {
        console.error('记录审计日志失败:', error);
        // 不抛出错误，避免影响主业务流程
    }
}
exports.default = new AuthService();
//# sourceMappingURL=service.js.map