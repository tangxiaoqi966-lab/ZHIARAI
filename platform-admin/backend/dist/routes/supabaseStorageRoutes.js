"use strict";
/**
 * Supabase Storage 路由
 * 提供与官方 Supabase Storage API 完全兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("../modules/supabase/storage/controller");
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
// 官方 Supabase Storage API
// Bucket 操作
officialApiRouter.get('/v1/bucket', controller_1.listBuckets); // 列出所有 Bucket
officialApiRouter.get('/v1/bucket/:bucketName', controller_1.getBucket); // 获取单个 Bucket
officialApiRouter.post('/v1/bucket', controller_1.createBucket); // 创建 Bucket
officialApiRouter.put('/v1/bucket/:bucketName', controller_1.updateBucket); // 更新 Bucket
officialApiRouter.delete('/v1/bucket/:bucketName', controller_1.deleteBucket); // 删除 Bucket
// 文件操作 (使用路径参数捕获文件路径)
officialApiRouter.get('/v1/object/list/:bucketName', controller_1.listFiles); // 列出文件
officialApiRouter.post('/v1/object/:bucketName/*', controller_1.uploadFile); // 上传文件 (支持子目录)
officialApiRouter.get('/v1/object/:bucketName/*', controller_1.downloadFile); // 下载文件
officialApiRouter.delete('/v1/object/:bucketName/*', controller_1.deleteFile); // 删除文件
officialApiRouter.post('/v1/object/sign/:bucketName/*', controller_1.createSignedURL); // 生成签名 URL
// 批量操作
officialApiRouter.post('/v1/batch', controller_1.batchOperation);
// 统计信息
officialApiRouter.get('/v1/stats', controller_1.getStorageStats);
// 健康检查
officialApiRouter.get('/health', controller_1.healthCheck);
// 注册官方 API 路由 (在认证之前)
router.use('/storage', officialApiRouter);
// === 平台管理 API (需要用户认证) ===
// 所有管理 API 都需要认证
router.use(auth_1.authenticate);
// 需要管理员角色
router.use((0, auth_1.requireRole)(['admin', 'super_admin']));
// === 项目级别 Storage 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取
// Bucket 操作
router.get('/projects/:projectRef/storage/buckets', controller_1.listBuckets); // 列出所有 Bucket
router.get('/projects/:projectRef/storage/buckets/:bucketName', controller_1.getBucket); // 获取单个 Bucket
router.post('/projects/:projectRef/storage/buckets', controller_1.createBucket); // 创建 Bucket
router.put('/projects/:projectRef/storage/buckets/:bucketName', controller_1.updateBucket); // 更新 Bucket
router.delete('/projects/:projectRef/storage/buckets/:bucketName', controller_1.deleteBucket); // 删除 Bucket
// 文件操作
router.get('/projects/:projectRef/storage/:bucketName/files', controller_1.listFiles); // 列出文件
router.post('/projects/:projectRef/storage/:bucketName/files/*', controller_1.uploadFile); // 上传文件
router.get('/projects/:projectRef/storage/:bucketName/files/*', controller_1.downloadFile); // 下载文件
router.delete('/projects/:projectRef/storage/:bucketName/files/*', controller_1.deleteFile); // 删除文件
router.post('/projects/:projectRef/storage/:bucketName/signed-url/*', controller_1.createSignedURL); // 生成签名 URL
// 批量操作
router.post('/projects/:projectRef/storage/batch', controller_1.batchOperation);
// 统计信息
router.get('/projects/:projectRef/storage/stats', controller_1.getStorageStats);
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
projectRefRoutes.get('/storage/buckets', controller_1.listBuckets);
projectRefRoutes.get('/storage/buckets/:bucketName', controller_1.getBucket);
projectRefRoutes.post('/storage/buckets', controller_1.createBucket);
projectRefRoutes.put('/storage/buckets/:bucketName', controller_1.updateBucket);
projectRefRoutes.delete('/storage/buckets/:bucketName', controller_1.deleteBucket);
projectRefRoutes.get('/storage/:bucketName/files', controller_1.listFiles);
projectRefRoutes.post('/storage/:bucketName/files/*', controller_1.uploadFile);
projectRefRoutes.get('/storage/:bucketName/files/*', controller_1.downloadFile);
projectRefRoutes.delete('/storage/:bucketName/files/*', controller_1.deleteFile);
projectRefRoutes.post('/storage/:bucketName/signed-url/*', controller_1.createSignedURL);
projectRefRoutes.post('/storage/batch', controller_1.batchOperation);
projectRefRoutes.get('/storage/stats', controller_1.getStorageStats);
// 注册向后兼容的路由
router.use('/', projectRefRoutes);
// 健康检查端点
router.get('/health', controller_1.healthCheck);
exports.default = router;
//# sourceMappingURL=supabaseStorageRoutes.js.map