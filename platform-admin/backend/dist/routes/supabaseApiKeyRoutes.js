"use strict";
/**
 * Supabase API Keys 路由
 * 提供与官方 Supabase API Keys 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("../modules/supabase/api-keys/controller");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
// 所有 API Keys 路由都需要认证
router.use(auth_1.authenticate);
// 注意：Supabase 风格的 API Keys 管理通常需要管理员权限
// 可以根据需要调整权限要求
router.use((0, auth_1.requireRole)(['admin', 'super_admin']));
// === 项目级别 API Keys 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取
// 列出项目的所有 API 密钥
// GET /api/supabase/projects/:projectRef/api-keys
router.get('/projects/:projectRef/api-keys', controller_1.listApiKeys);
// 创建新的 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys
router.post('/projects/:projectRef/api-keys', controller_1.createApiKey);
// 批量操作 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys/batch
router.post('/projects/:projectRef/api-keys/batch', controller_1.batchUpdateApiKeys);
// 获取单个 API 密钥
// GET /api/supabase/projects/:projectRef/api-keys/:id
router.get('/projects/:projectRef/api-keys/:id', controller_1.getApiKey);
// 更新 API 密钥
// PUT /api/supabase/projects/:projectRef/api-keys/:id
router.put('/projects/:projectRef/api-keys/:id', controller_1.updateApiKey);
// 删除 API 密钥
// DELETE /api/supabase/projects/:projectRef/api-keys/:id
router.delete('/projects/:projectRef/api-keys/:id', controller_1.deleteApiKey);
// 轮换 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys/:id/rotate
router.post('/projects/:projectRef/api-keys/:id/rotate', controller_1.rotateApiKey);
// 撤销 API 密钥 (禁用)
// POST /api/supabase/projects/:projectRef/api-keys/:id/revoke
router.post('/projects/:projectRef/api-keys/:id/revoke', controller_1.revokeApiKey);
// 启用 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys/:id/enable
router.post('/projects/:projectRef/api-keys/:id/enable', controller_1.enableApiKey);
// === 全局 API Keys 路由 (不需要项目引用) ===
// 验证 API 密钥
// POST /api/supabase/api-keys/validate
router.post('/api-keys/validate', controller_1.validateApiKey);
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
// 使用头部 project-ref 的路由
projectRefRoutes.get('/api-keys', controller_1.listApiKeys);
projectRefRoutes.post('/api-keys', controller_1.createApiKey);
projectRefRoutes.post('/api-keys/batch', controller_1.batchUpdateApiKeys);
projectRefRoutes.get('/api-keys/:id', controller_1.getApiKey);
projectRefRoutes.put('/api-keys/:id', controller_1.updateApiKey);
projectRefRoutes.delete('/api-keys/:id', controller_1.deleteApiKey);
projectRefRoutes.post('/api-keys/:id/rotate', controller_1.rotateApiKey);
projectRefRoutes.post('/api-keys/:id/revoke', controller_1.revokeApiKey);
projectRefRoutes.post('/api-keys/:id/enable', controller_1.enableApiKey);
// 注册向后兼容的路由
router.use('/', projectRefRoutes);
// 健康检查端点
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'supabase-api-keys',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=supabaseApiKeyRoutes.js.map