/**
 * 审计日志模块
 * 提供统一的审计日志记录功能
 */

import { Pool } from 'pg'
import { config } from 'dotenv'

config()

// 数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'supabase_platform_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

/**
 * 记录审计事件
 */
export async function logAuditEvent(
  projectId: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null = null,
  oldValues: any = null,
  newValues: any = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT supabase.log_audit_event($1, $2, $3, $4, $5, $6, $7, $8, $9) as log_id`,
      [
        projectId,
        userId,
        action,
        resourceType,
        resourceId,
        oldValues,
        newValues,
        ipAddress,
        userAgent
      ]
    )
    
    return result.rows[0].log_id
  } catch (error) {
    console.error('记录审计日志失败:', error)
    // 不抛出错误，避免影响主业务流程
    return 'audit-log-failed'
  }
}

/**
 * 简化版审计日志（用于不需要完整参数的场景）
 */
export async function logSimpleAudit(
  projectId: string,
  userId: string,
  action: string,
  resourceType: string
): Promise<void> {
  await logAuditEvent(projectId, userId, action, resourceType)
}