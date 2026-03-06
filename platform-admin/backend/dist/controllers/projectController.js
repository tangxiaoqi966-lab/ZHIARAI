"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = exports.updateProject = exports.deleteProject = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const database_1 = require("../utils/database");
const uuid_1 = require("uuid");
// Get all projects
const getProjects = async (req, res) => {
    try {
        const result = await (0, database_1.query)(`
      SELECT 
        p.id,
        p.name,
        p.schema_name,
        p.api_key,
        p.created_at,
        p.updated_at,
        p.is_active,
        COUNT(m.id) as migration_count,
        MAX(m.executed_at) as last_migration_at
      FROM platform.projects p
      LEFT JOIN platform.migrations m ON p.id = m.project_id
      GROUP BY p.id, p.name, p.schema_name, p.api_key, p.created_at, p.updated_at, p.is_active
      ORDER BY p.created_at DESC
    `);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getProjects = getProjects;
// Get single project by ID
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, database_1.query)(`SELECT * FROM platform.projects WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getProjectById = getProjectById;
// Create new project
const createProject = async (req, res) => {
    try {
        const { name, schema_name: customSchemaName } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }
        // Generate schema name if not provided
        const schemaName = customSchemaName || `project_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const apiKey = (0, uuid_1.v4)();
        // Use the PostgreSQL function we created earlier
        const result = await (0, database_1.query)(`SELECT platform.create_project_schema($1, $2, $3) as project_id`, [name, schemaName, apiKey]);
        const projectId = result.rows[0].project_id;
        // Get the created project
        const projectResult = await (0, database_1.query)(`SELECT * FROM platform.projects WHERE id = $1`, [projectId]);
        res.status(201).json(projectResult.rows[0]);
    }
    catch (error) {
        console.error('Error creating project:', error);
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            return res.status(409).json({ error: 'Schema name or API key already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};
exports.createProject = createProject;
// Delete project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirm } = req.body;
        if (!confirm || confirm !== 'DELETE') {
            return res.status(400).json({
                error: 'Deletion requires confirmation. Send {"confirm": "DELETE"} in request body.'
            });
        }
        const result = await (0, database_1.query)(`SELECT platform.delete_project_schema($1) as success`, [id]);
        const success = result.rows[0].success;
        if (!success) {
            return res.status(404).json({ error: 'Project not found or deletion failed' });
        }
        res.json({ success: true, message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.deleteProject = deleteProject;
// Update project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, is_active: isActive, api_key: newApiKey } = req.body;
        const updateFields = [];
        const queryParams = [id];
        let paramIndex = 2;
        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex}`);
            queryParams.push(name);
            paramIndex++;
        }
        if (isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex}`);
            queryParams.push(isActive);
            paramIndex++;
        }
        if (newApiKey !== undefined) {
            updateFields.push(`api_key = $${paramIndex}`);
            queryParams.push(newApiKey);
            paramIndex++;
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        const updateQuery = `
      UPDATE platform.projects 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const result = await (0, database_1.query)(updateQuery, queryParams);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.updateProject = updateProject;
// Generate new API key for project
const generateApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const newApiKey = (0, uuid_1.v4)();
        const result = await (0, database_1.query)(`UPDATE platform.projects SET api_key = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [newApiKey, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error generating API key:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.generateApiKey = generateApiKey;
//# sourceMappingURL=projectController.js.map