/**
 * Supabase Edge Functions 服务
 * 提供 Edge Functions 管理功能，与官方 Supabase Edge Functions API 完全兼容
 */
import { EdgeFunction, CreateEdgeFunctionRequest, UpdateEdgeFunctionRequest, DeployEdgeFunctionRequest, ListEdgeFunctionsParams, BatchEdgeFunctionOperationRequest, BatchEdgeFunctionOperationResponse, EdgeFunctionStats, EdgeFunctionInvocationLog } from './types';
export declare class EdgeFunctionsService {
    private getProjectId;
    listEdgeFunctions(projectRef: string, params?: ListEdgeFunctionsParams): Promise<EdgeFunction[]>;
    getEdgeFunction(projectRef: string, functionId: string): Promise<EdgeFunction>;
    createEdgeFunction(projectRef: string, functionRequest: CreateEdgeFunctionRequest, userId: string): Promise<EdgeFunction>;
    updateEdgeFunction(projectRef: string, functionId: string, functionRequest: UpdateEdgeFunctionRequest, userId: string): Promise<EdgeFunction>;
    deleteEdgeFunction(projectRef: string, functionId: string): Promise<void>;
    deployEdgeFunction(projectRef: string, functionId: string, deployRequest: DeployEdgeFunctionRequest, userId: string): Promise<EdgeFunction>;
    activateEdgeFunction(projectRef: string, functionId: string, userId: string): Promise<EdgeFunction>;
    deactivateEdgeFunction(projectRef: string, functionId: string, userId: string): Promise<EdgeFunction>;
    batchOperation(projectRef: string, batchRequest: BatchEdgeFunctionOperationRequest): Promise<BatchEdgeFunctionOperationResponse>;
    getEdgeFunctionStats(projectRef: string): Promise<EdgeFunctionStats>;
    getInvocationLogs(projectRef: string, functionId?: string, limit?: number, offset?: number): Promise<EdgeFunctionInvocationLog[]>;
}
//# sourceMappingURL=service.d.ts.map