/**
 * Supabase Database 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */

import { Request, Response } from 'express'
import { DatabaseService } from './service'
import {
  SQLQueryRequest,
  TableSchema,
  QueryParams,
  BatchOperationRequest
} from './types'

const databaseService = new DatabaseService()

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

// 执行 SQL 查询
export const executeSQL = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const sqlRequest: SQLQueryRequest = req.body

    if (!sqlRequest.query) {
      res.status(400).json({ error: 'SQL 查询语句是必填字段' })
      return
    }

    const result = await databaseService.executeSQL(projectRef, sqlRequest)
    res.json(result)
  } catch (error: any) {
    console.error('执行 SQL 查询失败:', error)
    const status = error.status || 500
    const message = error.message || '执行 SQL 查询失败'
    res.status(status).json({ error: message, code: error.code, details: error.details })
  }
}

// 列出所有表
export const listTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const schema = req.query.schema as string || 'public'

    const tables = await databaseService.listTables(projectRef, schema)
    res.json({ tables })
  } catch (error: any) {
    console.error('列出表失败:', error)
    const status = error.status || 500
    const message = error.message || '列出表失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取表结构
export const getTableSchema = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableName = req.params.tableName
    const schema = req.query.schema as string || 'public'

    if (!tableName) {
      res.status(400).json({ error: '表名是必填字段' })
      return
    }

    const tableSchema = await databaseService.getTableSchema(projectRef, tableName, schema)
    res.json({ table: tableSchema })
  } catch (error: any) {
    console.error('获取表结构失败:', error)
    const status = error.status || 500
    const message = error.message || '获取表结构失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 创建表
export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableSchema: TableSchema = req.body

    if (!tableSchema.name || !tableSchema.columns || tableSchema.columns.length === 0) {
      res.status(400).json({ error: '表名和列定义是必填字段' })
      return
    }

    const result = await databaseService.createTable(projectRef, tableSchema)
    res.json(result)
  } catch (error: any) {
    console.error('创建表失败:', error)
    const status = error.status || 500
    const message = error.message || '创建表失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除表
export const dropTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableName = req.params.tableName
    const schema = req.query.schema as string || 'public'
    const cascade = req.query.cascade === 'true'

    if (!tableName) {
      res.status(400).json({ error: '表名是必填字段' })
      return
    }

    const result = await databaseService.dropTable(projectRef, schema, tableName, cascade)
    res.json(result)
  } catch (error: any) {
    console.error('删除表失败:', error)
    const status = error.status || 500
    const message = error.message || '删除表失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 查询数据 (PostgREST 风格)
export const queryData = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableName = req.params.tableName
    const schema = req.query.schema as string || 'public'

    if (!tableName) {
      res.status(400).json({ error: '表名是必填字段' })
      return
    }

    // 解析查询参数
    const params: QueryParams = {
      select: req.query.select as string,
      where: req.query.where ? JSON.parse(req.query.where as string) : {},
      order: req.query.order ? JSON.parse(req.query.order as string) : {},
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    }

    const result = await databaseService.queryData(projectRef, tableName, params, schema)
    res.json(result)
  } catch (error: any) {
    console.error('查询数据失败:', error)
    const status = error.status || 500
    const message = error.message || '查询数据失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 插入数据
export const insertData = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableName = req.params.tableName
    const schema = req.query.schema as string || 'public'
    const data = req.body

    if (!tableName || !data) {
      res.status(400).json({ error: '表名和数据是必填字段' })
      return
    }

    const result = await databaseService.insertData(projectRef, tableName, data, schema)
    res.json(result)
  } catch (error: any) {
    console.error('插入数据失败:', error)
    const status = error.status || 500
    const message = error.message || '插入数据失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 更新数据
export const updateData = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableName = req.params.tableName
    const schema = req.query.schema as string || 'public'
    const { data, where } = req.body

    if (!tableName || !data) {
      res.status(400).json({ error: '表名和更新数据是必填字段' })
      return
    }

    const result = await databaseService.updateData(projectRef, tableName, data, where || {}, schema)
    res.json(result)
  } catch (error: any) {
    console.error('更新数据失败:', error)
    const status = error.status || 500
    const message = error.message || '更新数据失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 删除数据
export const deleteData = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const tableName = req.params.tableName
    const schema = req.query.schema as string || 'public'
    const where = req.query.where ? JSON.parse(req.query.where as string) : {}

    if (!tableName) {
      res.status(400).json({ error: '表名是必填字段' })
      return
    }

    const result = await databaseService.deleteData(projectRef, tableName, where, schema)
    res.json(result)
  } catch (error: any) {
    console.error('删除数据失败:', error)
    const status = error.status || 500
    const message = error.message || '删除数据失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 批量操作
export const batchOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)
    const batchRequest: BatchOperationRequest = req.body

    if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
      res.status(400).json({ error: '操作列表是必填字段' })
      return
    }

    const result = await databaseService.batchOperation(projectRef, batchRequest)
    res.json(result)
  } catch (error: any) {
    console.error('批量操作失败:', error)
    const status = error.status || 500
    const message = error.message || '批量操作失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 获取数据库统计信息
export const getDatabaseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectRef = getProjectRef(req)

    const stats = await databaseService.getDatabaseStats(projectRef)
    res.json(stats)
  } catch (error: any) {
    console.error('获取数据库统计信息失败:', error)
    const status = error.status || 500
    const message = error.message || '获取数据库统计信息失败'
    res.status(status).json({ error: message, code: error.code })
  }
}

// 健康检查
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    service: 'supabase-database',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}