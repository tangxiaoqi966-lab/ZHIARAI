/**
 * Supabase RLS Policy 路由
 * 提供与官方 Supabase RLS Policy API 完全兼容的接口
 */

import { Router } from 'express'
import {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  enablePolicy,
  disablePolicy,
  batchOperation,
  getPolicyStats,
  healthCheck
} from '../modules/supabase/rls-policy/controller'
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

// 官方 Supabase RLS Policy API
// 列出策略
officialApiRouter.get('/v1/policies', listPolicies)
// 获取单个策略
officialApiRouter.get('/v1/policies/:policyId', getPolicy)
// 创建策略
officialApiRouter.post('/v1/policies', createPolicy)
// 更新策略
officialApiRouter.put('/v1/policies/:policyId', updatePolicy)
// 删除策略
officialApiRouter.delete('/v1/policies/:policyId', deletePolicy)
// 启用策略
officialApiRouter.post('/v1/policies/:policyId/enable', enablePolicy)
// 禁用策略
officialApiRouter.post('/v1/policies/:policyId/disable', disablePolicy)
// 批量操作
officialApiRouter.post('/v1/policies/batch', batchOperation)
// 获取统计信息
officialApiRouter.get('/v1/policies/stats', getPolicyStats)
// 健康检查
officialApiRouter.get('/health', healthCheck)

// 注册官方 API 路由 (在认证之前)
router.use('/policy', officialApiRouter)

// === 平台管理 API (需要用户认证) ===

// 所有管理 API 都需要认证
router.use(authenticate)
// 需要管理员角色
router.use(requireRole(['admin', 'super_admin']))

// === 项目级别 RLS Policy 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取

// 列出策略
router.get('/projects/:projectRef/rls/policies', listPolicies)
// 获取单个策略
router.get('/projects/:projectRef/rls/policies/:policyId', getPolicy)
// 创建策略
router.post('/projects/:projectRef/rls/policies', createPolicy)
// 更新策略
router.put('/projects/:projectRef/rls/policies/:policyId', updatePolicy)
// 删除策略
router.delete('/projects/:projectRef/rls/policies/:policyId', deletePolicy)
// 启用策略
router.post('/projects/:projectRef/rls/policies/:policyId/enable', enablePolicy)
// 禁用策略
router.post('/projects/:projectRef/rls/policies/:policyId/disable', disablePolicy)
// 批量操作
router.post('/projects/:projectRef/rls/policies/batch', batchOperation)
// 获取统计信息
router.get('/projects/:projectRef/rls/policies/stats', getPolicyStats)

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
projectRefRoutes.get('/rls/policies', listPolicies)
projectRefRoutes.get('/rls/policies/:policyId', getPolicy)
projectRefRoutes.post('/rls/policies', createPolicy)
projectRefRoutes.put('/rls/policies/:policyId', updatePolicy)
projectRefRoutes.delete('/rls/policies/:policyId', deletePolicy)
projectRefRoutes.post('/rls/policies/:policyId/enable', enablePolicy)
projectRefRoutes.post('/rls/policies/:policyId/disable', disablePolicy)
projectRefRoutes.post('/rls/policies/batch', batchOperation)
projectRefRoutes.get('/rls/policies/stats', getPolicyStats)

// 注册向后兼容的路由
router.use('/', projectRefRoutes)

// 健康检查端点
router.get('/health', healthCheck)

export default router