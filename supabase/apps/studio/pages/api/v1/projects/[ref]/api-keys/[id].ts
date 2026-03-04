import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import {
  apiKeysStorage,
  getProjectStorageKey,
} from '../api-keys'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { ref: projectRef, id } = req.query

  if (!projectRef || typeof projectRef !== 'string') {
    return res.status(400).json({ data: null, error: { message: 'Project ref is required' } })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ data: null, error: { message: 'API key ID is required' } })
  }

  switch (method) {
    case 'GET':
      return handleGetSingle(req, res, projectRef, id)
    case 'PUT':
      return handleUpdate(req, res, projectRef, id)
    case 'DELETE':
      return handleDelete(req, res, projectRef, id)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

// 获取单个API密钥
const handleGetSingle = async (req: NextApiRequest, res: NextApiResponse, projectRef: string, id: string) => {
  const { reveal } = req.query
  const shouldReveal = reveal === 'true'

  // 检查是否是旧密钥
  if (id === 'anon' || id === 'service_role') {
    const legacyKey = {
      name: id,
      api_key: shouldReveal 
        ? (id === 'anon' ? process.env.SUPABASE_ANON_KEY ?? '' : process.env.SUPABASE_SERVICE_KEY ?? '')
        : '••••••••' + (id === 'anon' 
            ? (process.env.SUPABASE_ANON_KEY?.substring(8) || '')
            : (process.env.SUPABASE_SERVICE_KEY?.substring(8) || '')),
      id,
      type: 'legacy' as const,
      hash: '',
      prefix: '',
      description: id === 'anon' ? 'Legacy anon API key' : 'Legacy service_role API key',
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return res.status(200).json(legacyKey)
  }

  const storageKey = getProjectStorageKey(projectRef)
  const existingKeys = apiKeysStorage.get(storageKey) || []

  const apiKey = existingKeys.find(key => key.id === id)
  if (!apiKey) {
    return res.status(404).json({ data: null, error: { message: 'API key not found' } })
  }

  // 根据reveal参数决定是否显示完整密钥
  const responseKey = {
    ...apiKey,
    api_key: shouldReveal ? apiKey.api_key : '••••••••' + (apiKey.api_key?.substring(8) || ''),
  }

  return res.status(200).json(responseKey)
}

// 更新API密钥
const handleUpdate = async (req: NextApiRequest, res: NextApiResponse, projectRef: string, id: string) => {
  try {
    const { name, description } = req.body

    // 不能更新旧密钥
    if (id === 'anon' || id === 'service_role') {
      return res.status(400).json({ data: null, error: { message: 'Cannot update legacy API keys' } })
    }

    const storageKey = getProjectStorageKey(projectRef)
    const existingKeys = apiKeysStorage.get(storageKey) || []

    const keyIndex = existingKeys.findIndex(key => key.id === id)
    if (keyIndex === -1) {
      return res.status(404).json({ data: null, error: { message: 'API key not found' } })
    }

    // 检查名称是否与其他密钥冲突
    if (name && existingKeys.some((key, index) => key.name === name && index !== keyIndex)) {
      return res.status(409).json({ data: null, error: { message: 'API key with this name already exists' } })
    }

    const updatedKey = {
      ...existingKeys[keyIndex],
      name: name || existingKeys[keyIndex].name,
      description: description !== undefined ? description : existingKeys[keyIndex].description,
      updated_at: new Date().toISOString(),
    }

    existingKeys[keyIndex] = updatedKey
    apiKeysStorage.set(storageKey, existingKeys)

    return res.status(200).json(updatedKey)
  } catch (error) {
    console.error('Error updating API key:', error)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
}

// 删除API密钥
const handleDelete = async (req: NextApiRequest, res: NextApiResponse, projectRef: string, id: string) => {
  try {
    // 不能删除旧密钥
    if (id === 'anon' || id === 'service_role') {
      return res.status(400).json({ data: null, error: { message: 'Cannot delete legacy API keys' } })
    }

    const storageKey = getProjectStorageKey(projectRef)
    const existingKeys = apiKeysStorage.get(storageKey) || []

    const keyIndex = existingKeys.findIndex(key => key.id === id)
    if (keyIndex === -1) {
      return res.status(404).json({ data: null, error: { message: 'API key not found' } })
    }

    const deletedKey = existingKeys[keyIndex]
    existingKeys.splice(keyIndex, 1)
    apiKeysStorage.set(storageKey, existingKeys)

    return res.status(200).json({ 
      message: 'API key deleted successfully',
      deletedKey: { id: deletedKey.id, name: deletedKey.name, type: deletedKey.type }
    })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
}