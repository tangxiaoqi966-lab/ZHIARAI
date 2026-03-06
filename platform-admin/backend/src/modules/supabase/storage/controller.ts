/**
 * Supabase Storage 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */

import { Request, Response } from 'express'
import { StorageService } from './service'
import {
  CreateBucketRequest,
  UpdateBucketRequest,
  UploadFileRequest,
  ListFilesParams,
  SignedURLRequest,
  BatchStorageOperationRequest
} from './types'

const storageService = new StorageService()

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

// 获取请求中的用户身份 (简化实现)
function getUserId(req: Request): string {
  // 实际实现中可以从 JWT token 中提取
  return req.headers['x-user-id'] as string || 'system'
}

// 列出所有 Bucket
export const listBuckets = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const buckets = await storageService.listBuckets(projectRef)
    res.json({ buckets })
  } catch (error: any) {
    console.error('列出 Bucket 失败:', error)
    const status = error.status || 500
    const message = error.message || '列出 Bucket 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取单个 Bucket
export const getBucket = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    
    if (!bucketName) {
      res.status(400).json({ error: 'Bucket 名称是必填字段' })
      return
    }
    
    const bucket = await storageService.getBucket(projectRef, bucketName)
    res.json(bucket)
  } catch (error: any) {
    console.error('获取 Bucket 失败:', error)
    const status = error.status || 500
    const message = error.message || '获取 Bucket 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 创建 Bucket
export const createBucket = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketRequest: CreateBucketRequest = req.body
    const userId = getUserId(req)
    
    if (!bucketRequest.name) {
      res.status(400).json({ error: 'Bucket 名称是必填字段' })
      return
    }
    
    const bucket = await storageService.createBucket(projectRef, bucketRequest, userId)
    res.status(201).json(bucket)
  } catch (error: any) {
    console.error('创建 Bucket 失败:', error)
    const status = error.status || 500
    const message = error.message || '创建 Bucket 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 更新 Bucket
export const updateBucket = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    const bucketRequest: UpdateBucketRequest = req.body
    const userId = getUserId(req)
    
    if (!bucketName) {
      res.status(400).json({ error: 'Bucket 名称是必填字段' })
      return
    }
    
    const bucket = await storageService.updateBucket(projectRef, bucketName, bucketRequest, userId)
    res.json(bucket)
  } catch (error: any) {
    console.error('更新 Bucket 失败:', error)
    const status = error.status || 500
    const message = error.message || '更新 Bucket 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除 Bucket
export const deleteBucket = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    
    if (!bucketName) {
      res.status(400).json({ error: 'Bucket 名称是必填字段' })
      return
    }
    
    await storageService.deleteBucket(projectRef, bucketName)
    res.status(204).send()
  } catch (error: any) {
    console.error('删除 Bucket 失败:', error)
    const status = error.status || 500
    const message = error.message || '删除 Bucket 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 列出文件
export const listFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    const params: ListFilesParams = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy ? JSON.parse(req.query.sortBy as string) : undefined,
      search: req.query.search as string,
      prefix: req.query.prefix as string
    }
    
    if (!bucketName) {
      res.status(400).json({ error: 'Bucket 名称是必填字段' })
      return
    }
    
    const result = await storageService.listFiles(projectRef, bucketName, params)
    res.json(result)
  } catch (error: any) {
    console.error('列出文件失败:', error)
    const status = error.status || 500
    const message = error.message || '列出文件失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 上传文件
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    const filePath = req.params[0] || req.query.path as string // 支持路径参数和查询参数
    
    if (!bucketName || !filePath) {
      res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' })
      return
    }
    
    const uploadRequest: UploadFileRequest = {
      file: req.body, // 实际文件数据
      bucket: bucketName,
      path: filePath,
      contentType: req.headers['content-type'] as string || 'application/octet-stream',
      metadata: req.headers['x-metadata'] ? JSON.parse(req.headers['x-metadata'] as string) : {}
    }
    
    const fileObject = await storageService.uploadFile(projectRef, uploadRequest)
    res.status(201).json(fileObject)
  } catch (error: any) {
    console.error('上传文件失败:', error)
    const status = error.status || 500
    const message = error.message || '上传文件失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 下载文件
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    const filePath = req.params[0] || req.query.path as string
    
    if (!bucketName || !filePath) {
      res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' })
      return
    }
    
    const result = await storageService.downloadFile(projectRef, bucketName, filePath)
    
    // 设置响应头
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Length', result.contentLength)
    res.setHeader('Last-Modified', result.lastModified)
    res.setHeader('ETag', result.etag)
    
    // 发送文件数据
    res.send(result.data)
  } catch (error: any) {
    console.error('下载文件失败:', error)
    const status = error.status || 500
    const message = error.message || '下载文件失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除文件
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    const filePath = req.params[0] || req.query.path as string
    
    if (!bucketName || !filePath) {
      res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' })
      return
    }
    
    await storageService.deleteFile(projectRef, bucketName, filePath)
    res.status(204).send()
  } catch (error: any) {
    console.error('删除文件失败:', error)
    const status = error.status || 500
    const message = error.message || '删除文件失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 生成签名 URL
export const createSignedURL = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const bucketName = req.params.bucketName
    const filePath = req.params[0] || req.query.path as string
    const signedRequest: SignedURLRequest = req.body
    
    if (!bucketName || !filePath) {
      res.status(400).json({ error: 'Bucket 名称和文件路径是必填字段' })
      return
    }
    
    const result = await storageService.createSignedURL(projectRef, bucketName, filePath, signedRequest)
    res.json(result)
  } catch (error: any) {
    console.error('生成签名 URL 失败:', error)
    const status = error.status || 500
    const message = error.message || '生成签名 URL 失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 批量操作
export const batchOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const batchRequest: BatchStorageOperationRequest = req.body
    
    if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
      res.status(400).json({ error: '操作列表是必填字段' })
      return
    }
    
    const result = await storageService.batchOperation(projectRef, batchRequest)
    res.json(result)
  } catch (error: any) {
    console.error('批量操作失败:', error)
    const status = error.status || 500
    const message = error.message || '批量操作失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取存储统计信息
export const getStorageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const stats = await storageService.getStorageStats(projectRef)
    res.json(stats)
  } catch (error: any) {
    console.error('获取存储统计信息失败:', error)
    const status = error.status || 500
    const message = error.message || '获取存储统计信息失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 健康检查
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    service: 'supabase-storage',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}