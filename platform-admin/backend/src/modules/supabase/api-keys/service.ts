/**
 * Supabase API Keys 服务
 * 提供 API 密钥管理功能，与官方 Supabase API Keys 完全兼容
 */

import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import { config } from 'dotenv'
import {
  ApiKey,
  ApiKeyType,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ListApiKeysParams,
  ListApiKeysResponse,
  RotateApiKeyRequest,
  RotateApiKeyResponse,
  ValidateApiKeyRequest,
  ValidateApiKeyResponse,
  API_KEY_ERRORS,
  DEFAULT_PERMISSIONS,
  ApiKeyPermissions
} from './types'

config()

// 数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'supabase_platform_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

// 生成安全的 API 密钥
function generateApiKey(keyType: ApiKeyType = 'supabase_key'): string {
  const prefix = keyType === 'service_role' ? 'sbp_' : 'sb_'
  const randomPart = Buffer.from(uuidv4().replace(/-/g, '')).toString('base64').slice(0, 32)
  return prefix + randomPart
}

// 转换数据库行到 API 密钥对象
function rowToApiKey(row: any): ApiKey {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    key: row.key,
    key_type: row.key_type,
    permissions: row.permissions || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at,
    last_used_at: row.last_used_at,
    is_active: row.is_active,
    description: row.description
  }
}

