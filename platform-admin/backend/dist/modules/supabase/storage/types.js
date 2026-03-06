"use strict";
/**
 * Supabase Storage 模块类型定义
 * 与官方 Supabase Storage API 完全兼容
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_ERRORS = void 0;
// 常量
exports.STORAGE_ERRORS = {
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
};
//# sourceMappingURL=types.js.map