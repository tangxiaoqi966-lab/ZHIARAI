/**
 * Supabase Storage 模块类型定义
 * 与官方 Supabase Storage API 完全兼容
 */

// Bucket 定义
export interface StorageBucket {
  id: string
  name: string
  owner: string
  created_at: string
  updated_at: string
  public: boolean
  allowed_mime_types?: string[]
  file_size_limit?: number
  avif_autodetection?: boolean
}

// 文件对象定义
export interface StorageObject {
  name: string
  bucket_id: string
  owner: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: Record<string, any>
  buckets: StorageBucket
}

// 文件上传请求
export interface UploadFileRequest {
  file: Buffer | string
  path: string
  bucket: string
  contentType?: string
  metadata?: Record<string, any>
  cacheControl?: string
  upsert?: boolean
}

// 文件下载响应
export interface DownloadFileResponse {
  data: Buffer
  contentType: string
  contentLength: number
  lastModified: string
  etag: string
  metadata: Record<string, any>
}

// 文件列表请求参数
export interface ListFilesParams {
  limit?: number
  offset?: number
  sortBy?: {
    column: 'name' | 'updated_at' | 'created_at' | 'size'
    order: 'asc' | 'desc'
  }
  search?: string
  prefix?: string
}

// 文件列表响应
export interface ListFilesResponse {
  files: StorageObject[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Bucket 创建请求
export interface CreateBucketRequest {
  name: string
  public?: boolean
  allowed_mime_types?: string[]
  file_size_limit?: number
  avif_autodetection?: boolean
}

// Bucket 更新请求
export interface UpdateBucketRequest {
  public?: boolean
  allowed_mime_types?: string[]
  file_size_limit?: number
  avif_autodetection?: boolean
}

// 文件签名 URL 请求
export interface SignedURLRequest {
  expiresIn?: number // 秒
  download?: boolean
  transform?: {
    width?: number
    height?: number
    resize?: 'cover' | 'contain' | 'fill'
    format?: 'origin' | 'avif' | 'webp' | 'jpeg' | 'png'
    quality?: number
  }
}

// 文件签名 URL 响应
export interface SignedURLResponse {
  signedUrl: string
  path: string
  expiresAt: string
}

// 批量操作请求
export interface BatchStorageOperationRequest {
  operations: Array<{
    type: 'upload' | 'copy' | 'move' | 'delete'
    src_path?: string
    dest_path?: string
    bucket?: string
    file?: Buffer | string
    metadata?: Record<string, any>
  }>
  atomic?: boolean
}

// 批量操作响应
export interface BatchStorageOperationResponse {
  results: Array<{
    success: boolean
    data?: any
    error?: string
  }>
  atomic: boolean
  success: boolean
}

// 错误类型
export interface StorageError {
  code: string
  message: string
  status: number
  details?: any
}

// 常量
export const STORAGE_ERRORS = {
  BUCKET_NOT_FOUND: { code: 'BUCKET_NOT_FOUND', message: 'Bucket 不存在', status: 404 },
  FILE_NOT_FOUND: { code: 'FILE_NOT_FOUND', message: '文件不存在', status: 404 },
  BUCKET_ALREADY_EXISTS: { code: 'BUCKET_ALREADY_EXISTS', message: 'Bucket 已存在', status: 409 },
  FILE_ALREADY_EXISTS: { code: 'FILE_ALREADY_EXISTS', message: '文件已存在', status: 409 },
  INVALID_FILE_TYPE: { code: 'INVALID_FILE_TYPE', message: '无效的文件类型', status: 400 },
  FILE_TOO_LARGE: { code: 'FILE_TOO_LARGE', message: '文件太大', status: 413 },
  PERMISSION_DENIED: { code: 'PERMISSION_DENIED', message: '权限不足', status: 403 },
  STORAGE_QUOTA_EXCEEDED: { code: 'STORAGE_QUOTA_EXCEEDED', message: '存储配额已满', status: 507 },
  UPLOAD_FAILED: { code: 'UPLOAD_FAILED', message: '文件上传失败', status: 500 },
  DOWNLOAD_FAILED: { code: 'DOWNLOAD_FAILED', message: '文件下载失败', status: 500 }
} as const

// 存储统计信息
export interface StorageStats {
  total_buckets: number
  total_files: number
  total_size: number
  used_quota: number
  total_quota: number
  last_backup?: string
}

// 文件操作事件
export interface StorageEvent {
  type: 'upload' | 'download' | 'delete' | 'copy' | 'move'
  bucket: string
  path: string
  size?: number
  timestamp: string
  performed_by: string
}