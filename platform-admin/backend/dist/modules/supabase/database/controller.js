"use strict";
/**
 * Supabase Database 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getDatabaseStats = exports.batchOperation = exports.deleteData = exports.updateData = exports.insertData = exports.queryData = exports.dropTable = exports.createTable = exports.getTableSchema = exports.listTables = exports.executeSQL = void 0;
const service_1 = require("./service");
const databaseService = new service_1.DatabaseService();
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
// 执行 SQL 查询
const executeSQL = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const sqlRequest = req.body;
        if (!sqlRequest.query) {
            res.status(400).json({ error: 'SQL 查询语句是必填字段' });
            return;
        }
        const result = await databaseService.executeSQL(projectRef, sqlRequest);
        res.json(result);
    }
    catch (error) {
        console.error('执行 SQL 查询失败:', error);
        const status = error.status || 500;
        const message = error.message || '执行 SQL 查询失败';
        res.status(status).json({ error: message, code: error.code, details: error.details });
    }
};
exports.executeSQL = executeSQL;
// 列出所有表
const listTables = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const schema = req.query.schema || 'public';
        const tables = await databaseService.listTables(projectRef, schema);
        res.json({ tables });
    }
    catch (error) {
        console.error('列出表失败:', error);
        const status = error.status || 500;
        const message = error.message || '列出表失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.listTables = listTables;
// 获取表结构
const getTableSchema = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableName = req.params.tableName;
        const schema = req.query.schema || 'public';
        if (!tableName) {
            res.status(400).json({ error: '表名是必填字段' });
            return;
        }
        const tableSchema = await databaseService.getTableSchema(projectRef, tableName, schema);
        res.json({ table: tableSchema });
    }
    catch (error) {
        console.error('获取表结构失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取表结构失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getTableSchema = getTableSchema;
// 创建表
const createTable = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableSchema = req.body;
        if (!tableSchema.name || !tableSchema.columns || tableSchema.columns.length === 0) {
            res.status(400).json({ error: '表名和列定义是必填字段' });
            return;
        }
        const result = await databaseService.createTable(projectRef, tableSchema);
        res.json(result);
    }
    catch (error) {
        console.error('创建表失败:', error);
        const status = error.status || 500;
        const message = error.message || '创建表失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.createTable = createTable;
// 删除表
const dropTable = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableName = req.params.tableName;
        const schema = req.query.schema || 'public';
        const cascade = req.query.cascade === 'true';
        if (!tableName) {
            res.status(400).json({ error: '表名是必填字段' });
            return;
        }
        const result = await databaseService.dropTable(projectRef, schema, tableName, cascade);
        res.json(result);
    }
    catch (error) {
        console.error('删除表失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除表失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.dropTable = dropTable;
// 查询数据 (PostgREST 风格)
const queryData = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableName = req.params.tableName;
        const schema = req.query.schema || 'public';
        if (!tableName) {
            res.status(400).json({ error: '表名是必填字段' });
            return;
        }
        // 解析查询参数
        const params = {
            select: req.query.select,
            where: req.query.where ? JSON.parse(req.query.where) : {},
            order: req.query.order ? JSON.parse(req.query.order) : {},
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        const result = await databaseService.queryData(projectRef, tableName, params, schema);
        res.json(result);
    }
    catch (error) {
        console.error('查询数据失败:', error);
        const status = error.status || 500;
        const message = error.message || '查询数据失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.queryData = queryData;
// 插入数据
const insertData = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableName = req.params.tableName;
        const schema = req.query.schema || 'public';
        const data = req.body;
        if (!tableName || !data) {
            res.status(400).json({ error: '表名和数据是必填字段' });
            return;
        }
        const result = await databaseService.insertData(projectRef, tableName, data, schema);
        res.json(result);
    }
    catch (error) {
        console.error('插入数据失败:', error);
        const status = error.status || 500;
        const message = error.message || '插入数据失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.insertData = insertData;
// 更新数据
const updateData = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableName = req.params.tableName;
        const schema = req.query.schema || 'public';
        const { data, where } = req.body;
        if (!tableName || !data) {
            res.status(400).json({ error: '表名和更新数据是必填字段' });
            return;
        }
        const result = await databaseService.updateData(projectRef, tableName, data, where || {}, schema);
        res.json(result);
    }
    catch (error) {
        console.error('更新数据失败:', error);
        const status = error.status || 500;
        const message = error.message || '更新数据失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.updateData = updateData;
// 删除数据
const deleteData = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const tableName = req.params.tableName;
        const schema = req.query.schema || 'public';
        const where = req.query.where ? JSON.parse(req.query.where) : {};
        if (!tableName) {
            res.status(400).json({ error: '表名是必填字段' });
            return;
        }
        const result = await databaseService.deleteData(projectRef, tableName, where, schema);
        res.json(result);
    }
    catch (error) {
        console.error('删除数据失败:', error);
        const status = error.status || 500;
        const message = error.message || '删除数据失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.deleteData = deleteData;
// 批量操作
const batchOperation = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const batchRequest = req.body;
        if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
            res.status(400).json({ error: '操作列表是必填字段' });
            return;
        }
        const result = await databaseService.batchOperation(projectRef, batchRequest);
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
// 获取数据库统计信息
const getDatabaseStats = async (req, res) => {
    try {
        const projectRef = getProjectRef(req);
        const stats = await databaseService.getDatabaseStats(projectRef);
        res.json(stats);
    }
    catch (error) {
        console.error('获取数据库统计信息失败:', error);
        const status = error.status || 500;
        const message = error.message || '获取数据库统计信息失败';
        res.status(status).json({ error: message, code: error.code });
    }
};
exports.getDatabaseStats = getDatabaseStats;
// 健康检查
const healthCheck = async (_req, res) => {
    res.json({
        status: 'ok',
        service: 'supabase-database',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=controller.js.map