"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationById = exports.createMigration = exports.getMigrations = void 0;
const database_1 = require("../utils/database");
// 获取迁移列表
const getMigrations = async (req, res) => {
    try {
        const { project_id: projectId, schema_name: schemaName, limit = 50 } = req.query;
        let sql = `
      SELECT 
        m.id,
        m.project_id,
        m.schema_name,
        m.migration_sql,
        m.executed_at,
        m.version,
        m.description,
        p.name as project_name
      FROM platform.migrations m
      JOIN platform.projects p ON m.project_id = p.id
    `;
        const params = [];
        const conditions = [];
        if (projectId) {
            conditions.push(`m.project_id = $${params.length + 1}`);
            params.push(projectId);
        }
        if (schemaName) {
            conditions.push(`m.schema_name = $${params.length + 1}`);
            params.push(schemaName);
        }
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        sql += ` ORDER BY m.executed_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const result = await (0, database_1.query)(sql, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching migrations:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getMigrations = getMigrations;
// 创建迁移
const createMigration = async (req, res) => {
    try {
        const { project_id: projectId, migration_sql: migrationSql, description } = req.body;
        if (!projectId || !migrationSql) {
            return res.status(400).json({
                error: 'project_id and migration_sql are required'
            });
        }
        if (typeof migrationSql !== 'string' || migrationSql.trim().length === 0) {
            return res.status(400).json({
                error: 'migration_sql must be a non-empty string'
            });
        }
        // 验证项目是否存在
        const projectCheck = await (0, database_1.query)(`SELECT schema_name FROM platform.projects WHERE id = $1`, [projectId]);
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const schemaName = projectCheck.rows[0].schema_name;
        // 执行迁移SQL
        // 注意：这里需要谨慎处理，确保SQL安全
        // 在实际生产环境中，应该添加更多的验证和安全检查
        try {
            // 设置search_path到目标schema
            await (0, database_1.query)(`SET search_path TO ${schemaName}, public`);
            // 执行迁移SQL
            await (0, database_1.query)(migrationSql, []);
            // 恢复search_path
            await (0, database_1.query)(`SET search_path TO public, platform`);
        }
        catch (sqlError) {
            console.error('Migration SQL error:', sqlError);
            return res.status(400).json({
                error: `SQL execution failed: ${sqlError.message}`
            });
        }
        // 记录迁移历史
        const result = await (0, database_1.query)(`INSERT INTO platform.migrations (project_id, schema_name, migration_sql, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [projectId, schemaName, migrationSql, description || null]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error creating migration:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.createMigration = createMigration;
// 获取单个迁移
const getMigrationById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, database_1.query)(`SELECT 
         m.*,
         p.name as project_name
       FROM platform.migrations m
       JOIN platform.projects p ON m.project_id = p.id
       WHERE m.id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Migration not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching migration:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getMigrationById = getMigrationById;
//# sourceMappingURL=migrationController.js.map