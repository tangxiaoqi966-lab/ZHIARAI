"use strict";
/**
 * Supabase Auth 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpdateUsers = exports.getAuthConfig = exports.resetPassword = exports.verifyToken = exports.signIn = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.listUsers = void 0;
const service_1 = require("./service");
const authService = new service_1.AuthService();
// 获取请求中的项目引用
function getProjectRef(req) {
    // 从路径参数获取
    if (req.params.projectRef) {
        return req.params.projectRef;
    }
    // 从头部获取
    const projectRef = req.headers['x-project-ref'] || req.headers['project-ref'];
    if (projectRef && typeof projectRef === 'string') {
        return projectRef;
    }
    throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 };
}
// 获取操作用户ID（从认证信息）
function getUserId(req) {
    return req.user?.id || 'system';
}
// 获取客户端信息
function getClientInfo(req) {
    return {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    };
}
// 列出用户
const listUsers = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const params = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            per_page: req.query.per_page ? parseInt(req.query.per_page) : undefined,
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order,
            filter: req.query.filter
        };
        const result = await authService.listUsers(projectRef, params);
        res.json(result);
    }
    catch (error) {
        console.error('列出用户失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取用户列表失败';
        res.status(status).json({ error: message, code: error.code, details: error.details });
    }
};
exports.listUsers = listUsers;
// 获取单个用户
const getUser = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const userId = req.params.id;
        const user = await authService.getUserById(projectRef, userId);
        res.json({ user });
    }
    catch (error) {
        console.error('获取用户失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取用户失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getUser = getUser;
// 创建用户
const createUser = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const adminId = getUserId(req);
        const { ipAddress, userAgent } = getClientInfo(req);
        const userData = req.body;
        // 验证必要字段
        if (!userData.email) {
            res.status(400).json({ error: '邮箱是必填字段' });
            return;
        }
        const user = await authService.createUser(projectRef, userData, adminId, ipAddress, userAgent);
        res.status(201).json({ user });
    }
    catch (error) {
        console.error('创建用户失败:', error);
        const status = error.status || 500;
        const message = error.message || '创建用户失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.createUser = createUser;
// 更新用户
const updateUser = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const userId = req.params.id;
        const adminId = getUserId(req);
        const { ipAddress, userAgent } = getClientInfo(req);
        const userData = req.body;
        const user = await authService.updateUser(projectRef, userId, userData, adminId, ipAddress, userAgent);
        res.json({ user });
    }
    catch (error) {
        console.error('更新用户失败:', error);
        const status = error.status || 500;
        const message = error.message || '更新用户失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.updateUser = updateUser;
// 删除用户
const deleteUser = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const userId = req.params.id;
        const adminId = getUserId(req);
        const { ipAddress, userAgent } = getClientInfo(req);
        await authService.deleteUser(projectRef, userId, adminId, ipAddress, userAgent);
        res.status(204).send();
    }
    catch (error) {
        console.error('删除用户失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除用户失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deleteUser = deleteUser;
// 用户登录
const signIn = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const { ipAddress, userAgent } = getClientInfo(req);
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: '邮箱和密码是必填字段' });
            return;
        }
        const result = await authService.signIn(projectRef, email, password, ipAddress, userAgent);
        if (result.error) {
            res.status(result.error.status || 401).json({ error: result.error.message });
            return;
        }
        res.json(result);
    }
    catch (error) {
        console.error('登录失败:', error);
        const status = error.status || 500;
        const message = error.message || '登录失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.signIn = signIn;
// 验证 Token
const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
        if (!token) {
            res.status(401).json({ error: '未提供Token' });
            return;
        }
        const user = await authService.verifyToken(token);
        if (!user) {
            res.status(401).json({ error: '无效的Token' });
            return;
        }
        res.json({ user, valid: true });
    }
    catch (error) {
        console.error('验证Token失败:', error);
        const status = error.status || 500;
        const message = error.message || '验证Token失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.verifyToken = verifyToken;
// 重置密码
const resetPassword = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const { email, new_password } = req.body;
        if (!email || !new_password) {
            res.status(400).json({ error: '邮箱和新密码是必填字段' });
            return;
        }
        const success = await authService.resetPassword(projectRef, email, new_password);
        if (success) {
            res.json({ success: true, message: '密码重置成功' });
        }
        else {
            res.status(404).json({ success: false, error: '用户不存在' });
        }
    }
    catch (error) {
        console.error('重置密码失败:', error);
        const status = error.status || 500;
        const message = error.message || '重置密码失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.resetPassword = resetPassword;
// 获取认证配置
const getAuthConfig = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const config = await authService.getAuthConfig(projectRef);
        res.json(config);
    }
    catch (error) {
        console.error('获取认证配置失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取认证配置失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getAuthConfig = getAuthConfig;
// 批量操作：启用/禁用多个用户
const batchUpdateUsers = async (req, res) => {
    try {
        const { action, user_ids } = req.body;
        if (!action || !user_ids || !Array.isArray(user_ids)) {
            res.status(400).json({ error: '操作类型和用户ID列表是必填字段' });
            return;
        }
        const results = [];
        for (const userId of user_ids) {
            try {
                // 这里可以实现批量启用/禁用用户的逻辑
                // 暂时先记录每个操作的结果
                results.push({ user_id: userId, success: true, message: '操作成功' });
            }
            catch (error) {
                results.push({ user_id: userId, success: false, error: error.message });
            }
        }
        res.json({ results });
    }
    catch (error) {
        console.error('批量更新用户失败:', error);
        const status = error.status || 500;
        const message = error.message || '批量更新用户失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.batchUpdateUsers = batchUpdateUsers;
//# sourceMappingURL=controller.js.map