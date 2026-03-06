/**
 * Supabase Edge Functions 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */

import { Request, Response } from 'express'
import { EdgeFunctionsService } from './service'
import {
  CreateEdgeFunctionRequest,
  UpdateEdgeFunctionRequest,
  DeployEdgeFunctionRequest,
  ListEdgeFunctionsParams,
  BatchEdgeFunctionOperationRequest
} from './types'

const edgeFunctionsService = new EdgeFunctionsService()

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

// 列出 Edge Functions
export const listEdgeFunctions = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const params: ListEdgeFunctionsParams = {
      status: req.query.status as string,
      runtime: req.query.runtime as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      search: req.query.search as string
    }
    
    const functions = await edgeFunctionsService.listEdgeFunctions(projectRef, params)
    res.json({ functions })
  } catch (error: any) {
    console.error('列出 Edge Functions 失败:', error)
    const status = error.status || 500
    const message = error.message || '列出 Edge Functions 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取单个 Edge Function
export const getEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    
    if (!functionId) {
      res.status(400).json({ error: '函数 ID 是必填字段' })
      return
    }
    
    const edgeFunction = await edgeFunctionsService.getEdgeFunction(projectRef, functionId)
    res.json(edgeFunction)
  } catch (error: any) {
    console.error('获取 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '获取 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 创建 Edge Function
export const createEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionRequest: CreateEdgeFunctionRequest = req.body
    const userId = getUserId(req)
    
    if (!functionRequest.name || !functionRequest.runtime || !functionRequest.entrypoint || !functionRequest.code) {
      res.status(400).json({ error: '名称、运行时、入口点和代码是必填字段' })
      return
    }
    
    const edgeFunction = await edgeFunctionsService.createEdgeFunction(projectRef, functionRequest, userId)
    res.status(201).json(edgeFunction)
  } catch (error: any) {
    console.error('创建 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '创建 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 更新 Edge Function
export const updateEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    const functionRequest: UpdateEdgeFunctionRequest = req.body
    const userId = getUserId(req)
    
    if (!functionId) {
      res.status(400).json({ error: '函数 ID 是必填字段' })
      return
    }
    
    const edgeFunction = await edgeFunctionsService.updateEdgeFunction(projectRef, functionId, functionRequest, userId)
    res.json(edgeFunction)
  } catch (error: any) {
    console.error('更新 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '更新 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除 Edge Function
export const deleteEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    
    if (!functionId) {
      res.status(400).json({ error: '函数 ID 是必填字段' })
      return
    }
    
    await edgeFunctionsService.deleteEdgeFunction(projectRef, functionId)
    res.status(204).send()
  } catch (error: any) {
    console.error('删除 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '删除 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 部署 Edge Function
export const deployEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    const deployRequest: DeployEdgeFunctionRequest = req.body
    const userId = getUserId(req)
    
    if (!functionId) {
      res.status(400).json({ error: '函数 ID 是必填字段' })
      return
    }
    
    const edgeFunction = await edgeFunctionsService.deployEdgeFunction(projectRef, functionId, deployRequest, userId)
    res.json(edgeFunction)
  } catch (error: any) {
    console.error('部署 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '部署 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 激活 Edge Function
export const activateEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    const userId = getUserId(req)
    
    if (!functionId) {
      res.status(400).json({ error: '函数 ID 是必填字段' })
      return
    }
    
    const edgeFunction = await edgeFunctionsService.activateEdgeFunction(projectRef, functionId, userId)
    res.json(edgeFunction)
  } catch (error: any) {
    console.error('激活 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '激活 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 停用 Edge Function
export const deactivateEdgeFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    const userId = getUserId(req)
    
    if (!functionId) {
      res.status(400).json({ error: '函数 ID 是必填字段' })
      return
    }
    
    const edgeFunction = await edgeFunctionsService.deactivateEdgeFunction(projectRef, functionId, userId)
    res.json(edgeFunction)
  } catch (error: any) {
    console.error('停用 Edge Function 失败:', error)
    const status = error.status || 500
    const message = error.message || '停用 Edge Function 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 批量操作
export const batchOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const batchRequest: BatchEdgeFunctionOperationRequest = req.body
    
    if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
      res.status(400).json({ error: '操作列表是必填字段' })
      return
    }
    
    const result = await edgeFunctionsService.batchOperation(projectRef, batchRequest)
    res.json(result)
  } catch (error: any) {
    console.error('批量操作失败:', error)
    const status = error.status || 500
    const message = error.message || '批量操作失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取 Edge Function 统计信息
export const getEdgeFunctionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const stats = await edgeFunctionsService.getEdgeFunctionStats(projectRef)
    res.json(stats)
  } catch (error: any) {
    console.error('获取 Edge Function 统计信息失败:', error)
    const status = error.status || 500
    const message = error.message || '获取 Edge Function 统计信息失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取调用日志
export const getInvocationLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const functionId = req.params.functionId
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0
    
    const logs = await edgeFunctionsService.getInvocationLogs(projectRef, functionId, limit, offset)
    res.json({ logs })
  } catch (error: any) {
    console.error('获取调用日志失败:', error)
    const status = error.status || 500
    const message = error.message || '获取调用日志失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 健康检查
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    service: 'supabase-edge-functions',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}