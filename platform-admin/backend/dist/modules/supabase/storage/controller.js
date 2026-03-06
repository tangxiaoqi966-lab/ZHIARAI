"use strict";
/**
 * Supabase Storage 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getStorageStats = exports.batchOperation = exports.createSignedURL = exports.deleteFile = exports.downloadFile = exports.uploadFile = exports.listFiles = exports.deleteBucket = exports.updateBucket = exports.createBucket = exports.getBucket = exports.listBuckets = void 0;
const service_1 = require("./service");
const storageService = new service_1.StorageService();
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
// 获取请求中的用户身份 (简化实现)
function getUserId(req) {
    // 实际实现中可以从 JWT token 中提取
    return req.headers['x-user-id'] || 'system';
}
// 列出所有 Bucket
const listBuckets = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const buckets = await storageService.listBuckets(projectRef);
        res.json({ buckets });
    }
    catch (error) {
        console.error('列出 Bucket 失败:', error);
        const status = error.status || 500;
        const message = error.message || '列出 Bucket 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.listBuckets = listBuckets;
// 获取单个 Bucket
const getBucket = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        if (!bucketName) {
            res.status(400).json({ error: 'Bucket 名称是必填字段' });
            return;
        }
        const bucket = await storageService.getBucket(projectRef, bucketName);
        res.json(bucket);
    }
    catch (error) {
        console.error('获取 Bucket 失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取 Bucket 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getBucket = getBucket;
// 创建 Bucket
const createBucket = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketRequest = req.body;
        const userId = getUserId(req);
        if (!bucketRequest.name) {
            res.status(400).json({ error: 'Bucket 名称是必填字段' });
            return;
        }
        const bucket = await storageService.createBucket(projectRef, bucketRequest, userId);
        res.status(201).json(bucket);
    }
    catch (error) {
        console.error('创建 Bucket 失败:', error);
        const status = error.status || 500;
        const message = error.message || '创建 Bucket 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.createBucket = createBucket;
// 更新 Bucket
const updateBucket = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        const bucketRequest = req.body;
        const userId = getUserId(req);
        if (!bucketName) {
            res.status(400).json({ error: 'Bucket 名称是必填字段' });
            return;
        }
        const bucket = await storageService.updateBucket(projectRef, bucketName, bucketRequest, userId);
        res.json(bucket);
    }
    catch (error) {
        console.error('更新 Bucket 失败:', error);
        const status = error.status || 500;
        const message = error.message || '更新 Bucket 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.updateBucket = updateBucket;
// 删除 Bucket
const deleteBucket = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        if (!bucketName) {
            res.status(400).json({ error: 'Bucket 名称是必填字段' });
            return;
        }
        await storageService.deleteBucket(projectRef, bucketName);
        res.status(204).send();
    }
    catch (error) {
        console.error('删除 Bucket 失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除 Bucket 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deleteBucket = deleteBucket;
// 列出文件
const listFiles = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        const params = {
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
            sortBy: req.query.sortBy ? JSON.parse(req.query.sortBy) : undefined,
            search: req.query.search,
            prefix: req.query.prefix
        };
        if (!bucketName) {
            res.status(400).json({ error: 'Bucket 名称是必填字段' });
            return;
        }
        const result = await storageService.listFiles(projectRef, bucketName, params);
        res.json(result);
    }
    catch (error) {
        console.error('列出文件失败:', error);
        const status = error.status || 500;
        const message = error.message || '列出文件失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.listFiles = listFiles;
// 上传文件
const uploadFile = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        const filePath = req.params[0] || req.query.path; // 支持路径参数和查询参数
        if (!bucketName || !filePath) {
            res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' });
            return;
        }
        const uploadRequest = {
            file: req.body, // 实际文件数据
            bucket: bucketName,
            path: filePath,
            contentType: req.headers['content-type'] || 'application/octet-stream',
            metadata: req.headers['x-metadata'] ? JSON.parse(req.headers['x-metadata']) : {}
        };
        const fileObject = await storageService.uploadFile(projectRef, uploadRequest);
        res.status(201).json(fileObject);
    }
    catch (error) {
        console.error('上传文件失败:', error);
        const status = error.status || 500;
        const message = error.message || '上传文件失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.uploadFile = uploadFile;
// 下载文件
const downloadFile = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        const filePath = req.params[0] || req.query.path;
        if (!bucketName || !filePath) {
            res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' });
            return;
        }
        const result = await storageService.downloadFile(projectRef, bucketName, filePath);
        // 设置响应头
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Length', result.contentLength);
        res.setHeader('Last-Modified', result.lastModified);
        res.setHeader('ETag', result.etag);
        // 发送文件数据
        res.send(result.data);
    }
    catch (error) {
        console.error('下载文件失败:', error);
        const status = error.status || 500;
        const message = error.message || '下载文件失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.downloadFile = downloadFile;
// 删除文件
const deleteFile = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        const filePath = req.params[0] || req.query.path;
        if (!bucketName || !filePath) {
            res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' });
            return;
        }
        await storageService.deleteFile(projectRef, bucketName, filePath);
        res.status(204).send();
    }
    catch (error) {
        console.error('删除文件失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除文件失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deleteFile = deleteFile;
// 生成签名 URL
const createSignedURL = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const bucketName = req.params.bucketName;
        const filePath = req.params[0] || req.query.path;
        const signedRequest = req.body;
        if (!bucketName || !filePath) {
            res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' });
            return;
        }
        const result = await storageService.createSignedURL(projectRef, bucketName, filePath, signedRequest);
        res.json(result);
    }
    catch (error) {
        console.error('生成签名 URL 失败:', error);
        const status = error.status || 500;
        const message = error.message || '生成签名 URL 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.createSignedURL = createSignedURL;
// 批量操作
const batchOperation = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const batchRequest = req.body;
        if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
            res.status(400).json({ error: '操作列表是必填字段' });
            return;
        }
        const result = await storageService.batchOperation(projectRef, batchRequest);
        res.json(result);
    }
    catch (error) {
        console.error('批量操作失败:', error);
        const status = error.status || 500;
        const message = error.message || '批量操作失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.batchOperation = batchOperation;
// 获取存储统计信息
const getStorageStats = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const stats = await storageService.getStorageStats(projectRef);
        res.json(stats);
    }
    catch (error) {
        console.error('获取存储统计信息失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取存储统计信息失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getStorageStats = getStorageStats;
// 健康检查
const healthCheck = async (_req, res) => {
    res.json({
        status: 'ok',
        service: 'supabase-storage',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=controller.js.map