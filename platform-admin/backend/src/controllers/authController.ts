import { Request, Response } from 'express'
import { generateToken, createDefaultAdmin } from '../utils/auth'

// 登录
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' })
      return
    }
    
    // 在实际应用中，这里应该从数据库查询用户
    // 为了简化，我们使用默认管理员账户
    const defaultAdmin = await createDefaultAdmin()
    
    if (username !== defaultAdmin.username) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }
    
    // 验证密码
    // 注意：在实际应用中，应该使用 comparePassword 验证哈希密码
    // 这里为了简化，使用固定密码 'admin123'
    const isValidPassword = password === 'admin123'
    
    if (!isValidPassword) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }
    
    // 生成JWT Token
    const token = generateToken(defaultAdmin.id, defaultAdmin.role)
    
    res.json({
      token,
      user: {
        id: defaultAdmin.id,
        username: defaultAdmin.username,
        email: defaultAdmin.email,
        role: defaultAdmin.role,
      },
      expiresIn: '24h',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: '登录失败' })
  }
}

// 获取当前用户信息
export const getCurrentUser = async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' })
    }
    
    const defaultAdmin = await createDefaultAdmin()
    
    res.json({
      id: defaultAdmin.id,
      username: defaultAdmin.username,
      email: defaultAdmin.email,
      role: defaultAdmin.role,
    })
  } catch (error: any) {
    console.error('Get current user error:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
}

// 登出（客户端应删除token）
export const logout = async (req: Request, res: Response) => {
  res.json({ message: '登出成功' })
}

// 更新密码
export const updatePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '当前密码和新密码不能为空' })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少6位' })
    }
    
    // 验证当前密码
    const defaultAdmin = await createDefaultAdmin()
    const isValidPassword = currentPassword === 'admin123'
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '当前密码错误' })
    }
    
    // 在实际应用中，这里应该更新数据库中的密码哈希
    // 为了简化，我们只返回成功消息
    
    res.json({ message: '密码更新成功' })
  } catch (error: any) {
    console.error('Update password error:', error)
    res.status(500).json({ error: '密码更新失败' })
  }
}