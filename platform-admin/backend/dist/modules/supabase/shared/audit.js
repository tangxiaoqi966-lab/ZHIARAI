"use strict";
/**
 * 审计日志模块
 * 提供统一的审计日志记录功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
exports.logSimpleAudit = logSimpleAudit;
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// 数据库连接池
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'supabase_platform_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});
/**
 * 记录审计事件
 */
async function logAuditEvent(projectId, userId, action, resourceType, resourceId = null, oldValues = null, newValues = null, ipAddress = null, userAgent = null) {
    try {
        const result = await pool.query(`SELECT supabase.log_audit_event($1, $2, $3, $4, $5, $6, $7, $8, $9) as log_id`, [
            projectId,
            userId,
            action,
            resourceType,
            resourceId,
            oldValues,
            newValues,
            ipAddress,
            userAgent
        ]);
        return result.rows[0].log_id;
    }
    catch (error) {
        console.error('记录审计日志失败:', error);
        // 不抛出错误，避免影响主业务流程
        return 'audit-log-failed';
    }
}
/**
 * 简化版审计日志（用于不需要完整参数的场景）
 */
async function logSimpleAudit(projectId, userId, action, resourceType) {
    await logAuditEvent(projectId, userId, action, resourceType);
}
//# sourceMappingURL=audit.js.map