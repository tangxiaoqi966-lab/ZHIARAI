/**
 * Supabase Storage 服务
 * 提供存储管理功能，与官方 Supabase Storage API 完全兼容
 */
import { StorageBucket, StorageObject, UploadFileRequest, DownloadFileResponse, ListFilesParams, ListFilesResponse, CreateBucketRequest, UpdateBucketRequest, SignedURLRequest, SignedURLResponse, BatchStorageOperationRequest, BatchStorageOperationResponse, StorageStats } from './types';
export declare class StorageService {
    private getProjectId;
    listBuckets(projectRef: string): Promise<StorageBucket[]>;
    getBucket(projectRef: string, bucketName: string): Promise<StorageBucket>;
    createBucket(projectRef: string, bucketRequest: CreateBucketRequest, owner: string): Promise<StorageBucket>;
    updateBucket(projectRef: string, bucketName: string, bucketRequest: UpdateBucketRequest, updatedBy: string): Promise<StorageBucket>;
    deleteBucket(projectRef: string, bucketName: string): Promise<void>;
    listFiles(projectRef: string, bucketName: string, params?: ListFilesParams): Promise<ListFilesResponse>;
    uploadFile(projectRef: string, uploadRequest: UploadFileRequest): Promise<StorageObject>;
    downloadFile(projectRef: string, bucketName: string, filePath: string): Promise<DownloadFileResponse>;
    deleteFile(projectRef: string, bucketName: string, filePath: string): Promise<void>;
    createSignedURL(projectRef: string, bucketName: string, filePath: string, signedRequest?: SignedURLRequest): Promise<SignedURLResponse>;
    batchOperation(projectRef: string, batchRequest: BatchStorageOperationRequest): Promise<BatchStorageOperationResponse>;
    getStorageStats(projectRef: string): Promise<StorageStats>;
}
//# sourceMappingURL=service.d.ts.map