export class ApiKeyService {
  // 获取项目ID
  private async getProjectId(projectRef: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT project_id FROM supabase.project_metadata WHERE supabase_project_ref = $1',
        [projectRef]
      )
      return result.rows[0]?.project_id || null
    } catch (error) {
      console.error('获取项目ID失败:', error)
      return null
    }
  }



  // 列出所有 API 密钥
  async listApiKeys(projectRef: string, params: ListApiKeysParams = {}): Promise<ListApiKeysResponse> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw API_KEY_ERRORS.PROJECT_NOT_FOUND
      }

      const { page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc', filter = '', key_type, is_active } = params
      const offset = (page - 1) * per_page

      let query = `
        SELECT *, COUNT(*) OVER() as total_count 
        FROM supabase.api_keys 
        WHERE project_id = $1
      `
      const queryParams: any[] = [projectId]

      let paramIndex = 2

      if (filter) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
        queryParams.push(`%${filter}%`)
        paramIndex++
      }

      if (key_type) {
        query += ` AND key_type = $${paramIndex}`
        queryParams.push(key_type)
        paramIndex++
      }

      if (is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`
        queryParams.push(is_active)
        paramIndex++
      }

      query += ` ORDER BY ${sort_by} ${sort_order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      queryParams.push(per_page, offset)

      const result = await pool.query(query, queryParams)
      const total = parseInt(result.rows[0]?.total_count || '0')

      const api_keys: ApiKey[] = result.rows.map(rowToApiKey)

      return {
        api_keys,
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page)
      }
    } catch (error) {
      console.error('列出 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'LIST_API_KEYS_FAILED', message: '获取 API 密钥列表失败', status: 500, details: error }
    }
  }

  // 获取单个 API 密钥
  async getApiKeyById(projectRef: string, apiKeyId: string): Promise<ApiKey> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw API_KEY_ERRORS.PROJECT_NOT_FOUND
      }

      const result = await pool.query(
        'SELECT * FROM supabase.api_keys WHERE id = $1 AND project_id = $2',
        [apiKeyId, projectId]
      )

      if (result.rows.length === 0) {
        throw API_KEY_ERRORS.NOT_FOUND
      }

      return rowToApiKey(result.rows[0])
    } catch (error) {
      console.error('获取 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'GET_API_KEY_FAILED', message: '获取 API 密钥失败', status: 500 }
    }
  }

  // 通过密钥值获取 API 密钥
  async getApiKeyByKey(key: string, projectRef?: string): Promise<ApiKey> {
    try {
      let query = 'SELECT * FROM supabase.api_keys WHERE key = $1'
      const queryParams: any[] = [key]

      if (projectRef) {
        const projectId = await this.getProjectId(projectRef)
        if (!projectId) {
          throw API_KEY_ERRORS.PROJECT_NOT_FOUND
        }
        query += ' AND project_id = $2'
        queryParams.push(projectId)
      }

      const result = await pool.query(query, queryParams)

      if (result.rows.length === 0) {
        throw API_KEY_ERRORS.NOT_FOUND
      }

      return rowToApiKey(result.rows[0])
    } catch (error) {
      console.error('通过密钥值获取 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'GET_API_KEY_BY_KEY_FAILED', message: '通过密钥值获取 API 密钥失败', status: 500 }
    }
  }

  // 创建 API 密钥
  async createApiKey(
    projectRef: string,
    keyData: CreateApiKeyRequest,
    _createdBy: string,
    _ipAddress?: string,
    _userAgent?: string
  ): Promise<ApiKey> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw API_KEY_ERRORS.PROJECT_NOT_FOUND
      }

      // 检查名称是否已存在
      const existingKey = await client.query(
        'SELECT id FROM supabase.api_keys WHERE project_id = $1 AND name = $2',
        [projectId, keyData.name]
      )

      if (existingKey.rows.length > 0) {
        throw API_KEY_ERRORS.ALREADY_EXISTS
      }

      const apiKeyId = uuidv4()
      const now = new Date().toISOString()
      
      // 生成密钥
      const keyValue = generateApiKey(keyData.key_type)
      
      // 使用默认权限或提供的权限
      const permissions = keyData.permissions || DEFAULT_PERMISSIONS[keyData.key_type] || []

      const result = await client.query(
        `INSERT INTO supabase.api_keys (
          id, project_id, name, key, key_type, permissions,
          created_at, updated_at, expires_at, is_active, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          apiKeyId,
          projectId,
          keyData.name,
          keyValue,
          keyData.key_type,
          JSON.stringify(permissions),
          now,
          now,
          keyData.expires_at || null,
          true,
          keyData.description || null
        ]
      )

      await client.query('COMMIT')

      // TODO: 记录审计日志
      // await logAuditEvent(projectId, createdBy, API_KEY_ACTIONS.CREATE, 'api_key', apiKeyId, null, rowToApiKey(result.rows[0]), ipAddress, userAgent)

      return rowToApiKey(result.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('创建 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'CREATE_API_KEY_FAILED', message: '创建 API 密钥失败', status: 500 }
    } finally {
      client.release()
    }
  }

  // 更新 API 密钥
  async updateApiKey(
    projectRef: string,
    apiKeyId: string,
    keyData: UpdateApiKeyRequest,
    _updatedBy: string,
    _ipAddress?: string,
    _userAgent?: string
  ): Promise<ApiKey> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw API_KEY_ERRORS.PROJECT_NOT_FOUND
      }

      // 获取现有密钥
      const existingKey = await client.query(
        'SELECT * FROM supabase.api_keys WHERE id = $1 AND project_id = $2',
        [apiKeyId, projectId]
      )

      if (existingKey.rows.length === 0) {
        throw API_KEY_ERRORS.NOT_FOUND
      }

      const _oldKey = rowToApiKey(existingKey.rows[0]); void _oldKey; // @ts-ignore
      const now = new Date().toISOString()

      // 构建更新字段
      const updateFields: string[] = ['updated_at = $1']
      const updateValues: any[] = [now]
      let paramIndex = 2

      if (keyData.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`)
        updateValues.push(keyData.name)
        paramIndex++
      }

      if (keyData.permissions !== undefined) {
        updateFields.push(`permissions = $${paramIndex}`)
        updateValues.push(JSON.stringify(keyData.permissions))
        paramIndex++
      }

      if (keyData.expires_at !== undefined) {
        updateFields.push(`expires_at = $${paramIndex}`)
        updateValues.push(keyData.expires_at)
        paramIndex++
      }

      if (keyData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`)
        updateValues.push(keyData.is_active)
        paramIndex++
      }

      if (keyData.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`)
        updateValues.push(keyData.description)
        paramIndex++
      }

      updateValues.push(apiKeyId, projectId)

      const result = await client.query(
        `UPDATE supabase.api_keys 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex} AND project_id = $${paramIndex + 1}
         RETURNING *`,
        updateValues
      )

      await client.query('COMMIT')

      const newKey = rowToApiKey(result.rows[0])

      // TODO: 记录审计日志
      // await logAuditEvent(projectId, updatedBy, API_KEY_ACTIONS.UPDATE, 'api_key', apiKeyId, oldKey, newKey, ipAddress, userAgent)

      return newKey
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('更新 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'UPDATE_API_KEY_FAILED', message: '更新 API 密钥失败', status: 500 }
    } finally {
      client.release()
    }
  }

  // 删除 API 密钥
  async deleteApiKey(
    projectRef: string,
    apiKeyId: string,
    _deletedBy: string,
    _ipAddress?: string,
    _userAgent?: string
  ): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw API_KEY_ERRORS.PROJECT_NOT_FOUND
      }

      // 获取现有密钥
      const existingKey = await client.query(
        'SELECT * FROM supabase.api_keys WHERE id = $1 AND project_id = $2',
        [apiKeyId, projectId]
      )

      if (existingKey.rows.length === 0) {
        throw API_KEY_ERRORS.NOT_FOUND
      }

      const _oldKey = rowToApiKey(existingKey.rows[0]); void _oldKey; // @ts-ignore

      await client.query(
        'DELETE FROM supabase.api_keys WHERE id = $1 AND project_id = $2',
        [apiKeyId, projectId]
      )

      await client.query('COMMIT')

      // TODO: 记录审计日志
      // await logAuditEvent(projectId, deletedBy, API_KEY_ACTIONS.DELETE, 'api_key', apiKeyId, oldKey, null, ipAddress, userAgent)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('删除 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'DELETE_API_KEY_FAILED', message: '删除 API 密钥失败', status: 500 }
    } finally {
      client.release()
    }
  }

  // 轮换 API 密钥
  async rotateApiKey(
    projectRef: string,
    apiKeyId: string,
    rotationData: RotateApiKeyRequest = {},
    _rotatedBy: string,
    _ipAddress?: string,
    _userAgent?: string
  ): Promise<RotateApiKeyResponse> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw API_KEY_ERRORS.PROJECT_NOT_FOUND
      }

      // 获取现有密钥
      const existingKey = await client.query(
        'SELECT * FROM supabase.api_keys WHERE id = $1 AND project_id = $2',
        [apiKeyId, projectId]
      )

      if (existingKey.rows.length === 0) {
        throw API_KEY_ERRORS.NOT_FOUND
      }

      const oldKey = rowToApiKey(existingKey.rows[0])
      const now = new Date().toISOString()

      // 生成新密钥
      const newKeyValue = generateApiKey(oldKey.key_type)
      const newKeyName = rotationData.new_key_name || `${oldKey.name} (轮换 ${new Date().toISOString().slice(0, 10)})`

      // 创建新密钥
      const newKeyId = uuidv4()
      const newKeyResult = await client.query(
        `INSERT INTO supabase.api_keys (
          id, project_id, name, key, key_type, permissions,
          created_at, updated_at, expires_at, is_active, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          newKeyId,
          projectId,
          newKeyName,
          newKeyValue,
          oldKey.key_type,
          JSON.stringify(oldKey.permissions),
          now,
          now,
          oldKey.expires_at,
          true,
          oldKey.description
        ]
      )

      const newKey = rowToApiKey(newKeyResult.rows[0])

      // 处理旧密钥
      let oldKeyAfterRotation: ApiKey | null = null
      if (rotationData.keep_old_key) {
        if (rotationData.invalidate_old_key) {
          // 禁用旧密钥
          const invalidatedKeyResult = await client.query(
            'UPDATE supabase.api_keys SET is_active = false, updated_at = $1 WHERE id = $2 RETURNING *',
            [now, apiKeyId]
          )
          oldKeyAfterRotation = rowToApiKey(invalidatedKeyResult.rows[0])
        } else {
          oldKeyAfterRotation = oldKey
        }
      } else {
        // 删除旧密钥
        await client.query(
          'DELETE FROM supabase.api_keys WHERE id = $1',
          [apiKeyId]
        )
      }

      await client.query('COMMIT')

      // TODO: 记录审计日志
      // await logAuditEvent(projectId, rotatedBy, API_KEY_ACTIONS.ROTATE, 'api_key', apiKeyId, oldKey, newKey, ipAddress, userAgent)

      return {
        old_key: oldKeyAfterRotation,
        new_key: newKey,
        rotation_date: now
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('轮换 API 密钥失败:', error)
      throw (error as any).code ? error : { code: 'ROTATE_API_KEY_FAILED', message: '轮换 API 密钥失败', status: 500 }
    } finally {
      client.release()
    }
  }

  // 验证 API 密钥
  async validateApiKey(validateData: ValidateApiKeyRequest): Promise<ValidateApiKeyResponse> {
    try {
      const { key, required_permissions = [], project_ref } = validateData

      // 获取密钥信息
      let apiKey: ApiKey
      try {
        apiKey = await this.getApiKeyByKey(key, project_ref)
      } catch (error) {
        return {
          valid: false,
          api_key: null,
          has_permission: false,
          missing_permissions: required_permissions,
          message: 'API 密钥无效或不存在'
        }
      }

      // 检查是否激活
      if (!apiKey.is_active) {
        return {
          valid: false,
          api_key: apiKey,
          has_permission: false,
          missing_permissions: required_permissions,
          message: 'API 密钥已禁用'
        }
      }

      // 检查是否过期
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        return {
          valid: false,
          api_key: apiKey,
          has_permission: false,
          missing_permissions: required_permissions,
          message: 'API 密钥已过期'
        }
      }

      // 检查权限
      const hasPermission = this.checkPermissions(apiKey.permissions, required_permissions)

      // 更新最后使用时间
      if (apiKey.id) {
        await pool.query(
          'UPDATE supabase.api_keys SET last_used_at = $1 WHERE id = $2',
          [new Date().toISOString(), apiKey.id]
        )
      }

      return {
        valid: true,
        api_key: apiKey,
        has_permission: hasPermission,
        missing_permissions: hasPermission ? [] : required_permissions,
        message: hasPermission ? 'API 密钥验证成功' : '权限不足'
      }
    } catch (error) {
      console.error('验证 API 密钥失败:', error)
      return {
        valid: false,
        api_key: null,
        has_permission: false,
        missing_permissions: validateData.required_permissions || [],
        message: 'API 密钥验证失败'
      }
    }
  }

  // 检查权限
  private checkPermissions(keyPermissions: ApiKeyPermissions[], requiredPermissions: string[]): boolean {
    if (requiredPermissions.length === 0) {
      return true
    }

    // 将密钥权限扁平化
    const flattenedPermissions: Record<string, boolean> = {}
    keyPermissions.forEach(permissionSet => {
      Object.entries(permissionSet).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          flattenedPermissions[key] = value
        }
      })
    })

    // 检查是否满足所有所需权限
    return requiredPermissions.every(perm => flattenedPermissions[perm] === true)
  }

  // 撤销 API 密钥 (设置为不激活)
  async revokeApiKey(
    projectRef: string,
    apiKeyId: string,
    revokedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApiKey> {
    return this.updateApiKey(
      projectRef,
      apiKeyId,
      { is_active: false },
      revokedBy,
      ipAddress,
      userAgent
    )
  }

  // 启用 API 密钥
  async enableApiKey(
    projectRef: string,
    apiKeyId: string,
    enabledBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApiKey> {
    return this.updateApiKey(
      projectRef,
      apiKeyId,
      { is_active: true },
      enabledBy,
      ipAddress,
      userAgent
    )
  }
}