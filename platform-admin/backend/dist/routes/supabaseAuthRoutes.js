"use strict";
/**
 * Supabase Auth 路由
 * 提供与官方 Supabase Auth API 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("../modules/supabase/auth/controller");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
// === 公开路由 (不需要认证) ===
// 用户登录
// POST /api/supabase/auth/v1/token
router.post('/auth/v1/token', controller_1.signIn);
// 验证 Token
// GET /api/supabase/auth/v1/user
router.get('/auth/v1/user', controller_1.verifyToken);
// 重置密码
// POST /api/supabase/auth/v1/recover
router.post('/auth/v1/recover', controller_1.resetPassword);
// 获取认证配置
// GET /api/supabase/auth/v1/config
router.get('/auth/v1/config', controller_1.getAuthConfig);
// === 受保护路由 (需要认证) ===
// 所有管理员操作需要认证
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_1.authenticate);
adminRouter.use((0, auth_1.requireRole)(['admin', 'super_admin']));
// 列出项目的所有用户 (管理员接口)
// GET /api/supabase/projects/:projectRef/auth/users
adminRouter.get('/projects/:projectRef/auth/users', controller_1.listUsers);
// 创建新用户 (管理员接口)
// POST /api/supabase/projects/:projectRef/auth/users
adminRouter.post('/projects/:projectRef/auth/users', controller_1.createUser);
// 批量操作用户
// POST /api/supabase/projects/:projectRef/auth/users/batch
adminRouter.post('/projects/:projectRef/auth/users/batch', controller_1.batchUpdateUsers);
// 获取单个用户
// GET /api/supabase/projects/:projectRef/auth/users/:id
adminRouter.get('/projects/:projectRef/auth/users/:id', controller_1.getUser);
// 更新用户
// PUT /api/supabase/projects/:projectRef/auth/users/:id
adminRouter.put('/projects/:projectRef/auth/users/:id', controller_1.updateUser);
// 删除用户
// DELETE /api/supabase/projects/:projectRef/auth/users/:id
adminRouter.delete('/projects/:projectRef/auth/users/:id', controller_1.deleteUser);
// === 向后兼容的路由 (支持头部传递 project-ref) ===
// 支持通过头部 X-Project-Ref 或 project-ref 指定项目的路由
const projectRefRoutes = (0, express_1.Router)({ mergeParams: true });
projectRefRoutes.use((req, _res, next) => {
    // 如果路径中没有 projectRef，尝试从头部获取
    if (!req.params.projectRef) {
        const projectRef = req.headers['x-project-ref'] || req.headers['project-ref'];
        if (projectRef && typeof projectRef === 'string') {
            req.params.projectRef = projectRef;
        }
    }
    next();
});
// 使用头部 project-ref 的受保护路由
const protectedProjectRefRoutes = (0, express_1.Router)({ mergeParams: true });
protectedProjectRefRoutes.use(auth_1.authenticate);
protectedProjectRefRoutes.use((0, auth_1.requireRole)(['admin', 'super_admin']));
protectedProjectRefRoutes.get('/auth/users', controller_1.listUsers);
protectedProjectRefRoutes.post('/auth/users', controller_1.createUser);
protectedProjectRefRoutes.post('/auth/users/batch', controller_1.batchUpdateUsers);
protectedProjectRefRoutes.get('/auth/users/:id', controller_1.getUser);
protectedProjectRefRoutes.put('/auth/users/:id', controller_1.updateUser);
protectedProjectRefRoutes.delete('/auth/users/:id', controller_1.deleteUser);
// 注册路由
projectRefRoutes.use('/', protectedProjectRefRoutes);
// === Supabase 官方 API 兼容路由 ===
// Supabase 官方 API 路径 (需要服务角色密钥)
const officialApiRouter = (0, express_1.Router)();
// 服务角色认证中间件 (检查 service_role API 密钥)
const requireServiceRole = (req, res, next) => {
    const apiKey = req.headers['apikey'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKey) {
        return res.status(401).json({ error: '需要 API 密钥' });
    }
    // 这里可以添加 API 密钥验证逻辑
    // 暂时允许所有请求
    next();
};
officialApiRouter.use(requireServiceRole);
// 官方 Supabase Auth Admin API
// GET /auth/v1/admin/users (需要 service_role 密钥)
officialApiRouter.get('/v1/admin/users', controller_1.listUsers);
// POST /auth/v1/admin/users (需要 service_role 密钥)
officialApiRouter.post('/v1/admin/users', controller_1.createUser);
// GET /auth/v1/admin/users/:id (需要 service_role 密钥)
officialApiRouter.get('/v1/admin/users/:id', controller_1.getUser);
// PUT /auth/v1/admin/users/:id (需要 service_role 密钥)
officialApiRouter.put('/v1/admin/users/:id', controller_1.updateUser);
// DELETE /auth/v1/admin/users/:id (需要 service_role 密钥)
officialApiRouter.delete('/v1/admin/users/:id', controller_1.deleteUser);
// === 注册所有路由到主路由 ===
// 注册管理员路由
router.use('/', adminRouter);
// 注册向后兼容的路由
router.use('/', projectRefRoutes);
// 注册官方 API 路由
router.use('/auth', officialApiRouter);
// 健康检查端点
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'supabase-auth',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=supabaseAuthRoutes.js.map