/**
 * Supabase API Keys 服务
 * 提供 API 密钥管理功能，与官方 Supabase API Keys 完全兼容
 */
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest, ListApiKeysParams, ListApiKeysResponse, RotateApiKeyRequest, RotateApiKeyResponse, ValidateApiKeyRequest, ValidateApiKeyResponse } from './types';
export declare class ApiKeyService {
    private getProjectId;
    listApiKeys(projectRef: string, params?: ListApiKeysParams): Promise<ListApiKeysResponse>;
    getApiKeyById(projectRef: string, apiKeyId: string): Promise<ApiKey>;
    getApiKeyByKey(key: string, projectRef?: string): Promise<ApiKey>;
    createApiKey(projectRef: string, keyData: CreateApiKeyRequest, _createdBy: string, _ipAddress?: string, _userAgent?: string): Promise<ApiKey>;
    updateApiKey(projectRef: string, apiKeyId: string, keyData: UpdateApiKeyRequest, _updatedBy: string, _ipAddress?: string, _userAgent?: string): Promise<ApiKey>;
    deleteApiKey(projectRef: string, apiKeyId: string, _deletedBy: string, _ipAddress?: string, _userAgent?: string): Promise<void>;
    rotateApiKey(projectRef: string, apiKeyId: string, rotationData: RotateApiKeyRequest | undefined, _rotatedBy: string, _ipAddress?: string, _userAgent?: string): Promise<RotateApiKeyResponse>;
    validateApiKey(validateData: ValidateApiKeyRequest): Promise<ValidateApiKeyResponse>;
    private checkPermissions;
    revokeApiKey(projectRef: string, apiKeyId: string, revokedBy: string, ipAddress?: string, userAgent?: string): Promise<ApiKey>;
    enableApiKey(projectRef: string, apiKeyId: string, enabledBy: string, ipAddress?: string, userAgent?: string): Promise<ApiKey>;
}
//# sourceMappingURL=service.d.ts.map