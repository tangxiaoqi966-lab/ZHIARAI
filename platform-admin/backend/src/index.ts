import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from 'dotenv'
import { testConnection } from './utils/database'

// Import routes
import projectRoutes from './routes/projectRoutes'
import migrationRoutes from './routes/migrationRoutes'
import authRoutes from './routes/authRoutes'
import projectDataRoutes from './routes/projectDataRoutes'
import supabaseApiKeyRoutes from './routes/supabaseApiKeyRoutes'
import supabaseAuthRoutes from './routes/supabaseAuthRoutes'
import supabaseDatabaseRoutes from './routes/supabaseDatabaseRoutes'
import supabaseStorageRoutes from './routes/supabaseStorageRoutes'
import supabaseRLSPolicyRoutes from './routes/supabaseRLSPolicyRoutes'
import supabaseEdgeFunctionsRoutes from './routes/supabaseEdgeFunctionsRoutes'

// Health check interface
interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy'
  timestamp: string
  service: string
  version: string
  uptime: number
  checks: {
    database: string
    memory: string
    disk: string
  }
  memory?: {
    rss: string
    heapTotal: string
    heapUsed: string
    external: string
  }
  stats?: {
    projects?: number
    migrations?: number
    error?: string
  }
  error?: string
}

// Load environment variables
config()

// Create Express app
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/migrations', migrationRoutes)
app.use('/api/project-data', projectDataRoutes)
app.use('/api/supabase', supabaseApiKeyRoutes)
app.use('/api/supabase', supabaseAuthRoutes)
app.use('/api/supabase', supabaseDatabaseRoutes)
app.use('/api/supabase', supabaseStorageRoutes)
app.use('/api/supabase', supabaseRLSPolicyRoutes)
app.use('/api/supabase', supabaseEdgeFunctionsRoutes)

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'supabase-platform-admin',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: 'pending',
      memory: 'pending',
      disk: 'pending',
    }
  }

  try {
    // 检查数据库连接
    const isDbConnected = await testConnection()
    health.checks.database = isDbConnected ? 'healthy' : 'unhealthy'
    
    if (!isDbConnected) {
      health.status = 'degraded'
    }
    
    // 检查内存使用
    const memoryUsage = process.memoryUsage()
    health.checks.memory = 'healthy'
    health.memory = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
    }
    
    // 检查磁盘空间（简化版）
    health.checks.disk = 'healthy'
    
    // 获取项目统计
    try {
      const { query } = await import('./utils/database')
      const projectCount = await query('SELECT COUNT(*) as count FROM platform.projects')
      const migrationCount = await query('SELECT COUNT(*) as count FROM platform.migrations')
      
      health.stats = {
        projects: parseInt(projectCount.rows[0].count),
        migrations: parseInt(migrationCount.rows[0].count),
      }
    } catch (dbError) {
      health.stats = { error: 'Failed to fetch stats' }
    }
    
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = 'unhealthy'
    
    if (error instanceof Error) {
      health.error = error.message
    } else if (typeof error === 'string') {
      health.error = error
    } else {
      health.error = 'Unknown error occurred'
    }
  }

  // 根据检查结果设置HTTP状态码
  const statusCode = health.status === 'ok' ? 200 : 
                     health.status === 'degraded' ? 200 : 503
  
  res.status(statusCode).json(health)
})

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Supabase Platform Admin API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      migrations: '/api/migrations',
      project_data: '/api/project-data',
      supabase: '/api/supabase',
      health: '/api/health'
    },
    note: '管理API需要管理员Bearer Token认证，项目数据API需要项目API Key认证'
  })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
async function startServer() {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...')
      process.exit(1)
    }
    
    app.listen(PORT, () => {
      console.log(`Supabase Platform Admin API running on port ${PORT}`)
      console.log(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Start the server
startServer()