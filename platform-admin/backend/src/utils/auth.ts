import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'supabase-platform-admin-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// 生成JWT Token
export const generateToken = (userId: string, role: string = 'admin'): string => {
  const secret = JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  )
}

// 验证JWT Token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// 密码加密
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// 验证密码
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

// 认证中间件
export const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }
  
  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ error: '无效或过期的认证令牌' })
  }
  
  req.user = decoded
  next()
}

// 角色检查中间件
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要认证' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' })
    }
    
    next()
  }
}

// 生成默认管理员账户（开发用）
export const createDefaultAdmin = async () => {
  // 在实际应用中，应该从数据库读取用户信息
  // 这里为了简化，使用固定值
  const defaultAdmin = {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    // 密码: admin123 (经过哈希)
    passwordHash: '$2a$10$XQPX6Q6Q6Q6Q6Q6Q6Q6Q6.6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6',
  }
  
  return defaultAdmin
}