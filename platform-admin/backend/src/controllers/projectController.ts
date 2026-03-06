import { Request, Response } from 'express'
import { query } from '../utils/database'
import { v4 as uuidv4 } from 'uuid'

// Get all projects
export const getProjects = async (req: Request, res: Response) => {
  try {
    const result = await query(`
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
    `)
    
    res.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get single project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const result = await query(
      `SELECT * FROM platform.projects WHERE id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error fetching project:', error)
    res.status(500).json({ error: error.message })
  }
}

// Create new project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, schema_name: customSchemaName } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    
    // Generate schema name if not provided
    const schemaName = customSchemaName || `project_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    const apiKey = uuidv4()
    
    // Use the PostgreSQL function we created earlier
    const result = await query(
      `SELECT platform.create_project_schema($1, $2, $3) as project_id`,
      [name, schemaName, apiKey]
    )
    
    const projectId = result.rows[0].project_id
    
    // Get the created project
    const projectResult = await query(
      `SELECT * FROM platform.projects WHERE id = $1`,
      [projectId]
    )
    
    res.status(201).json(projectResult.rows[0])
  } catch (error: any) {
    console.error('Error creating project:', error)
    
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      return res.status(409).json({ error: 'Schema name or API key already exists' })
    }
    
    res.status(500).json({ error: error.message })
  }
}

// Delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { confirm } = req.body
    
    if (!confirm || confirm !== 'DELETE') {
      return res.status(400).json({ 
        error: 'Deletion requires confirmation. Send {"confirm": "DELETE"} in request body.' 
      })
    }
    
    const result = await query(
      `SELECT platform.delete_project_schema($1) as success`,
      [id]
    )
    
    const success = result.rows[0].success
    
    if (!success) {
      return res.status(404).json({ error: 'Project not found or deletion failed' })
    }
    
    res.json({ success: true, message: 'Project deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: error.message })
  }
}

// Update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, is_active: isActive, api_key: newApiKey } = req.body
    
    const updateFields = []
    const queryParams = [id]
    let paramIndex = 2
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      queryParams.push(name)
      paramIndex++
    }
    
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`)
      queryParams.push(isActive)
      paramIndex++
    }
    
    if (newApiKey !== undefined) {
      updateFields.push(`api_key = $${paramIndex}`)
      queryParams.push(newApiKey)
      paramIndex++
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    const updateQuery = `
      UPDATE platform.projects 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    
    const result = await query(updateQuery, queryParams)
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: error.message })
  }
}

// Generate new API key for project
export const generateApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const newApiKey = uuidv4()
    
    const result = await query(
      `UPDATE platform.projects SET api_key = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newApiKey, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error generating API key:', error)
    res.status(500).json({ error: error.message })
  }
}