"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCustomQuery = exports.deleteProjectData = exports.updateProjectData = exports.insertProjectData = exports.queryProjectData = void 0;
const database_1 = require("../utils/database");
const projectAuth_1 = require("../utils/projectAuth");
// 获取项目数据（通用查询）
const queryProjectData = async (req, res) => {
    const { table } = req.params;
    const { limit = 100, offset = 0, ...filters } = req.query;
    if (!req.project) {
        return res.status(401).json({ error: '项目未认证' });
    }
    try {
        // 设置项目schema
        await (0, projectAuth_1.setProjectSchema)(req.project.schemaName);
        // 构建查询
        let sql = `SELECT * FROM ${table}`;
        const params = [];
        const conditions = [];
        // 添加过滤条件
        Object.entries(filters).forEach(([key, value], index) => {
            if (value !== undefined && value !== '') {
                conditions.push(`${key} = $${index + 1}`);
                params.push(value);
            }
        });
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        // 执行查询
        const result = await (0, database_1.query)(sql, params);
        // 恢复默认schema
        await (0, projectAuth_1.resetSchema)();
        res.json({
            data: result.rows,
            total: result.rowCount,
            limit,
            offset,
        });
    }
    catch (error) {
        // 确保恢复schema
        await (0, projectAuth_1.resetSchema)().catch(() => { });
        if (error.message.includes('does not exist')) {
            return res.status(404).json({ error: `表 ${table} 不存在` });
        }
        console.error('Query project data error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.queryProjectData = queryProjectData;
// 插入项目数据
const insertProjectData = async (req, res) => {
    const { table } = req.params;
    const data = req.body;
    if (!req.project) {
        return res.status(401).json({ error: '项目未认证' });
    }
    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: '无效的数据' });
    }
    try {
        // 设置项目schema
        await (0, projectAuth_1.setProjectSchema)(req.project.schemaName);
        // 构建插入语句
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`);
        const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
        // 执行插入
        const result = await (0, database_1.query)(sql, values);
        // 恢复默认schema
        await (0, projectAuth_1.resetSchema)();
        res.status(201).json({
            data: result.rows[0],
            message: '数据插入成功',
        });
    }
    catch (error) {
        // 确保恢复schema
        await (0, projectAuth_1.resetSchema)().catch(() => { });
        console.error('Insert project data error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.insertProjectData = insertProjectData;
// 更新项目数据
const updateProjectData = async (req, res) => {
    const { table, id } = req.params;
    const data = req.body;
    if (!req.project) {
        return res.status(401).json({ error: '项目未认证' });
    }
    if (!id) {
        return res.status(400).json({ error: '需要指定记录ID' });
    }
    try {
        // 设置项目schema
        await (0, projectAuth_1.setProjectSchema)(req.project.schemaName);
        // 构建更新语句
        const updates = Object.keys(data).map((key, index) => `${key} = $${index + 1}`);
        const values = Object.values(data);
        values.push(id); // id作为最后一个参数
        const sql = `
      UPDATE ${table}
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;
        // 执行更新
        const result = await (0, database_1.query)(sql, values);
        if (result.rowCount === 0) {
            // 恢复默认schema
            await (0, projectAuth_1.resetSchema)();
            return res.status(404).json({ error: '记录未找到' });
        }
        // 恢复默认schema
        await (0, projectAuth_1.resetSchema)();
        res.json({
            data: result.rows[0],
            message: '数据更新成功',
        });
    }
    catch (error) {
        // 确保恢复schema
        await (0, projectAuth_1.resetSchema)().catch(() => { });
        console.error('Update project data error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.updateProjectData = updateProjectData;
// 删除项目数据
const deleteProjectData = async (req, res) => {
    const { table, id } = req.params;
    if (!req.project) {
        return res.status(401).json({ error: '项目未认证' });
    }
    if (!id) {
        return res.status(400).json({ error: '需要指定记录ID' });
    }
    try {
        // 设置项目schema
        await (0, projectAuth_1.setProjectSchema)(req.project.schemaName);
        const sql = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
        const result = await (0, database_1.query)(sql, [id]);
        if (result.rowCount === 0) {
            // 恢复默认schema
            await (0, projectAuth_1.resetSchema)();
            return res.status(404).json({ error: '记录未找到' });
        }
        // 恢复默认schema
        await (0, projectAuth_1.resetSchema)();
        res.json({
            data: result.rows[0],
            message: '数据删除成功',
        });
    }
    catch (error) {
        // 确保恢复schema
        await (0, projectAuth_1.resetSchema)().catch(() => { });
        console.error('Delete project data error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.deleteProjectData = deleteProjectData;
// 执行自定义SQL查询（谨慎使用）
const executeCustomQuery = async (req, res) => {
    const { sql } = req.body;
    if (!req.project) {
        return res.status(401).json({ error: '项目未认证' });
    }
    if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: '需要有效的SQL语句' });
    }
    // 安全检查：防止危险的SQL操作
    const dangerousKeywords = ['DROP', 'TRUNCATE', 'DELETE FROM', 'UPDATE', 'ALTER', 'GRANT', 'REVOKE'];
    const upperSql = sql.toUpperCase();
    if (dangerousKeywords.some(keyword => upperSql.includes(keyword))) {
        return res.status(400).json({
            error: '不允许执行包含危险操作的SQL语句',
            dangerousKeywords
        });
    }
    try {
        // 设置项目schema
        await (0, projectAuth_1.setProjectSchema)(req.project.schemaName);
        // 执行查询
        const result = await (0, database_1.query)(sql, []);
        // 恢复默认schema
        await (0, projectAuth_1.resetSchema)();
        res.json({
            data: result.rows,
            rowCount: result.rowCount,
            message: '查询执行成功',
        });
    }
    catch (error) {
        // 确保恢复schema
        await (0, projectAuth_1.resetSchema)().catch(() => { });
        console.error('Execute custom query error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.executeCustomQuery = executeCustomQuery;
//# sourceMappingURL=projectDataController.js.map