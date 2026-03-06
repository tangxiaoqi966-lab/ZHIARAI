/**
 * Supabase API Keys 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */

import { Request, Response } from 'express'
import { ApiKeyService } from './service'
import {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ListApiKeysParams,
  RotateApiKeyRequest,
  ValidateApiKeyRequest,
  API_KEY_ERRORS
} from './types'

const apiKeyService = new ApiKeyService()

// 获取请求中的项目引用（从路径参数或头部）
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
  
  throw API_KEY_ERRORS.PROJECT_NOT_FOUND
}

// 获取操作用户ID（从认证信息）
function getUserId(req: any): string {
  return req.user?.id || 'system'
}

// 获取客户端信息
function getClientInfo(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  }
}

// 列出 API 密钥
export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const params: ListApiKeysParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      per_page: req.query.per_page ? parseInt(req.query.per_page as string) : undefined,
      sort_by: req.query.sort_by as string,
      sort_order: req.query.sort_order as 'asc' | 'desc',
      filter: req.query.filter as string,
      key_type: req.query.key_type as any,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined
    }

    const result = await apiKeyService.listApiKeys(projectRef, params)
    res.json(result)
  } catch (error: any) {
    console.error('列出 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '获取 API 密钥列表失败'
    res.status(status).json({ error: message, code: error.code, details: error.details })
  }
}

// 获取单个 API 密钥
export const getApiKey = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const apiKeyId = req.params.id

    const apiKey = await apiKeyService.getApiKeyById(projectRef, apiKeyId)
    res.json({ api_key: apiKey })
  } catch (error: any) {
    console.error('获取 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '获取 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 创建 API 密钥
export const createApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const keyData: CreateApiKeyRequest = req.body

    // 验证必要字段
    if (!keyData.name || !keyData.key_type) {
      res.status(400).json({ error: '名称和密钥类型是必填字段' })
      return
    }

    const apiKey = await apiKeyService.createApiKey(projectRef, keyData, userId, ipAddress, userAgent)
    res.status(201).json({ api_key: apiKey })
  } catch (error: any) {
    console.error('创建 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '创建 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 更新 API 密钥
export const updateApiKey = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const apiKeyId = req.params.id
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const keyData: UpdateApiKeyRequest = req.body

    const apiKey = await apiKeyService.updateApiKey(projectRef, apiKeyId, keyData, userId, ipAddress, userAgent)
    res.json({ api_key: apiKey })
  } catch (error: any) {
    console.error('更新 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '更新 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除 API 密钥
export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const apiKeyId = req.params.id
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)

    await apiKeyService.deleteApiKey(projectRef, apiKeyId, userId, ipAddress, userAgent)
    res.status(204).send()
  } catch (error: any) {
    console.error('删除 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '删除 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 轮换 API 密钥
export const rotateApiKey = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const apiKeyId = req.params.id
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const rotationData: RotateApiKeyRequest = req.body

    const result = await apiKeyService.rotateApiKey(projectRef, apiKeyId, rotationData, userId, ipAddress, userAgent)
    res.json(result)
  } catch (error: any) {
    console.error('轮换 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '轮换 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 验证 API 密钥
export const validateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const validateData: ValidateApiKeyRequest = req.body

    if (!validateData.key) {
      res.status(400).json({ error: 'API 密钥是必填字段' })
      return
    }

    const result = await apiKeyService.validateApiKey(validateData)
    res.json(result)
  } catch (error: any) {
    console.error('验证 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '验证 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 撤销 API 密钥
export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const apiKeyId = req.params.id
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)

    const apiKey = await apiKeyService.revokeApiKey(projectRef, apiKeyId, userId, ipAddress, userAgent)
    res.json({ api_key: apiKey })
  } catch (error: any) {
    console.error('撤销 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '撤销 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 启用 API 密钥
export const enableApiKey = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const apiKeyId = req.params.id
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)

    const apiKey = await apiKeyService.enableApiKey(projectRef, apiKeyId, userId, ipAddress, userAgent)
    res.json({ api_key: apiKey })
  } catch (error: any) {
    console.error('启用 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '启用 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 批量操作：启用/禁用多个 API 密钥
export const batchUpdateApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const userId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const { action, api_key_ids } = req.body

    if (!action || !api_key_ids || !Array.isArray(api_key_ids)) {
      res.status(400).json({ error: '操作类型和API密钥ID列表是必填字段' })
      return
    }

    const results = []
    for (const apiKeyId of api_key_ids) {
      try {
        let apiKey
        if (action === 'enable') {
          apiKey = await apiKeyService.enableApiKey(projectRef, apiKeyId, userId, ipAddress, userAgent)
        } else if (action === 'disable') {
          apiKey = await apiKeyService.revokeApiKey(projectRef, apiKeyId, userId, ipAddress, userAgent)
        } else {
          res.status(400).json({ error: '不支持的操作类型，仅支持 enable 或 disable' })
          return
        }
        results.push({ api_key_id: apiKeyId, success: true, api_key: apiKey })
      } catch (error: any) {
        results.push({ api_key_id: apiKeyId, success: false, error: error.message })
      }
    }

    res.json({ results })
  } catch (error: any) {
    console.error('批量更新 API 密钥失败:', error)
    const status = error.status || 500
    const message = error.message || '批量更新 API 密钥失败'
    res.status(status).json({ error: message, code: error.code })
  }
}