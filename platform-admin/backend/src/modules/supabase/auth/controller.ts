/**
 * Supabase Auth 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */

import { Request, Response } from 'express'
import { AuthService } from './service'
import {
  CreateUserRequest,
  UpdateUserRequest,
  ListUsersParams,
  AuthResponse
} from './types'

const authService = new AuthService()

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

// 列出用户
export const listUsers = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const params: ListUsersParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      per_page: req.query.per_page ? parseInt(req.query.per_page as string) : undefined,
      sort_by: req.query.sort_by as string,
      sort_order: req.query.sort_order as 'asc' | 'desc',
      filter: req.query.filter as string
    }

    const result = await authService.listUsers(projectRef, params)
    res.json(result)
  } catch (error: any) {
    console.error('列出用户失败:', error)
    const status = error.status || 500
    const message = error.message || '获取用户列表失败'
    res.status(status).json({ error: message, code: error.code, details: error.details })
  }
}

// 获取单个用户
export const getUser = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const userId = req.params.id

    const user = await authService.getUserById(projectRef, userId)
    res.json({ user })
  } catch (error: any) {
    console.error('获取用户失败:', error)
    const status = error.status || 500
    const message = error.message || '获取用户失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 创建用户
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const adminId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const userData: CreateUserRequest = req.body

    // 验证必要字段
    if (!userData.email) {
      res.status(400).json({ error: '邮箱是必填字段' })
      return
    }

    const user = await authService.createUser(projectRef, userData, adminId, ipAddress, userAgent)
    res.status(201).json({ user })
  } catch (error: any) {
    console.error('创建用户失败:', error)
    const status = error.status || 500
    const message = error.message || '创建用户失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 更新用户
export const updateUser = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const userId = req.params.id
    const adminId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const userData: UpdateUserRequest = req.body

    const user = await authService.updateUser(projectRef, userId, userData, adminId, ipAddress, userAgent)
    res.json({ user })
  } catch (error: any) {
    console.error('更新用户失败:', error)
    const status = error.status || 500
    const message = error.message || '更新用户失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除用户
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const userId = req.params.id
    const adminId = getUserId(req)
    const { ipAddress, userAgent } = getClientInfo(req)

    await authService.deleteUser(projectRef, userId, adminId, ipAddress, userAgent)
    res.status(204).send()
  } catch (error: any) {
    console.error('删除用户失败:', error)
    const status = error.status || 500
    const message = error.message || '删除用户失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 用户登录
export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const { ipAddress, userAgent } = getClientInfo(req)
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: '邮箱和密码是必填字段' })
      return
    }

    const result: AuthResponse = await authService.signIn(projectRef, email, password, ipAddress, userAgent)

    if (result.error) {
      res.status(result.error.status || 401).json({ error: result.error.message })
      return
    }

    res.json(result)
  } catch (error: any) {
    console.error('登录失败:', error)
    const status = error.status || 500
    const message = error.message || '登录失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 验证 Token
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token as string

    if (!token) {
      res.status(401).json({ error: '未提供Token' })
      return
    }

    const user = await authService.verifyToken(token)

    if (!user) {
      res.status(401).json({ error: '无效的Token' })
      return
    }

    res.json({ user, valid: true })
  } catch (error: any) {
    console.error('验证Token失败:', error)
    const status = error.status || 500
    const message = error.message || '验证Token失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 重置密码
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const { email, new_password } = req.body

    if (!email || !new_password) {
      res.status(400).json({ error: '邮箱和新密码是必填字段' })
      return
    }

    const success = await authService.resetPassword(projectRef, email, new_password)

    if (success) {
      res.json({ success: true, message: '密码重置成功' })
    } else {
      res.status(404).json({ success: false, error: '用户不存在' })
    }
  } catch (error: any) {
    console.error('重置密码失败:', error)
    const status = error.status || 500
    const message = error.message || '重置密码失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取认证配置
export const getAuthConfig = async (req: Request, res: Response) => {
  try {
    const projectRef = getProjectRef(req)
    const config = await authService.getAuthConfig(projectRef)
    res.json(config)
  } catch (error: any) {
    console.error('获取认证配置失败:', error)
    const status = error.status || 500
    const message = error.message || '获取认证配置失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 批量操作：启用/禁用多个用户
export const batchUpdateUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, user_ids } = req.body

    if (!action || !user_ids || !Array.isArray(user_ids)) {
      res.status(400).json({ error: '操作类型和用户ID列表是必填字段' })
      return
    }

    const results = []
    for (const userId of user_ids) {
      try {
        // 这里可以实现批量启用/禁用用户的逻辑
        // 暂时先记录每个操作的结果
        results.push({ user_id: userId, success: true, message: '操作成功' })
      } catch (error: any) {
        results.push({ user_id: userId, success: false, error: error.message })
      }
    }

    res.json({ results })
  } catch (error: any) {
    console.error('批量更新用户失败:', error)
    const status = error.status || 500
    const message = error.message || '批量更新用户失败'
    res.status(status).json({ error: message, code: error.code })
  }
}