/**
 * Supabase RLS Policy 服务
 * 提供 RLS 策略管理功能，与官方 Supabase RLS Policy API 完全兼容
 */
import { RLSPolicy, CreatePolicyRequest, UpdatePolicyRequest, ListPoliciesParams, BatchPolicyOperationRequest, BatchPolicyOperationResponse, PolicyStats } from './types';
export declare class RLSPolicyService {
    private getProjectId;
    listPolicies(projectRef: string, params?: ListPoliciesParams): Promise<RLSPolicy[]>;
    getPolicy(projectRef: string, policyId: string): Promise<RLSPolicy>;
    createPolicy(projectRef: string, policyRequest: CreatePolicyRequest, userId: string): Promise<RLSPolicy>;
    updatePolicy(projectRef: string, policyId: string, policyRequest: UpdatePolicyRequest, userId: string): Promise<RLSPolicy>;
    deletePolicy(projectRef: string, policyId: string): Promise<void>;
    enablePolicy(projectRef: string, policyId: string, userId: string): Promise<RLSPolicy>;
    disablePolicy(projectRef: string, policyId: string, userId: string): Promise<RLSPolicy>;
    batchOperation(projectRef: string, batchRequest: BatchPolicyOperationRequest): Promise<BatchPolicyOperationResponse>;
    getPolicyStats(projectRef: string): Promise<PolicyStats>;
}
//# sourceMappingURL=service.d.ts.map