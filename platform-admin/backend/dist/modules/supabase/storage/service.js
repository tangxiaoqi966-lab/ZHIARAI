"use strict";
/**
 * Supabase Storage 服务
 * 提供存储管理功能，与官方 Supabase Storage API 完全兼容
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const types_1 = require("./types");
(0, dotenv_1.config)();
// 数据库连接池
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'supabase_platform_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});
// 存储根目录
const STORAGE_ROOT = process.env.STORAGE_ROOT || './storage';
// 转换数据库行到 Bucket 对象
function rowToBucket(row) {
    return {
        id: row.id,
        name: row.name,
        owner: row.owner,
        created_at: row.created_at,
        updated_at: row.updated_at,
        public: row.public,
        allowed_mime_types: row.allowed_mime_types,
        file_size_limit: row.file_size_limit,
        avif_autodetection: row.avif_autodetection
    };
}
// 转换数据库行到文件对象
function rowToStorageObject(row) {
    return {
        name: row.name,
        bucket_id: row.bucket_id,
        owner: row.owner,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_accessed_at: row.last_accessed_at,
        metadata: row.metadata || {},
        buckets: rowToBucket(row)
    };
}
class StorageService {
    // 获取项目ID
    async getProjectId(projectRef) {
        try {
            const result = await pool.query('SELECT project_id FROM supabase.project_metadata WHERE supabase_project_ref = $1', [projectRef]);
            return result.rows[0]?.project_id || null;
        }
        catch (error) {
            console.error('获取项目ID失败:', error);
            return null;
        }
    }
    // 列出所有 Bucket
    async listBuckets(projectRef) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            const result = await pool.query('SELECT * FROM supabase.storage_buckets WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
            return result.rows.map(rowToBucket);
        }
        catch (error) {
            console.error('列出 Bucket 失败:', error);
            throw error.code ? error : { code: 'LIST_BUCKETS_FAILED', message: '获取 Bucket 列表失败', status: 500 };
        }
    }
    // 获取单个 Bucket
    async getBucket(projectRef, bucketName) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            const result = await pool.query('SELECT * FROM supabase.storage_buckets WHERE project_id = $1 AND name = $2', [projectId, bucketName]);
            if (result.rows.length === 0) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            return rowToBucket(result.rows[0]);
        }
        catch (error) {
            console.error('获取 Bucket 失败:', error);
            throw error.code ? error : { code: 'GET_BUCKET_FAILED', message: '获取 Bucket 失败', status: 500 };
        }
    }
    // 创建 Bucket
    async createBucket(projectRef, bucketRequest, owner) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            // 检查 Bucket 是否已存在
            const existing = await pool.query('SELECT id FROM supabase.storage_buckets WHERE project_id = $1 AND name = $2', [projectId, bucketRequest.name]);
            if (existing.rows.length > 0) {
                throw types_1.STORAGE_ERRORS.BUCKET_ALREADY_EXISTS;
            }
            const bucketId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            const result = await pool.query(`INSERT INTO supabase.storage_buckets (
          id, project_id, name, owner, created_at, updated_at, public,
          allowed_mime_types, file_size_limit, avif_autodetection
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`, [
                bucketId,
                projectId,
                bucketRequest.name,
                owner,
                now,
                now,
                bucketRequest.public || false,
                bucketRequest.allowed_mime_types || null,
                bucketRequest.file_size_limit || null,
                bucketRequest.avif_autodetection || false
            ]);
            // 创建 Bucket 目录
            const bucketPath = path_1.default.join(STORAGE_ROOT, projectRef, bucketRequest.name);
            if (!fs_1.default.existsSync(bucketPath)) {
                fs_1.default.mkdirSync(bucketPath, { recursive: true });
            }
            return rowToBucket(result.rows[0]);
        }
        catch (error) {
            console.error('创建 Bucket 失败:', error);
            throw error.code ? error : { code: 'CREATE_BUCKET_FAILED', message: '创建 Bucket 失败', status: 500 };
        }
    }
    // 更新 Bucket
    async updateBucket(projectRef, bucketName, bucketRequest, updatedBy) {
        void updatedBy;
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            const now = new Date().toISOString();
            const updateFields = ['updated_at = $1'];
            const updateValues = [now];
            let paramIndex = 2;
            if (bucketRequest.public !== undefined) {
                updateFields.push(`public = $${paramIndex}`);
                updateValues.push(bucketRequest.public);
                paramIndex++;
            }
            if (bucketRequest.allowed_mime_types !== undefined) {
                updateFields.push(`allowed_mime_types = $${paramIndex}`);
                updateValues.push(bucketRequest.allowed_mime_types);
                paramIndex++;
            }
            if (bucketRequest.file_size_limit !== undefined) {
                updateFields.push(`file_size_limit = $${paramIndex}`);
                updateValues.push(bucketRequest.file_size_limit);
                paramIndex++;
            }
            if (bucketRequest.avif_autodetection !== undefined) {
                updateFields.push(`avif_autodetection = $${paramIndex}`);
                updateValues.push(bucketRequest.avif_autodetection);
                paramIndex++;
            }
            updateValues.push(projectId, bucketName);
            const result = await pool.query(`UPDATE supabase.storage_buckets 
         SET ${updateFields.join(', ')} 
         WHERE project_id = $${paramIndex} AND name = $${paramIndex + 1}
         RETURNING *`, updateValues);
            if (result.rows.length === 0) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            return rowToBucket(result.rows[0]);
        }
        catch (error) {
            console.error('更新 Bucket 失败:', error);
            throw error.code ? error : { code: 'UPDATE_BUCKET_FAILED', message: '更新 Bucket 失败', status: 500 };
        }
    }
    // 删除 Bucket
    async deleteBucket(projectRef, bucketName) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            // 删除 Bucket 目录
            const bucketPath = path_1.default.join(STORAGE_ROOT, projectRef, bucketName);
            if (fs_1.default.existsSync(bucketPath)) {
                fs_1.default.rmSync(bucketPath, { recursive: true });
            }
            // 删除数据库记录
            await pool.query('DELETE FROM supabase.storage_buckets WHERE project_id = $1 AND name = $2', [projectId, bucketName]);
        }
        catch (error) {
            console.error('删除 Bucket 失败:', error);
            throw error.code ? error : { code: 'DELETE_BUCKET_FAILED', message: '删除 Bucket 失败', status: 500 };
        }
    }
    // 列出文件
    async listFiles(projectRef, bucketName, params = {}) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            const { limit = 100, offset = 0, sortBy, search, prefix } = params;
            let query = `
        SELECT so.*, sb.*, COUNT(*) OVER() as total_count
        FROM supabase.storage_objects so
        JOIN supabase.storage_buckets sb ON so.bucket_id = sb.id
        WHERE sb.project_id = $1 AND sb.name = $2
      `;
            const queryParams = [projectId, bucketName];
            let paramIndex = 3;
            if (prefix) {
                query += ` AND so.name LIKE $${paramIndex}`;
                queryParams.push(`${prefix}%`);
                paramIndex++;
            }
            if (search) {
                query += ` AND so.name ILIKE $${paramIndex}`;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }
            // 排序
            const orderBy = sortBy ? `${sortBy.column} ${sortBy.order}` : 'so.created_at DESC';
            query += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(limit, offset);
            const result = await pool.query(query, queryParams);
            const total = parseInt(result.rows[0]?.total_count || '0');
            const files = result.rows.map(rowToStorageObject);
            return {
                files,
                total,
                page: Math.floor(offset / limit) + 1,
                per_page: limit,
                total_pages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            console.error('列出文件失败:', error);
            throw error.code ? error : { code: 'LIST_FILES_FAILED', message: '获取文件列表失败', status: 500 };
        }
    }
    // 上传文件
    async uploadFile(projectRef, uploadRequest) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            // 获取 Bucket 信息
            const bucket = await this.getBucket(projectRef, uploadRequest.bucket);
            // 检查文件大小限制
            if (bucket.file_size_limit) {
                const fileSize = Buffer.isBuffer(uploadRequest.file)
                    ? uploadRequest.file.length
                    : Buffer.from(uploadRequest.file).length;
                if (fileSize > bucket.file_size_limit) {
                    throw types_1.STORAGE_ERRORS.FILE_TOO_LARGE;
                }
            }
            // 检查文件类型
            if (bucket.allowed_mime_types && uploadRequest.contentType) {
                if (!bucket.allowed_mime_types.includes(uploadRequest.contentType)) {
                    throw types_1.STORAGE_ERRORS.INVALID_FILE_TYPE;
                }
            }
            // 构建文件路径
            const filePath = path_1.default.join(STORAGE_ROOT, projectRef, uploadRequest.bucket, uploadRequest.path);
            const fileDir = path_1.default.dirname(filePath);
            // 确保目录存在
            if (!fs_1.default.existsSync(fileDir)) {
                fs_1.default.mkdirSync(fileDir, { recursive: true });
            }
            // 写入文件
            const fileData = Buffer.isBuffer(uploadRequest.file)
                ? uploadRequest.file
                : Buffer.from(uploadRequest.file);
            fs_1.default.writeFileSync(filePath, fileData);
            // 保存文件元数据到数据库
            const fileId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            const fileName = path_1.default.basename(uploadRequest.path);
            const result = await pool.query(`INSERT INTO supabase.storage_objects (
          id, bucket_id, name, owner, created_at, updated_at, 
          last_accessed_at, metadata, size, content_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (bucket_id, name) 
        ${uploadRequest.upsert ? 'DO UPDATE SET updated_at = EXCLUDED.updated_at, metadata = EXCLUDED.metadata' : 'DO NOTHING'}
        RETURNING *, (SELECT row_to_json(sb) FROM supabase.storage_buckets sb WHERE sb.id = $2) as buckets`, [
                fileId,
                bucket.id,
                fileName,
                'system', // TODO: 获取实际用户
                now,
                now,
                now,
                uploadRequest.metadata || {},
                fileData.length,
                uploadRequest.contentType || 'application/octet-stream'
            ]);
            if (result.rows.length === 0) {
                throw types_1.STORAGE_ERRORS.FILE_ALREADY_EXISTS;
            }
            return rowToStorageObject(result.rows[0]);
        }
        catch (error) {
            console.error('上传文件失败:', error);
            throw error.code ? error : { code: 'UPLOAD_FAILED', message: '文件上传失败', status: 500 };
        }
    }
    // 下载文件
    async downloadFile(projectRef, bucketName, filePath) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            // 获取文件元数据
            const result = await pool.query(`SELECT so.*, sb.*
         FROM supabase.storage_objects so
         JOIN supabase.storage_buckets sb ON so.bucket_id = sb.id
         WHERE sb.project_id = $1 AND sb.name = $2 AND so.name = $3`, [projectId, bucketName, path_1.default.basename(filePath)]);
            if (result.rows.length === 0) {
                throw types_1.STORAGE_ERRORS.FILE_NOT_FOUND;
            }
            const fileObject = rowToStorageObject(result.rows[0]);
            // 读取文件内容
            const fullPath = path_1.default.join(STORAGE_ROOT, projectRef, bucketName, filePath);
            if (!fs_1.default.existsSync(fullPath)) {
                throw types_1.STORAGE_ERRORS.FILE_NOT_FOUND;
            }
            const fileData = fs_1.default.readFileSync(fullPath);
            const stats = fs_1.default.statSync(fullPath);
            // 更新最后访问时间
            await pool.query('UPDATE supabase.storage_objects SET last_accessed_at = $1 WHERE id = $2', [new Date().toISOString(), fileObject.buckets.id]);
            return {
                data: fileData,
                contentType: fileObject.metadata.content_type || 'application/octet-stream',
                contentLength: stats.size,
                lastModified: stats.mtime.toISOString(),
                etag: `"${stats.mtime.getTime()}"`,
                metadata: fileObject.metadata
            };
        }
        catch (error) {
            console.error('下载文件失败:', error);
            throw error.code ? error : { code: 'DOWNLOAD_FAILED', message: '文件下载失败', status: 500 };
        }
    }
    // 删除文件
    async deleteFile(projectRef, bucketName, filePath) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            // 删除文件
            const fullPath = path_1.default.join(STORAGE_ROOT, projectRef, bucketName, filePath);
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
            // 删除数据库记录
            await pool.query(`DELETE FROM supabase.storage_objects 
         WHERE id IN (
           SELECT so.id 
           FROM supabase.storage_objects so
           JOIN supabase.storage_buckets sb ON so.bucket_id = sb.id
           WHERE sb.project_id = $1 AND sb.name = $2 AND so.name = $3
         )`, [projectId, bucketName, path_1.default.basename(filePath)]);
        }
        catch (error) {
            console.error('删除文件失败:', error);
            throw error.code ? error : { code: 'DELETE_FILE_FAILED', message: '删除文件失败', status: 500 };
        }
    }
    // 生成签名 URL
    async createSignedURL(projectRef, bucketName, filePath, signedRequest = {}) {
        try {
            const expiresIn = signedRequest.expiresIn || 3600; // 默认1小时
            const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
            // 简化实现：生成一个临时令牌
            const token = (0, uuid_1.v4)();
            const signedUrl = `https://${projectRef}.supabase.co/storage/v1/object/sign/${bucketName}/${filePath}?token=${token}&download=${signedRequest.download || false}`;
            return {
                signedUrl,
                path: filePath,
                expiresAt
            };
        }
        catch (error) {
            console.error('生成签名 URL 失败:', error);
            throw error.code ? error : { code: 'SIGNED_URL_FAILED', message: '生成签名 URL 失败', status: 500 };
        }
    }
    // 批量操作
    async batchOperation(projectRef, batchRequest) {
        const results = [];
        for (const operation of batchRequest.operations) {
            try {
                let result;
                switch (operation.type) {
                    case 'upload':
                        if (!operation.file || !operation.bucket || !operation.dest_path) {
                            throw new Error('上传操作需要 file、bucket 和 dest_path');
                        }
                        const uploadResult = await this.uploadFile(projectRef, {
                            file: operation.file,
                            bucket: operation.bucket,
                            path: operation.dest_path,
                            metadata: operation.metadata
                        });
                        result = { success: true, data: uploadResult };
                        break;
                    case 'delete':
                        if (!operation.bucket || !operation.src_path) {
                            throw new Error('删除操作需要 bucket 和 src_path');
                        }
                        await this.deleteFile(projectRef, operation.bucket, operation.src_path);
                        result = { success: true, data: null };
                        break;
                    default:
                        result = { success: false, error: `不支持的操作类型: ${operation.type}` };
                }
                results.push(result);
            }
            catch (error) {
                results.push({ success: false, error: error.message });
                if (batchRequest.atomic) {
                    // 原子操作失败，回滚已成功的操作
                    // 简化实现：直接返回失败
                    return {
                        results,
                        atomic: true,
                        success: false
                    };
                }
            }
        }
        return {
            results,
            atomic: batchRequest.atomic || false,
            success: results.every(r => r.success)
        };
    }
    // 获取存储统计信息
    async getStorageStats(projectRef) {
        try {
            const projectId = await this.getProjectId(projectRef);
            if (!projectId) {
                throw types_1.STORAGE_ERRORS.BUCKET_NOT_FOUND;
            }
            // 获取 Bucket 数量
            const bucketsResult = await pool.query('SELECT COUNT(*) as total_buckets FROM supabase.storage_buckets WHERE project_id = $1', [projectId]);
            // 获取文件数量和总大小
            const filesResult = await pool.query(`SELECT COUNT(*) as total_files, COALESCE(SUM(size), 0) as total_size
         FROM supabase.storage_objects so
         JOIN supabase.storage_buckets sb ON so.bucket_id = sb.id
         WHERE sb.project_id = $1`, [projectId]);
            // 计算存储配额（简化）
            const total_quota = 10 * 1024 * 1024 * 1024; // 10GB
            const used_quota = parseInt(filesResult.rows[0]?.total_size || '0');
            return {
                total_buckets: parseInt(bucketsResult.rows[0]?.total_buckets || '0'),
                total_files: parseInt(filesResult.rows[0]?.total_files || '0'),
                total_size: used_quota,
                used_quota,
                total_quota
            };
        }
        catch (error) {
            console.error('获取存储统计信息失败:', error);
            throw error.code ? error : { code: 'GET_STATS_FAILED', message: '获取存储统计信息失败', status: 500 };
        }
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=service.js.map