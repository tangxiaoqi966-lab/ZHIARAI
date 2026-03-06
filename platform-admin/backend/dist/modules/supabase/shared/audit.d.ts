/**
 * 审计日志模块
 * 提供统一的审计日志记录功能
 */
/**
 * 记录审计事件
 */
export declare function logAuditEvent(projectId: string, userId: string | null, action: string, resourceType: string, resourceId?: string | null, oldValues?: any, newValues?: any, ipAddress?: string | null, userAgent?: string | null): Promise<string>;
/**
 * 简化版审计日志（用于不需要完整参数的场景）
 */
export declare function logSimpleAudit(projectId: string, userId: string, action: string, resourceType: string): Promise<void>;
//# sourceMappingURL=audit.d.ts.map