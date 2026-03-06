/**
 * Supabase Edge Functions 类型定义
 * 提供与官方 Supabase Edge Functions API 完全兼容的接口
 */
export interface EdgeFunction {
    id: string;
    name: string;
    slug: string;
    version: string;
    status: 'ACTIVE' | 'INACTIVE' | 'DEPLOYING' | 'FAILED';
    runtime: 'nodejs' | 'deno' | 'python' | 'go';
    entrypoint: string;
    memory_mb: number;
    timeout_seconds: number;
    environment_variables: Record<string, string>;
    secrets: Record<string, string>;
    regions: string[];
    created_at: string;
    updated_at: string;
    deployed_at: string | null;
    deployed_by: string;
    project_ref: string;
}
export interface CreateEdgeFunctionRequest {
    name: string;
    slug?: string;
    runtime: 'nodejs' | 'deno' | 'python' | 'go';
    entrypoint: string;
    code: string;
    memory_mb?: number;
    timeout_seconds?: number;
    environment_variables?: Record<string, string>;
    secrets?: Record<string, string>;
    regions?: string[];
}
export interface UpdateEdgeFunctionRequest {
    name?: string;
    code?: string;
    runtime?: 'nodejs' | 'deno' | 'python' | 'go';
    entrypoint?: string;
    memory_mb?: number;
    timeout_seconds?: number;
    environment_variables?: Record<string, string>;
    secrets?: Record<string, string>;
    regions?: string[];
}
export interface DeployEdgeFunctionRequest {
    code?: string;
    environment_variables?: Record<string, string>;
    secrets?: Record<string, string>;
    regions?: string[];
}
export interface ListEdgeFunctionsParams {
    status?: string;
    runtime?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}
export interface BatchEdgeFunctionOperationRequest {
    operations: EdgeFunctionOperation[];
    atomic?: boolean;
}
export interface EdgeFunctionOperation {
    type: 'create' | 'update' | 'delete' | 'deploy' | 'activate' | 'deactivate';
    function_id?: string;
    function?: CreateEdgeFunctionRequest;
    changes?: UpdateEdgeFunctionRequest;
    deploy?: DeployEdgeFunctionRequest;
}
export interface BatchEdgeFunctionOperationResponse {
    results: EdgeFunctionOperationResult[];
    atomic: boolean;
    success: boolean;
}
export interface EdgeFunctionOperationResult {
    function_id: string;
    success: boolean;
    error?: string;
    function?: EdgeFunction;
}
export interface EdgeFunctionStats {
    total_functions: number;
    active_functions: number;
    inactive_functions: number;
    deploying_functions: number;
    failed_functions: number;
    functions_by_runtime: Record<string, number>;
    functions_by_region: Record<string, number>;
    total_invocations: number;
    average_execution_time_ms: number;
    total_memory_mb: number;
}
export interface EdgeFunctionInvocationLog {
    id: string;
    function_id: string;
    function_name: string;
    timestamp: string;
    duration_ms: number;
    status_code: number;
    request_id: string;
    memory_used_mb: number;
    region: string;
    error?: string;
    request_body?: string;
    response_body?: string;
}
export declare const EDGE_FUNCTIONS_ERRORS: {
    FUNCTION_NOT_FOUND: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_ALREADY_EXISTS: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_VALIDATION_FAILED: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_DEPLOYMENT_FAILED: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_INSUFFICIENT_PERMISSIONS: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_INACTIVE: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_RUNTIME_NOT_SUPPORTED: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_MEMORY_LIMIT_EXCEEDED: {
        code: string;
        message: string;
        status: number;
    };
    FUNCTION_TIMEOUT_EXCEEDED: {
        code: string;
        message: string;
        status: number;
    };
};
//# sourceMappingURL=types.d.ts.map