/**
 * Supabase Database 路由
 * 提供与官方 Supabase Database API 完全兼容的接口
 */

import { Router } from 'express'
import {
  executeSQL,
  listTables,
  getTableSchema,
  createTable,
  dropTable,
  queryData,
  insertData,
  updateData,
  deleteData,
  batchOperation,
  getDatabaseStats,
  healthCheck
} from '../modules/supabase/database/controller'
import { authenticate, requireRole } from '../utils/auth'

const router = Router()

// === Supabase 官方 API 兼容路由 ===

// Supabase 官方 API 路径 (需要服务角色密钥)
const officialApiRouter = Router()

// 服务角色认证中间件 (检查 service_role API 密钥)
const requireServiceRole = (req: any, res: any, next: any) => {
  const apiKey = req.headers['apikey'] || req.headers['authorization']?.replace('Bearer ', '')
  if (!apiKey) {
    return res.status(401).json({ error: '需要 API 密钥' })
  }
  
  // 这里可以添加 API 密钥验证逻辑
  // 暂时允许所有请求
  next()
}

officialApiRouter.use(requireServiceRole)

// 官方 Supabase Database API
// POST /rest/v1/ (SQL 查询端点)
officialApiRouter.post('/v1/', executeSQL)

// 注册官方 API 路由 (在认证之前)
router.use('/rest', officialApiRouter)

// === 平台管理 API (需要用户认证) ===

// 所有管理 API 都需要认证
router.use(authenticate)
// 需要管理员角色
router.use(requireRole(['admin', 'super_admin']))

// === 项目级别 Database 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取

// 执行原始 SQL 查询
// POST /api/supabase/projects/:projectRef/database/sql
router.post('/projects/:projectRef/database/sql', executeSQL)

// 列出所有表
// GET /api/supabase/projects/:projectRef/database/tables
router.get('/projects/:projectRef/database/tables', listTables)

// 获取表结构
// GET /api/supabase/projects/:projectRef/database/tables/:tableName
router.get('/projects/:projectRef/database/tables/:tableName', getTableSchema)

// 创建新表
// POST /api/supabase/projects/:projectRef/database/tables
router.post('/projects/:projectRef/database/tables', createTable)

// 删除表
// DELETE /api/supabase/projects/:projectRef/database/tables/:tableName
router.delete('/projects/:projectRef/database/tables/:tableName', dropTable)

// 查询数据 (PostgREST 风格)
// GET /api/supabase/projects/:projectRef/database/data/:tableName
router.get('/projects/:projectRef/database/data/:tableName', queryData)

// 插入数据
// POST /api/supabase/projects/:projectRef/database/data/:tableName
router.post('/projects/:projectRef/database/data/:tableName', insertData)

// 更新数据
// PUT /api/supabase/projects/:projectRef/database/data/:tableName
router.put('/projects/:projectRef/database/data/:tableName', updateData)

// 删除数据
// DELETE /api/supabase/projects/:projectRef/database/data/:tableName
router.delete('/projects/:projectRef/database/data/:tableName', deleteData)

// 批量操作
// POST /api/supabase/projects/:projectRef/database/batch
router.post('/projects/:projectRef/database/batch', batchOperation)

// 获取数据库统计信息
// GET /api/supabase/projects/:projectRef/database/stats
router.get('/projects/:projectRef/database/stats', getDatabaseStats)

// === 向后兼容的路由 (支持头部传递 project-ref) ===

// 支持通过头部 X-Project-Ref 或 project-ref 指定项目的路由
const projectRefRoutes = Router({ mergeParams: true })
projectRefRoutes.use((req, _res, next) => {
  // 如果路径中没有 projectRef，尝试从头部获取
  if (!req.params.projectRef) {
    const projectRef = req.headers['x-project-ref'] || req.headers['project-ref']
    if (projectRef && typeof projectRef === 'string') {
      req.params.projectRef = projectRef
    }
  }
  next()
})

// 使用头部 project-ref 的路由
projectRefRoutes.post('/database/sql', executeSQL)
projectRefRoutes.get('/database/tables', listTables)
projectRefRoutes.get('/database/tables/:tableName', getTableSchema)
projectRefRoutes.post('/database/tables', createTable)
projectRefRoutes.delete('/database/tables/:tableName', dropTable)
projectRefRoutes.get('/database/data/:tableName', queryData)
projectRefRoutes.post('/database/data/:tableName', insertData)
projectRefRoutes.put('/database/data/:tableName', updateData)
projectRefRoutes.delete('/database/data/:tableName', deleteData)
projectRefRoutes.post('/database/batch', batchOperation)
projectRefRoutes.get('/database/stats', getDatabaseStats)

// 注册向后兼容的路由
router.use('/', projectRefRoutes)

// 健康检查端点
router.get('/health', healthCheck)

export default router