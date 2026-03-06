/**
 * Supabase RLS Policy 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */

import { Request, Response } from 'express'
import { RLSPolicyService } from './service'
import {
  CreatePolicyRequest,
  UpdatePolicyRequest,
  ListPoliciesParams,
  BatchPolicyOperationRequest
} from './types'

const policyService = new RLSPolicyService()

// 获取请求中的项目引用
function getProjectRef(req: Request): string {
  // 从路径参数获取
  if (req.params.projectRef) {
    return req.params.projectRef
  }
  
  // 从头部获取
  const projectRef = req.headers['x-project-ref'] || req.headers['project-ref']
  if (projectRef && typeof projectRef === 'string') {
    return projectRef
  }
  
  throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在', status: 404 }
}

// 获取请求中的用户身份
function getUserId(req: Request): string {
  // 实际实现中可以从 JWT token 中提取
  return req.headers['x-user-id'] as string || 'system'
}

// 列出策略
export const listPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const params: ListPoliciesParams = {
      schema: req.query.schema as string,
      table: req.query.table as string,
      command: req.query.command as string,
      enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined
    }
    
    const policies = await policyService.listPolicies(projectRef, params)
    res.json({ policies })
  } catch (error: any) {
    console.error('列出策略失败:', error)
    const status = error.status || 500
    const message = error.message || '列出策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取单个策略
export const getPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const policyId = req.params.policyId
    
    if (!policyId) {
      res.status(400).json({ error: '策略 ID 是必填字段' })
      return
    }
    
    const policy = await policyService.getPolicy(projectRef, policyId)
    res.json(policy)
  } catch (error: any) {
    console.error('获取策略失败:', error)
    const status = error.status || 500
    const message = error.message || '获取策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 创建策略
export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const policyRequest: CreatePolicyRequest = req.body
    const userId = getUserId(req)
    
    if (!policyRequest.name || !policyRequest.table || !policyRequest.command || !policyRequest.definition) {
      res.status(400).json({ error: '名称、表、命令和定义是必填字段' })
      return
    }
    
    const policy = await policyService.createPolicy(projectRef, policyRequest, userId)
    res.status(201).json(policy)
  } catch (error: any) {
    console.error('创建策略失败:', error)
    const status = error.status || 500
    const message = error.message || '创建策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 更新策略
export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const policyId = req.params.policyId
    const policyRequest: UpdatePolicyRequest = req.body
    const userId = getUserId(req)
    
    if (!policyId) {
      res.status(400).json({ error: '策略 ID 是必填字段' })
      return
    }
    
    const policy = await policyService.updatePolicy(projectRef, policyId, policyRequest, userId)
    res.json(policy)
  } catch (error: any) {
    console.error('更新策略失败:', error)
    const status = error.status || 500
    const message = error.message || '更新策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除策略
export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const policyId = req.params.policyId
    
    if (!policyId) {
      res.status(400).json({ error: '策略 ID 是必填字段' })
      return
    }
    
    await policyService.deletePolicy(projectRef, policyId)
    res.status(204).send()
  } catch (error: any) {
    console.error('删除策略失败:', error)
    const status = error.status || 500
    const message = error.message || '删除策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 启用策略
export const enablePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const policyId = req.params.policyId
    const userId = getUserId(req)
    
    if (!policyId) {
      res.status(400).json({ error: '策略 ID 是必填字段' })
      return
    }
    
    const policy = await policyService.enablePolicy(projectRef, policyId, userId)
    res.json(policy)
  } catch (error: any) {
    console.error('启用策略失败:', error)
    const status = error.status || 500
    const message = error.message || '启用策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 禁用策略
export const disablePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const policyId = req.params.policyId
    const userId = getUserId(req)
    
    if (!policyId) {
      res.status(400).json({ error: '策略 ID 是必填字段' })
      return
    }
    
    const policy = await policyService.disablePolicy(projectRef, policyId, userId)
    res.json(policy)
  } catch (error: any) {
    console.error('禁用策略失败:', error)
    const status = error.status || 500
    const message = error.message || '禁用策略失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 批量操作
export const batchOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const batchRequest: BatchPolicyOperationRequest = req.body
    
    if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
      res.status(400).json({ error: '操作列表是必填字段' })
      return
    }
    
    const result = await policyService.batchOperation(projectRef, batchRequest)
    res.json(result)
  } catch (error: any) {
    console.error('批量操作失败:', error)
    const status = error.status || 500
    const message = error.message || '批量操作失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取策略统计信息
export const getPolicyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const stats = await policyService.getPolicyStats(projectRef)
    res.json(stats)
  } catch (error: any) {
    console.error('获取策略统计信息失败:', error)
    const status = error.status || 500
    const message = error.message || '获取策略统计信息失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 健康检查
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    service: 'supabase-rls-policy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}