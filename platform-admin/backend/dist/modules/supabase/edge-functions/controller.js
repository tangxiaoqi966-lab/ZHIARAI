"use strict";
/**
 * Supabase Edge Functions 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getInvocationLogs = exports.getEdgeFunctionStats = exports.batchOperation = exports.deactivateEdgeFunction = exports.activateEdgeFunction = exports.deployEdgeFunction = exports.deleteEdgeFunction = exports.updateEdgeFunction = exports.createEdgeFunction = exports.getEdgeFunction = exports.listEdgeFunctions = void 0;
const service_1 = require("./service");
const edgeFunctionsService = new service_1.EdgeFunctionsService();
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
// 获取请求中的用户身份
function getUserId(req) {
    // 实际实现中可以从 JWT token 中提取
    return req.headers['x-user-id'] || 'system';
}
// 列出 Edge Functions
const listEdgeFunctions = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const params = {
            status: req.query.status,
            runtime: req.query.runtime,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            search: req.query.search
        };
        const functions = await edgeFunctionsService.listEdgeFunctions(projectRef, params);
        res.json({ functions });
    }
    catch (error) {
        console.error('列出 Edge Functions 失败:', error);
        const status = error.status || 500;
        const message = error.message || '列出 Edge Functions 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.listEdgeFunctions = listEdgeFunctions;
// 获取单个 Edge Function
const getEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        if (!functionId) {
            res.status(400).json({ error: '函数 ID 是必填字段' });
            return;
        }
        const edgeFunction = await edgeFunctionsService.getEdgeFunction(projectRef, functionId);
        res.json(edgeFunction);
    }
    catch (error) {
        console.error('获取 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getEdgeFunction = getEdgeFunction;
// 创建 Edge Function
const createEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionRequest = req.body;
        const userId = getUserId(req);
        if (!functionRequest.name || !functionRequest.runtime || !functionRequest.entrypoint || !functionRequest.code) {
            res.status(400).json({ error: '名称、运行时、入口点和代码是必填字段' });
            return;
        }
        const edgeFunction = await edgeFunctionsService.createEdgeFunction(projectRef, functionRequest, userId);
        res.status(201).json(edgeFunction);
    }
    catch (error) {
        console.error('创建 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '创建 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.createEdgeFunction = createEdgeFunction;
// 更新 Edge Function
const updateEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        const functionRequest = req.body;
        const userId = getUserId(req);
        if (!functionId) {
            res.status(400).json({ error: '函数 ID 是必填字段' });
            return;
        }
        const edgeFunction = await edgeFunctionsService.updateEdgeFunction(projectRef, functionId, functionRequest, userId);
        res.json(edgeFunction);
    }
    catch (error) {
        console.error('更新 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '更新 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.updateEdgeFunction = updateEdgeFunction;
// 删除 Edge Function
const deleteEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        if (!functionId) {
            res.status(400).json({ error: '函数 ID 是必填字段' });
            return;
        }
        await edgeFunctionsService.deleteEdgeFunction(projectRef, functionId);
        res.status(204).send();
    }
    catch (error) {
        console.error('删除 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deleteEdgeFunction = deleteEdgeFunction;
// 部署 Edge Function
const deployEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        const deployRequest = req.body;
        const userId = getUserId(req);
        if (!functionId) {
            res.status(400).json({ error: '函数 ID 是必填字段' });
            return;
        }
        const edgeFunction = await edgeFunctionsService.deployEdgeFunction(projectRef, functionId, deployRequest, userId);
        res.json(edgeFunction);
    }
    catch (error) {
        console.error('部署 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '部署 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deployEdgeFunction = deployEdgeFunction;
// 激活 Edge Function
const activateEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        const userId = getUserId(req);
        if (!functionId) {
            res.status(400).json({ error: '函数 ID 是必填字段' });
            return;
        }
        const edgeFunction = await edgeFunctionsService.activateEdgeFunction(projectRef, functionId, userId);
        res.json(edgeFunction);
    }
    catch (error) {
        console.error('激活 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '激活 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.activateEdgeFunction = activateEdgeFunction;
// 停用 Edge Function
const deactivateEdgeFunction = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        const userId = getUserId(req);
        if (!functionId) {
            res.status(400).json({ error: '函数 ID 是必填字段' });
            return;
        }
        const edgeFunction = await edgeFunctionsService.deactivateEdgeFunction(projectRef, functionId, userId);
        res.json(edgeFunction);
    }
    catch (error) {
        console.error('停用 Edge Function 失败:', error);
        const status = error.status || 500;
        const message = error.message || '停用 Edge Function 失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deactivateEdgeFunction = deactivateEdgeFunction;
// 批量操作
const batchOperation = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const batchRequest = req.body;
        if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
            res.status(400).json({ error: '操作列表是必填字段' });
            return;
        }
        const result = await edgeFunctionsService.batchOperation(projectRef, batchRequest);
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
// 获取 Edge Function 统计信息
const getEdgeFunctionStats = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const stats = await edgeFunctionsService.getEdgeFunctionStats(projectRef);
        res.json(stats);
    }
    catch (error) {
        console.error('获取 Edge Function 统计信息失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取 Edge Function 统计信息失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getEdgeFunctionStats = getEdgeFunctionStats;
// 获取调用日志
const getInvocationLogs = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const functionId = req.params.functionId;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const logs = await edgeFunctionsService.getInvocationLogs(projectRef, functionId, limit, offset);
        res.json({ logs });
    }
    catch (error) {
        console.error('获取调用日志失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取调用日志失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getInvocationLogs = getInvocationLogs;
// 健康检查
const healthCheck = async (_req, res) => {
    res.json({
        status: 'ok',
        service: 'supabase-edge-functions',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=controller.js.map