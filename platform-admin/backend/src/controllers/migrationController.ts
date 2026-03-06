import { Request, Response } from 'express'
import { query } from '../utils/database'

// 获取迁移列表
export const getMigrations = async (req: Request, res: Response) => {
  try {
    const { project_id: projectId, schema_name: schemaName, limit = 50 } = req.query
    
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
    `
    
    const params = []
    const conditions = []
    
    if (projectId) {
      conditions.push(`m.project_id = $${params.length + 1}`)
      params.push(projectId)
    }
    
    if (schemaName) {
      conditions.push(`m.schema_name = $${params.length + 1}`)
      params.push(schemaName)
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    
    sql += ` ORDER BY m.executed_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    
    const result = await query(sql, params)
    
    res.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching migrations:', error)
    res.status(500).json({ error: error.message })
  }
}

// 创建迁移
export const createMigration = async (req: Request, res: Response) => {
  try {
    const { project_id: projectId, migration_sql: migrationSql, description } = req.body
    
    if (!projectId || !migrationSql) {
      return res.status(400).json({ 
        error: 'project_id and migration_sql are required' 
      })
    }
    
    if (typeof migrationSql !== 'string' || migrationSql.trim().length === 0) {
      return res.status(400).json({ 
        error: 'migration_sql must be a non-empty string' 
      })
    }
    
    // 验证项目是否存在
    const projectCheck = await query(
      `SELECT schema_name FROM platform.projects WHERE id = $1`,
      [projectId]
    )
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const schemaName = projectCheck.rows[0].schema_name
    
    // 执行迁移SQL
    // 注意：这里需要谨慎处理，确保SQL安全
    // 在实际生产环境中，应该添加更多的验证和安全检查
    try {
      // 设置search_path到目标schema
      await query(`SET search_path TO ${schemaName}, public`)
      
      // 执行迁移SQL
      await query(migrationSql, [])
      
      // 恢复search_path
      await query(`SET search_path TO public, platform`)
    } catch (sqlError: any) {
      console.error('Migration SQL error:', sqlError)
      return res.status(400).json({ 
        error: `SQL execution failed: ${sqlError.message}` 
      })
    }
    
    // 记录迁移历史
    const result = await query(
      `INSERT INTO platform.migrations (project_id, schema_name, migration_sql, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [projectId, schemaName, migrationSql, description || null]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('Error creating migration:', error)
    res.status(500).json({ error: error.message })
  }
}

// 获取单个迁移
export const getMigrationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const result = await query(
      `SELECT 
         m.*,
         p.name as project_name
       FROM platform.migrations m
       JOIN platform.projects p ON m.project_id = p.id
       WHERE m.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Migration not found' })
    }
    
    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error fetching migration:', error)
    res.status(500).json({ error: error.message })
  }
}