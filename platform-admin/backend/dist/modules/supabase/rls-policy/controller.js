"use strict";
/**
 * Supabase RLS Policy 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getPolicyStats = exports.batchOperation = exports.disablePolicy = exports.enablePolicy = exports.deletePolicy = exports.updatePolicy = exports.createPolicy = exports.getPolicy = exports.listPolicies = void 0;
const service_1 = require("./service");
const policyService = new service_1.RLSPolicyService();
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
// 列出策略
const listPolicies = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const params = {
            schema: req.query.schema,
            table: req.query.table,
            command: req.query.command,
            enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        const policies = await policyService.listPolicies(projectRef, params);
        res.json({ policies });
    }
    catch (error) {
        console.error('列出策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '列出策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.listPolicies = listPolicies;
// 获取单个策略
const getPolicy = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const policyId = req.params.policyId;
        if (!policyId) {
            res.status(400).json({ error: '策略 ID 是必填字段' });
            return;
        }
        const policy = await policyService.getPolicy(projectRef, policyId);
        res.json(policy);
    }
    catch (error) {
        console.error('获取策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getPolicy = getPolicy;
// 创建策略
const createPolicy = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const policyRequest = req.body;
        const userId = getUserId(req);
        if (!policyRequest.name || !policyRequest.table || !policyRequest.command || !policyRequest.definition) {
            res.status(400).json({ error: '名称、表、命令和定义是必填字段' });
            return;
        }
        const policy = await policyService.createPolicy(projectRef, policyRequest, userId);
        res.status(201).json(policy);
    }
    catch (error) {
        console.error('创建策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '创建策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.createPolicy = createPolicy;
// 更新策略
const updatePolicy = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const policyId = req.params.policyId;
        const policyRequest = req.body;
        const userId = getUserId(req);
        if (!policyId) {
            res.status(400).json({ error: '策略 ID 是必填字段' });
            return;
        }
        const policy = await policyService.updatePolicy(projectRef, policyId, policyRequest, userId);
        res.json(policy);
    }
    catch (error) {
        console.error('更新策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '更新策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.updatePolicy = updatePolicy;
// 删除策略
const deletePolicy = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const policyId = req.params.policyId;
        if (!policyId) {
            res.status(400).json({ error: '策略 ID 是必填字段' });
            return;
        }
        await policyService.deletePolicy(projectRef, policyId);
        res.status(204).send();
    }
    catch (error) {
        console.error('删除策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deletePolicy = deletePolicy;
// 启用策略
const enablePolicy = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const policyId = req.params.policyId;
        const userId = getUserId(req);
        if (!policyId) {
            res.status(400).json({ error: '策略 ID 是必填字段' });
            return;
        }
        const policy = await policyService.enablePolicy(projectRef, policyId, userId);
        res.json(policy);
    }
    catch (error) {
        console.error('启用策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '启用策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.enablePolicy = enablePolicy;
// 禁用策略
const disablePolicy = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const policyId = req.params.policyId;
        const userId = getUserId(req);
        if (!policyId) {
            res.status(400).json({ error: '策略 ID 是必填字段' });
            return;
        }
        const policy = await policyService.disablePolicy(projectRef, policyId, userId);
        res.json(policy);
    }
    catch (error) {
        console.error('禁用策略失败:', error);
        const status = error.status || 500;
        const message = error.message || '禁用策略失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.disablePolicy = disablePolicy;
// 批量操作
const batchOperation = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const batchRequest = req.body;
        if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
            res.status(400).json({ error: '操作列表是必填字段' });
            return;
        }
        const result = await policyService.batchOperation(projectRef, batchRequest);
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
// 获取策略统计信息
const getPolicyStats = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const stats = await policyService.getPolicyStats(projectRef);
        res.json(stats);
    }
    catch (error) {
        console.error('获取策略统计信息失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取策略统计信息失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getPolicyStats = getPolicyStats;
// 健康检查
const healthCheck = async (_req, res) => {
    res.json({
        status: 'ok',
        service: 'supabase-rls-policy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=controller.js.map