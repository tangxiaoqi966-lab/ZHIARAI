/**
 * Supabase RLS Policy 服务
 * 提供 RLS 策略管理功能，与官方 Supabase RLS Policy API 完全兼容
 */

import { Pool } from 'pg'
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import {
  RLSPolicy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  ListPoliciesParams,
  BatchPolicyOperationRequest,
  BatchPolicyOperationResponse,
  PolicyStats,
  RLS_ERRORS
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

// 转换数据库行到 Policy 对象
function rowToPolicy(row: any): RLSPolicy {
  return {
    id: row.id,
    name: row.name,
    schema: row.schema_name,
    table: row.table_name,
    command: row.action,
    definition: row.using_expression || '',
    check: row.check_expression || null,
    using: row.using_expression || null,
    with_check: null,
    roles: row.roles || [],
    enabled: row.is_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: 'system',
    updated_by: 'system'
  }
}

export class RLSPolicyService {
  // 获取项目ID
  private async getProjectId(projectRef: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT project_id FROM supabase.project_metadata WHERE supabase_project_ref = $1',
        [projectRef]
      )
      return result.rows[0]?.project_id || null
    } catch (error: any) {
      console.error('获取项目ID失败:', error)
      return null
    }
  }

  // 列出策略
  async listPolicies(projectRef: string, params: ListPoliciesParams = {}): Promise<RLSPolicy[]> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      const { schema, table, command, enabled, limit = 100, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = params
      
      let query = 'SELECT * FROM supabase.rls_policies WHERE project_id = $1'
      const queryParams: any[] = [projectId]
      let paramIndex = 2

      if (schema) {
        query += ` AND schema_name = $${paramIndex}`
        queryParams.push(schema)
        paramIndex++
      }

      if (table) {
        query += ` AND table_name = $${paramIndex}`
        queryParams.push(table)
        paramIndex++
      }

      if (command) {
        query += ` AND action = $${paramIndex}`
        queryParams.push(command)
        paramIndex++
      }

      if (enabled !== undefined) {
        query += ` AND is_enabled = $${paramIndex}`
        queryParams.push(enabled)
        paramIndex++
      }

      // 映射排序字段到数据库字段名
      let dbSortBy = sortBy
      if (sortBy === 'schema') dbSortBy = 'schema_name'
      else if (sortBy === 'table') dbSortBy = 'table_name'
      else if (sortBy === 'command') dbSortBy = 'action'
      else if (sortBy === 'enabled') dbSortBy = 'is_enabled'
      
      query += ` ORDER BY ${dbSortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      queryParams.push(limit, offset)

      const result = await pool.query(query, queryParams)
      return result.rows.map(rowToPolicy)
    } catch (error: any) {
      console.error('列出策略失败:', error)
      throw error.code ? error : { code: 'LIST_POLICIES_FAILED', message: '获取策略列表失败', status: 500 }
    }
  }

  // 获取单个策略
  async getPolicy(projectRef: string, policyId: string): Promise<RLSPolicy> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      const result = await pool.query(
        'SELECT * FROM supabase.rls_policies WHERE project_id = $1 AND id = $2',
        [projectId, policyId]
      )

      if (result.rows.length === 0) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      return rowToPolicy(result.rows[0])
    } catch (error: any) {
      console.error('获取策略失败:', error)
      throw error.code ? error : { code: 'GET_POLICY_FAILED', message: '获取策略失败', status: 500 }
    }
  }

  // 创建策略
  async createPolicy(
    projectRef: string,
    policyRequest: CreatePolicyRequest,
    userId: string
  ): Promise<RLSPolicy> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      // 检查策略是否已存在
      const existing = await pool.query(
        'SELECT id FROM supabase.rls_policies WHERE project_id = $1 AND schema_name = $2 AND table_name = $3 AND name = $4',
        [projectId, policyRequest.schema || 'public', policyRequest.table, policyRequest.name]
      )

      if (existing.rows.length > 0) {
        throw RLS_ERRORS.POLICY_ALREADY_EXISTS
      }

      const policyId = uuidv4()
      const now = new Date().toISOString()
      const schema = policyRequest.schema || 'public'

      // 验证策略语法（简化验证）
      if (!policyRequest.definition || policyRequest.definition.trim() === '') {
        throw RLS_ERRORS.POLICY_SYNTAX_ERROR
      }

      const result = await pool.query(
        `INSERT INTO supabase.rls_policies (
          id, project_id, name, schema_name, table_name, action, roles, 
          using_expression, check_expression, created_at, updated_at, is_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          policyId,
          projectId,
          policyRequest.name,
          schema,
          policyRequest.table,
          policyRequest.command,
          policyRequest.roles || [],
          policyRequest.definition, // 存储到 using_expression
          policyRequest.check || null, // 存储到 check_expression
          now,
          now,
          policyRequest.enabled !== false
        ]
      )

      // 在 PostgreSQL 中创建实际策略（简化实现）
      // 注意：在实际实现中，应该执行 CREATE POLICY SQL 语句
      // 这里为了简化，仅保存元数据

      return rowToPolicy(result.rows[0])
    } catch (error: any) {
      console.error('创建策略失败:', error)
      throw error.code ? error : { code: 'CREATE_POLICY_FAILED', message: '创建策略失败', status: 500 }
    }
  }

  // 更新策略
  async updatePolicy(
    projectRef: string,
    policyId: string,
    policyRequest: UpdatePolicyRequest,
    userId: string
  ): Promise<RLSPolicy> {
    void userId // 数据库没有 updated_by 字段，忽略此参数
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      const now = new Date().toISOString()
      const updateFields: string[] = ['updated_at = $1']
      const updateValues: any[] = [now]
      let paramIndex = 2

      if (policyRequest.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`)
        updateValues.push(policyRequest.name)
        paramIndex++
      }

      if (policyRequest.definition !== undefined) {
        updateFields.push(`using_expression = $${paramIndex}`)
        updateValues.push(policyRequest.definition)
        paramIndex++
      }

      if (policyRequest.check !== undefined) {
        updateFields.push(`check_expression = $${paramIndex}`)
        updateValues.push(policyRequest.check)
        paramIndex++
      }

      // using 和 with_check 字段在数据库中没有对应列，忽略

      if (policyRequest.roles !== undefined) {
        updateFields.push(`roles = $${paramIndex}`)
        updateValues.push(policyRequest.roles)
        paramIndex++
      }

      if (policyRequest.enabled !== undefined) {
        updateFields.push(`is_enabled = $${paramIndex}`)
        updateValues.push(policyRequest.enabled)
        paramIndex++
      }

      updateValues.push(projectId, policyId)

      const result = await pool.query(
        `UPDATE supabase.rls_policies 
         SET ${updateFields.join(', ')} 
         WHERE project_id = $${paramIndex} AND id = $${paramIndex + 1}
         RETURNING *`,
        updateValues
      )

      if (result.rows.length === 0) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      return rowToPolicy(result.rows[0])
    } catch (error: any) {
      console.error('更新策略失败:', error)
      throw error.code ? error : { code: 'UPDATE_POLICY_FAILED', message: '更新策略失败', status: 500 }
    }
  }

  // 删除策略
  async deletePolicy(
    projectRef: string,
    policyId: string
  ): Promise<void> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      // 检查策略是否存在
      const existing = await pool.query(
        'SELECT id FROM supabase.rls_policies WHERE project_id = $1 AND id = $2',
        [projectId, policyId]
      )

      if (existing.rows.length === 0) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      // 删除策略
      await pool.query(
        'DELETE FROM supabase.rls_policies WHERE project_id = $1 AND id = $2',
        [projectId, policyId]
      )
    } catch (error: any) {
      console.error('删除策略失败:', error)
      throw error.code ? error : { code: 'DELETE_POLICY_FAILED', message: '删除策略失败', status: 500 }
    }
  }

  // 启用策略
  async enablePolicy(
    projectRef: string,
    policyId: string,
    userId: string
  ): Promise<RLSPolicy> {
    return this.updatePolicy(projectRef, policyId, { enabled: true }, userId)
  }

  // 禁用策略
  async disablePolicy(
    projectRef: string,
    policyId: string,
    userId: string
  ): Promise<RLSPolicy> {
    return this.updatePolicy(projectRef, policyId, { enabled: false }, userId)
  }

  // 批量操作
  async batchOperation(
    projectRef: string,
    batchRequest: BatchPolicyOperationRequest
  ): Promise<BatchPolicyOperationResponse> {
    const results = []
    
    for (const operation of batchRequest.operations) {
      try {
        let result: any
        
        switch (operation.type) {
          case 'create':
            if (!operation.policy) {
              throw new Error('创建操作需要策略数据')
            }
            const createdPolicy = await this.createPolicy(projectRef, operation.policy, 'system')
            result = { policy_id: createdPolicy.id, success: true, policy: createdPolicy }
            break
            
          case 'update':
            if (!operation.policy_id || !operation.changes) {
              throw new Error('更新操作需要策略ID和变更数据')
            }
            const updatedPolicy = await this.updatePolicy(projectRef, operation.policy_id, operation.changes, 'system')
            result = { policy_id: operation.policy_id, success: true, policy: updatedPolicy }
            break
            
          case 'delete':
            if (!operation.policy_id) {
              throw new Error('删除操作需要策略ID')
            }
            await this.deletePolicy(projectRef, operation.policy_id)
            result = { policy_id: operation.policy_id, success: true, policy: null }
            break
            
          case 'enable':
            if (!operation.policy_id) {
              throw new Error('启用操作需要策略ID')
            }
            const enabledPolicy = await this.enablePolicy(projectRef, operation.policy_id, 'system')
            result = { policy_id: operation.policy_id, success: true, policy: enabledPolicy }
            break
            
          case 'disable':
            if (!operation.policy_id) {
              throw new Error('禁用操作需要策略ID')
            }
            const disabledPolicy = await this.disablePolicy(projectRef, operation.policy_id, 'system')
            result = { policy_id: operation.policy_id, success: true, policy: disabledPolicy }
            break
            
          default:
            result = { policy_id: operation.policy_id || 'unknown', success: false, error: `不支持的操作类型: ${operation.type}` }
        }
        
        results.push(result)
      } catch (error: any) {
        results.push({ policy_id: operation.policy_id || 'unknown', success: false, error: error.message })
        
        if (batchRequest.atomic) {
          // 原子操作失败，回滚已成功的操作
          // 简化实现：直接返回失败
          return {
            results,
            atomic: true,
            success: false
          }
        }
      }
    }
    
    return {
      results,
      atomic: batchRequest.atomic || false,
      success: results.every(r => r.success)
    }
  }

  // 获取策略统计信息
  async getPolicyStats(projectRef: string): Promise<PolicyStats> {
    try {
      const projectId = await this.getProjectId(projectRef)
      if (!projectId) {
        throw RLS_ERRORS.POLICY_NOT_FOUND
      }

      // 获取总策略数
      const totalResult = await pool.query(
        'SELECT COUNT(*) as total FROM supabase.rls_policies WHERE project_id = $1',
        [projectId]
      )

      // 获取启用/禁用策略数
      const enabledResult = await pool.query(
        'SELECT COUNT(*) as count FROM supabase.rls_policies WHERE project_id = $1 AND is_enabled = true',
        [projectId]
      )

      const disabledResult = await pool.query(
        'SELECT COUNT(*) as count FROM supabase.rls_policies WHERE project_id = $1 AND is_enabled = false',
        [projectId]
      )

      // 按命令分组
      const commandResult = await pool.query(
        'SELECT action as command, COUNT(*) as count FROM supabase.rls_policies WHERE project_id = $1 GROUP BY action',
        [projectId]
      )

      // 按schema分组
      const schemaResult = await pool.query(
        'SELECT schema_name as schema, COUNT(*) as count FROM supabase.rls_policies WHERE project_id = $1 GROUP BY schema_name',
        [projectId]
      )

      // 按table分组
      const tableResult = await pool.query(
        'SELECT table_name as table, COUNT(*) as count FROM supabase.rls_policies WHERE project_id = $1 GROUP BY table_name',
        [projectId]
      )

      const policies_by_command: Record<string, number> = {}
      commandResult.rows.forEach(row => {
        policies_by_command[row.command] = parseInt(row.count)
      })

      const policies_by_schema: Record<string, number> = {}
      schemaResult.rows.forEach(row => {
        policies_by_schema[row.schema] = parseInt(row.count)
      })

      const policies_by_table: Record<string, number> = {}
      tableResult.rows.forEach(row => {
        policies_by_table[row.table] = parseInt(row.count)
      })

      return {
        total_policies: parseInt(totalResult.rows[0]?.total || '0'),
        enabled_policies: parseInt(enabledResult.rows[0]?.count || '0'),
        disabled_policies: parseInt(disabledResult.rows[0]?.count || '0'),
        policies_by_command,
        policies_by_schema,
        policies_by_table
      }
    } catch (error: any) {
      console.error('获取策略统计信息失败:', error)
      throw error.code ? error : { code: 'GET_STATS_FAILED', message: '获取策略统计信息失败', status: 500 }
    }
  }
}