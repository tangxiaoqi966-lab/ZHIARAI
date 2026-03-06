/**
 * Supabase API Keys 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
import { Request, Response } from 'express';
export declare const listApiKeys: (req: Request, res: Response) => Promise<void>;
export declare const getApiKey: (req: Request, res: Response) => Promise<void>;
export declare const createApiKey: (req: Request, res: Response) => Promise<void>;
export declare const updateApiKey: (req: Request, res: Response) => Promise<void>;
export declare const deleteApiKey: (req: Request, res: Response) => Promise<void>;
export declare const rotateApiKey: (req: Request, res: Response) => Promise<void>;
export declare const validateApiKey: (req: Request, res: Response) => Promise<void>;
export declare const revokeApiKey: (req: Request, res: Response) => Promise<void>;
export declare const enableApiKey: (req: Request, res: Response) => Promise<void>;
export declare const batchUpdateApiKeys: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=controller.d.ts.map