/**
 * Supabase Storage 模块类型定义
 * 与官方 Supabase Storage API 完全兼容
 */
export interface StorageBucket {
    id: string;
    name: string;
    owner: string;
    created_at: string;
    updated_at: string;
    public: boolean;
    allowed_mime_types?: string[];
    file_size_limit?: number;
    avif_autodetection?: boolean;
}
export interface StorageObject {
    name: string;
    bucket_id: string;
    owner: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
    buckets: StorageBucket;
}
export interface UploadFileRequest {
    file: Buffer | string;
    path: string;
    bucket: string;
    contentType?: string;
    metadata?: Record<string, any>;
    cacheControl?: string;
    upsert?: boolean;
}
export interface DownloadFileResponse {
    data: Buffer;
    contentType: string;
    contentLength: number;
    lastModified: string;
    etag: string;
    metadata: Record<string, any>;
}
export interface ListFilesParams {
    limit?: number;
    offset?: number;
    sortBy?: {
        column: 'name' | 'updated_at' | 'created_at' | 'size';
        order: 'asc' | 'desc';
    };
    search?: string;
    prefix?: string;
}
export interface ListFilesResponse {
    files: StorageObject[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
export interface CreateBucketRequest {
    name: string;
    public?: boolean;
    allowed_mime_types?: string[];
    file_size_limit?: number;
    avif_autodetection?: boolean;
}
export interface UpdateBucketRequest {
    public?: boolean;
    allowed_mime_types?: string[];
    file_size_limit?: number;
    avif_autodetection?: boolean;
}
export interface SignedURLRequest {
    expiresIn?: number;
    download?: boolean;
    transform?: {
        width?: number;
        height?: number;
        resize?: 'cover' | 'contain' | 'fill';
        format?: 'origin' | 'avif' | 'webp' | 'jpeg' | 'png';
        quality?: number;
    };
}
export interface SignedURLResponse {
    signedUrl: string;
    path: string;
    expiresAt: string;
}
export interface BatchStorageOperationRequest {
    operations: Array<{
        type: 'upload' | 'copy' | 'move' | 'delete';
        src_path?: string;
        dest_path?: string;
        bucket?: string;
        file?: Buffer | string;
        metadata?: Record<string, any>;
    }>;
    atomic?: boolean;
}
export interface BatchStorageOperationResponse {
    results: Array<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    atomic: boolean;
    success: boolean;
}
export interface StorageError {
    code: string;
    message: string;
    status: number;
    details?: any;
}
export declare const STORAGE_ERRORS: {
    readonly BUCKET_NOT_FOUND: {
        readonly code: "BUCKET_NOT_FOUND";
        readonly message: "Bucket 不存在";
        readonly status: 404;
    };
    readonly FILE_NOT_FOUND: {
        readonly code: "FILE_NOT_FOUND";
        readonly message: "文件不存在";
        readonly status: 404;
    };
    readonly BUCKET_ALREADY_EXISTS: {
        readonly code: "BUCKET_ALREADY_EXISTS";
        readonly message: "Bucket 已存在";
        readonly status: 409;
    };
    readonly FILE_ALREADY_EXISTS: {
        readonly code: "FILE_ALREADY_EXISTS";
        readonly message: "文件已存在";
        readonly status: 409;
    };
    readonly INVALID_FILE_TYPE: {
        readonly code: "INVALID_FILE_TYPE";
        readonly message: "无效的文件类型";
        readonly status: 400;
    };
    readonly FILE_TOO_LARGE: {
        readonly code: "FILE_TOO_LARGE";
        readonly message: "文件太大";
        readonly status: 413;
    };
    readonly PERMISSION_DENIED: {
        readonly code: "PERMISSION_DENIED";
        readonly message: "权限不足";
        readonly status: 403;
    };
    readonly STORAGE_QUOTA_EXCEEDED: {
        readonly code: "STORAGE_QUOTA_EXCEEDED";
        readonly message: "存储配额已满";
        readonly status: 507;
    };
    readonly UPLOAD_FAILED: {
        readonly code: "UPLOAD_FAILED";
        readonly message: "文件上传失败";
        readonly status: 500;
    };
    readonly DOWNLOAD_FAILED: {
        readonly code: "DOWNLOAD_FAILED";
        readonly message: "文件下载失败";
        readonly status: 500;
    };
};
export interface StorageStats {
    total_buckets: number;
    total_files: number;
    total_size: number;
    used_quota: number;
    total_quota: number;
    last_backup?: string;
}
export interface StorageEvent {
    type: 'upload' | 'download' | 'delete' | 'copy' | 'move';
    bucket: string;
    path: string;
    size?: number;
    timestamp: string;
    performed_by: string;
}
//# sourceMappingURL=types.d.ts.map