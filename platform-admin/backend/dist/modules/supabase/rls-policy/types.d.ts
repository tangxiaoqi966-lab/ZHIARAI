/**
 * Supabase RLS Policy 类型定义
 * 提供与官方 Supabase RLS Policy API 完全兼容的接口
 */
export interface RLSPolicy {
    id: string;
    name: string;
    schema: string;
    table: string;
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    definition: string;
    check: string | null;
    using: string | null;
    with_check: string | null;
    roles: string[];
    enabled: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}
export interface CreatePolicyRequest {
    name: string;
    schema?: string;
    table: string;
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    definition: string;
    check?: string;
    using?: string;
    with_check?: string;
    roles?: string[];
    enabled?: boolean;
}
export interface UpdatePolicyRequest {
    name?: string;
    definition?: string;
    check?: string;
    using?: string;
    with_check?: string;
    roles?: string[];
    enabled?: boolean;
}
export interface ListPoliciesParams {
    schema?: string;
    table?: string;
    command?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface BatchPolicyOperationRequest {
    operations: PolicyOperation[];
    atomic?: boolean;
}
export interface PolicyOperation {
    type: 'create' | 'update' | 'delete' | 'enable' | 'disable';
    policy_id?: string;
    policy?: CreatePolicyRequest;
    changes?: UpdatePolicyRequest;
}
export interface BatchPolicyOperationResponse {
    results: PolicyOperationResult[];
    atomic: boolean;
    success: boolean;
}
export interface PolicyOperationResult {
    policy_id: string;
    success: boolean;
    error?: string;
    policy?: RLSPolicy;
}
export interface PolicyStats {
    total_policies: number;
    enabled_policies: number;
    disabled_policies: number;
    policies_by_command: Record<string, number>;
    policies_by_schema: Record<string, number>;
    policies_by_table: Record<string, number>;
}
export declare const RLS_ERRORS: {
    POLICY_NOT_FOUND: {
        code: string;
        message: string;
        status: number;
    };
    POLICY_ALREADY_EXISTS: {
        code: string;
        message: string;
        status: number;
    };
    POLICY_VALIDATION_FAILED: {
        code: string;
        message: string;
        status: number;
    };
    POLICY_SYNTAX_ERROR: {
        code: string;
        message: string;
        status: number;
    };
    POLICY_INSUFFICIENT_PERMISSIONS: {
        code: string;
        message: string;
        status: number;
    };
    POLICY_DISABLED: {
        code: string;
        message: string;
        status: number;
    };
};
//# sourceMappingURL=types.d.ts.map