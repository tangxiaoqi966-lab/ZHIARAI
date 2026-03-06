import { query } from './database'

// 验证项目API Key
export const verifyProjectApiKey = async (apiKey: string): Promise<{ projectId: string; schemaName: string } | null> => {
  try {
    const result = await query(
      `SELECT id, schema_name FROM platform.projects WHERE api_key = $1 AND is_active = true`,
      [apiKey]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    return {
      projectId: result.rows[0].id,
      schemaName: result.rows[0].schema_name,
    }
  } catch (error) {
    console.error('Error verifying project API key:', error)
    return null
  }
}

// 项目API Key认证中间件
export const authenticateProject = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供项目API Key' })
  }
  
  const apiKey = authHeader.substring(7)
  const projectInfo = await verifyProjectApiKey(apiKey)
  
  if (!projectInfo) {
    return res.status(401).json({ error: '无效或过期的项目API Key' })
  }
  
  req.project = projectInfo
  next()
}

// 设置数据库search_path到项目schema
export const setProjectSchema = async (schemaName: string) => {
  try {
    await query(`SET search_path TO ${schemaName}, public`)
    return true
  } catch (error) {
    console.error('Error setting project schema:', error)
    return false
  }
}

// 恢复默认search_path
export const resetSchema = async () => {
  try {
    await query(`SET search_path TO public, platform`)
    return true
  } catch (error) {
    console.error('Error resetting schema:', error)
    return false
  }
}

// 检查用户是否有权访问特定项目
export const canAccessProject = async (userId: string, projectId: string): Promise<boolean> => {
  // 在实际应用中，这里应该检查用户权限
  // 为了简化，我们假设管理员可以访问所有项目
  // 你可以在这里添加更复杂的权限逻辑
  
  // 示例：检查用户是否是项目成员
  // const result = await query(
  //   `SELECT 1 FROM project_members WHERE user_id = $1 AND project_id = $2`,
  //   [userId, projectId]
  // )
  // return result.rows.length > 0
  
  return true // 暂时允许所有认证用户访问
}