/**
 * Supabase RLS Policy 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
import { Request, Response } from 'express';
export declare const listPolicies: (req: Request, res: Response) => Promise<void>;
export declare const getPolicy: (req: Request, res: Response) => Promise<void>;
export declare const createPolicy: (req: Request, res: Response) => Promise<void>;
export declare const updatePolicy: (req: Request, res: Response) => Promise<void>;
export declare const deletePolicy: (req: Request, res: Response) => Promise<void>;
export declare const enablePolicy: (req: Request, res: Response) => Promise<void>;
export declare const disablePolicy: (req: Request, res: Response) => Promise<void>;
export declare const batchOperation: (req: Request, res: Response) => Promise<void>;
export declare const getPolicyStats: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=controller.d.ts.map