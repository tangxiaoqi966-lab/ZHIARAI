/**
 * Supabase API Keys 路由
 * 提供与官方 Supabase API Keys 完全兼容的接口
 */

import { Router } from 'express'
import {
  listApiKeys,
  getApiKey,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  rotateApiKey,
  validateApiKey,
  revokeApiKey,
  enableApiKey,
  batchUpdateApiKeys
} from '../modules/supabase/api-keys/controller'
import { authenticate, requireRole } from '../utils/auth'

const router = Router()

// 所有 API Keys 路由都需要认证
router.use(authenticate)

// 注意：Supabase 风格的 API Keys 管理通常需要管理员权限
// 可以根据需要调整权限要求
router.use(requireRole(['admin', 'super_admin']))

// === 项目级别 API Keys 路由 ===
// 这些路由需要项目引用 (project_ref)，可以从路径参数或头部获取

// 列出项目的所有 API 密钥
// GET /api/supabase/projects/:projectRef/api-keys
router.get('/projects/:projectRef/api-keys', listApiKeys)

// 创建新的 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys
router.post('/projects/:projectRef/api-keys', createApiKey)

// 批量操作 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys/batch
router.post('/projects/:projectRef/api-keys/batch', batchUpdateApiKeys)

// 获取单个 API 密钥
// GET /api/supabase/projects/:projectRef/api-keys/:id
router.get('/projects/:projectRef/api-keys/:id', getApiKey)

// 更新 API 密钥
// PUT /api/supabase/projects/:projectRef/api-keys/:id
router.put('/projects/:projectRef/api-keys/:id', updateApiKey)

// 删除 API 密钥
// DELETE /api/supabase/projects/:projectRef/api-keys/:id
router.delete('/projects/:projectRef/api-keys/:id', deleteApiKey)

// 轮换 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys/:id/rotate
router.post('/projects/:projectRef/api-keys/:id/rotate', rotateApiKey)

// 撤销 API 密钥 (禁用)
// POST /api/supabase/projects/:projectRef/api-keys/:id/revoke
router.post('/projects/:projectRef/api-keys/:id/revoke', revokeApiKey)

// 启用 API 密钥
// POST /api/supabase/projects/:projectRef/api-keys/:id/enable
router.post('/projects/:projectRef/api-keys/:id/enable', enableApiKey)

// === 全局 API Keys 路由 (不需要项目引用) ===

// 验证 API 密钥
// POST /api/supabase/api-keys/validate
router.post('/api-keys/validate', validateApiKey)

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
projectRefRoutes.get('/api-keys', listApiKeys)
projectRefRoutes.post('/api-keys', createApiKey)
projectRefRoutes.post('/api-keys/batch', batchUpdateApiKeys)
projectRefRoutes.get('/api-keys/:id', getApiKey)
projectRefRoutes.put('/api-keys/:id', updateApiKey)
projectRefRoutes.delete('/api-keys/:id', deleteApiKey)
projectRefRoutes.post('/api-keys/:id/rotate', rotateApiKey)
projectRefRoutes.post('/api-keys/:id/revoke', revokeApiKey)
projectRefRoutes.post('/api-keys/:id/enable', enableApiKey)

// 注册向后兼容的路由
router.use('/', projectRefRoutes)

// 健康检查端点
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'supabase-api-keys',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

export default router