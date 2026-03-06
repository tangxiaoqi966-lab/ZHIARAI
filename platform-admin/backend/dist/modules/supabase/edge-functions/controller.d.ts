/**
 * Supabase Edge Functions 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
import { Request, Response } from 'express';
export declare const listEdgeFunctions: (req: Request, res: Response) => Promise<void>;
export declare const getEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const createEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const updateEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const deleteEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const deployEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const activateEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const deactivateEdgeFunction: (req: Request, res: Response) => Promise<void>;
export declare const batchOperation: (req: Request, res: Response) => Promise<void>;
export declare const getEdgeFunctionStats: (req: Request, res: Response) => Promise<void>;
export declare const getInvocationLogs: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=controller.d.ts.map