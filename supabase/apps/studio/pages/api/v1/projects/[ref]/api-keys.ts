import { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes, createHash } from 'crypto'

import { components } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}
export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
}

// 内存存储（生产环境应使用数据库） - 导出以便 [id].ts 可以访问
export const apiKeysStorage: Map<string, any[]> = new Map()

// 生成安全的随机API密钥
export function generateApiKey(type: 'publishable' | 'secret'): string {
  const bytes = randomBytes(32)
  const key = bytes.toString('base64').replace(/[+/=]/g, '').substring(0, 32)
  const prefix = type === 'publishable' ? 'pk_' : 'sk_'
  return prefix + key
}

// 生成密钥哈希（用于验证）
export function generateHash(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

// 提取密钥前缀（前8个字符）
export function getPrefix(apiKey: string): string {
  return apiKey.substring(0, 8)
}

// 获取项目存储键
export function getProjectStorageKey(projectRef: string): string {
  return `project:${projectRef}:api-keys`
}

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { ref: projectRef } = req.query

  if (!projectRef || typeof projectRef !== 'string') {
    return res.status(400).json({ data: null, error: { message: 'Project ref is required' } })
  }

  switch (method) {
    case 'GET':
      return handleGetAll(req, res, projectRef)
    case 'POST':
      return handleCreate(req, res, projectRef)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

// 获取所有API密钥
const handleGetAll = async (req: NextApiRequest, res: NextApiResponse, projectRef: string) => {
  const { reveal } = req.query
  const shouldReveal = reveal === 'true'

  const storageKey = getProjectStorageKey(projectRef)
  const customKeys = apiKeysStorage.get(storageKey) || []

  // 始终包含旧密钥
  const legacyKeys = [
    {
      name: 'anon',
      api_key: shouldReveal ? (process.env.SUPABASE_ANON_KEY ?? '') : '••••••••' + (process.env.SUPABASE_ANON_KEY?.substring(8) || ''),
      id: 'anon',
      type: 'legacy' as const,
      hash: '',
      prefix: '',
      description: 'Legacy anon API key',
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'service_role',
      api_key: shouldReveal ? (process.env.SUPABASE_SERVICE_KEY ?? '') : '••••••••' + (process.env.SUPABASE_SERVICE_KEY?.substring(8) || ''),
      id: 'service_role',
      type: 'legacy' as const,
      hash: '',
      prefix: '',
      description: 'Legacy service_role API key',
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const allKeys = [...legacyKeys, ...customKeys]
  return res.status(200).json(allKeys)
}

// 创建新的API密钥
const handleCreate = async (req: NextApiRequest, res: NextApiResponse, projectRef: string) => {
  try {
    const { name, description, type } = req.body

    if (!name || !type) {
      return res.status(400).json({ data: null, error: { message: 'Name and type are required' } })
    }

    if (type !== 'publishable' && type !== 'secret') {
      return res.status(400).json({ data: null, error: { message: 'Type must be either "publishable" or "secret"' } })
    }

    const storageKey = getProjectStorageKey(projectRef)
    const existingKeys = apiKeysStorage.get(storageKey) || []

    // 检查名称是否已存在
    if (existingKeys.some(key => key.name === name)) {
      return res.status(409).json({ data: null, error: { message: 'API key with this name already exists' } })
    }

    // 生成API密钥
    const apiKey = generateApiKey(type)
    const hash = generateHash(apiKey)
    const prefix = getPrefix(apiKey)
    const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const newKey = {
      id,
      name,
      api_key: apiKey,
      type,
      description: description || null,
      hash,
      prefix,
      secret_jwt_template: type === 'secret' ? { role: 'service_role' } : null,
      inserted_at: now,
      updated_at: now,
    }

    existingKeys.push(newKey)
    apiKeysStorage.set(storageKey, existingKeys)

    return res.status(201).json(newKey)
  } catch (error) {
    console.error('Error creating API key:', error)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
}
