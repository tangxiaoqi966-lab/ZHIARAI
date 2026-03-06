"use strict";
/**
 * Supabase Edge Functions 路由
 * 提供与官方 Supabase Edge Functions API 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("../modules/supabase/edge-functions/controller");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
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
// 官方 Supabase Edge Functions API
// 列出 Edge Functions
officialApiRouter.get('/v1/functions', controller_1.listEdgeFunctions);
// 获取单个 Edge Function
officialApiRouter.get('/v1/functions/:functionId', controller_1.getEdgeFunction);
// 创建 Edge Function
officialApiRouter.post('/v1/functions', controller_1.createEdgeFunction);
// 更新 Edge Function
officialApiRouter.put('/v1/functions/:functionId', controller_1.updateEdgeFunction);
// 删除 Edge Function
officialApiRouter.delete('/v1/functions/:functionId', controller_1.deleteEdgeFunction);
// 部署 Edge Function
officialApiRouter.post('/v1/functions/:functionId/deploy', controller_1.deployEdgeFunction);
// 激活 Edge Function
officialApiRouter.post('/v1/functions/:functionId/activate', controller_1.activateEdgeFunction);
// 停用 Edge Function
officialApiRouter.post('/v1/functions/:functionId/deactivate', controller_1.deactivateEdgeFunction);
// 批量操作
officialApiRouter.post('/v1/functions/batch', controller_1.batchOperation);
// 获取统计信息
officialApiRouter.get('/v1/functions/stats', controller_1.getEdgeFunctionStats);
// 获取调用日志
officialApiRouter.get('/v1/functions/:functionId/logs', controller_1.getInvocationLogs);
officialApiRouter.get('/v1/functions/logs', controller_1.getInvocationLogs);
// 健康检查
officialApiRouter.get('/health', controller_1.healthCheck);
// 注册官方 API 路由 (在认证之前)
router.use('/functions', officialApiRouter);
// === 平台管理 API (需要用户认证) ===
// 所有管理 API 都需要认证
router.use(auth_1.authenticate);
// 需要管理员角色
router.use((0, auth_1.requireRole)(['admin', 'super_admin']));
// === 项目级别 Edge Functions 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取
// 列出 Edge Functions
router.get('/projects/:projectRef/edge-functions', controller_1.listEdgeFunctions);
// 获取单个 Edge Function
router.get('/projects/:projectRef/edge-functions/:functionId', controller_1.getEdgeFunction);
// 创建 Edge Function
router.post('/projects/:projectRef/edge-functions', controller_1.createEdgeFunction);
// 更新 Edge Function
router.put('/projects/:projectRef/edge-functions/:functionId', controller_1.updateEdgeFunction);
// 删除 Edge Function
router.delete('/projects/:projectRef/edge-functions/:functionId', controller_1.deleteEdgeFunction);
// 部署 Edge Function
router.post('/projects/:projectRef/edge-functions/:functionId/deploy', controller_1.deployEdgeFunction);
// 激活 Edge Function
router.post('/projects/:projectRef/edge-functions/:functionId/activate', controller_1.activateEdgeFunction);
// 停用 Edge Function
router.post('/projects/:projectRef/edge-functions/:functionId/deactivate', controller_1.deactivateEdgeFunction);
// 批量操作
router.post('/projects/:projectRef/edge-functions/batch', controller_1.batchOperation);
// 获取统计信息
router.get('/projects/:projectRef/edge-functions/stats', controller_1.getEdgeFunctionStats);
// 获取调用日志
router.get('/projects/:projectRef/edge-functions/:functionId/logs', controller_1.getInvocationLogs);
router.get('/projects/:projectRef/edge-functions/logs', controller_1.getInvocationLogs);
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
projectRefRoutes.get('/edge-functions', controller_1.listEdgeFunctions);
projectRefRoutes.get('/edge-functions/:functionId', controller_1.getEdgeFunction);
projectRefRoutes.post('/edge-functions', controller_1.createEdgeFunction);
projectRefRoutes.put('/edge-functions/:functionId', controller_1.updateEdgeFunction);
projectRefRoutes.delete('/edge-functions/:functionId', controller_1.deleteEdgeFunction);
projectRefRoutes.post('/edge-functions/:functionId/deploy', controller_1.deployEdgeFunction);
projectRefRoutes.post('/edge-functions/:functionId/activate', controller_1.activateEdgeFunction);
projectRefRoutes.post('/edge-functions/:functionId/deactivate', controller_1.deactivateEdgeFunction);
projectRefRoutes.post('/edge-functions/batch', controller_1.batchOperation);
projectRefRoutes.get('/edge-functions/stats', controller_1.getEdgeFunctionStats);
projectRefRoutes.get('/edge-functions/:functionId/logs', controller_1.getInvocationLogs);
projectRefRoutes.get('/edge-functions/logs', controller_1.getInvocationLogs);
// 注册向后兼容的路由
router.use('/', projectRefRoutes);
// 健康检查端点
router.get('/health', controller_1.healthCheck);
exports.default = router;
//# sourceMappingURL=supabaseEdgeFunctionsRoutes.js.map