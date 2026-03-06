"use strict";
/**
 * Supabase Database 路由
 * 提供与官方 Supabase Database API 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("../modules/supabase/database/controller");
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
// 官方 Supabase Database API
// POST /rest/v1/ (SQL 查询端点)
officialApiRouter.post('/v1/', controller_1.executeSQL);
// 注册官方 API 路由 (在认证之前)
router.use('/rest', officialApiRouter);
// === 平台管理 API (需要用户认证) ===
// 所有管理 API 都需要认证
router.use(auth_1.authenticate);
// 需要管理员角色
router.use((0, auth_1.requireRole)(['admin', 'super_admin']));
// === 项目级别 Database 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取
// 执行原始 SQL 查询
// POST /api/supabase/projects/:projectRef/database/sql
router.post('/projects/:projectRef/database/sql', controller_1.executeSQL);
// 列出所有表
// GET /api/supabase/projects/:projectRef/database/tables
router.get('/projects/:projectRef/database/tables', controller_1.listTables);
// 获取表结构
// GET /api/supabase/projects/:projectRef/database/tables/:tableName
router.get('/projects/:projectRef/database/tables/:tableName', controller_1.getTableSchema);
// 创建新表
// POST /api/supabase/projects/:projectRef/database/tables
router.post('/projects/:projectRef/database/tables', controller_1.createTable);
// 删除表
// DELETE /api/supabase/projects/:projectRef/database/tables/:tableName
router.delete('/projects/:projectRef/database/tables/:tableName', controller_1.dropTable);
// 查询数据 (PostgREST 风格)
// GET /api/supabase/projects/:projectRef/database/data/:tableName
router.get('/projects/:projectRef/database/data/:tableName', controller_1.queryData);
// 插入数据
// POST /api/supabase/projects/:projectRef/database/data/:tableName
router.post('/projects/:projectRef/database/data/:tableName', controller_1.insertData);
// 更新数据
// PUT /api/supabase/projects/:projectRef/database/data/:tableName
router.put('/projects/:projectRef/database/data/:tableName', controller_1.updateData);
// 删除数据
// DELETE /api/supabase/projects/:projectRef/database/data/:tableName
router.delete('/projects/:projectRef/database/data/:tableName', controller_1.deleteData);
// 批量操作
// POST /api/supabase/projects/:projectRef/database/batch
router.post('/projects/:projectRef/database/batch', controller_1.batchOperation);
// 获取数据库统计信息
// GET /api/supabase/projects/:projectRef/database/stats
router.get('/projects/:projectRef/database/stats', controller_1.getDatabaseStats);
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
projectRefRoutes.post('/database/sql', controller_1.executeSQL);
projectRefRoutes.get('/database/tables', controller_1.listTables);
projectRefRoutes.get('/database/tables/:tableName', controller_1.getTableSchema);
projectRefRoutes.post('/database/tables', controller_1.createTable);
projectRefRoutes.delete('/database/tables/:tableName', controller_1.dropTable);
projectRefRoutes.get('/database/data/:tableName', controller_1.queryData);
projectRefRoutes.post('/database/data/:tableName', controller_1.insertData);
projectRefRoutes.put('/database/data/:tableName', controller_1.updateData);
projectRefRoutes.delete('/database/data/:tableName', controller_1.deleteData);
projectRefRoutes.post('/database/batch', controller_1.batchOperation);
projectRefRoutes.get('/database/stats', controller_1.getDatabaseStats);
// 注册向后兼容的路由
router.use('/', projectRefRoutes);
// 健康检查端点
router.get('/health', controller_1.healthCheck);
exports.default = router;
//# sourceMappingURL=supabaseDatabaseRoutes.js.map