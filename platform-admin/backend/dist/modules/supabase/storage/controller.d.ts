/**
 * Supabase Storage 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
import { Request, Response } from 'express';
export declare const listBuckets: (req: Request, res: Response) => Promise<void>;
export declare const getBucket: (req: Request, res: Response) => Promise<void>;
export declare const createBucket: (req: Request, res: Response) => Promise<void>;
export declare const updateBucket: (req: Request, res: Response) => Promise<void>;
export declare const deleteBucket: (req: Request, res: Response) => Promise<void>;
export declare const listFiles: (req: Request, res: Response) => Promise<void>;
export declare const uploadFile: (req: Request, res: Response) => Promise<void>;
export declare const downloadFile: (req: Request, res: Response) => Promise<void>;
export declare const deleteFile: (req: Request, res: Response) => Promise<void>;
export declare const createSignedURL: (req: Request, res: Response) => Promise<void>;
export declare const batchOperation: (req: Request, res: Response) => Promise<void>;
export declare const getStorageStats: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=controller.d.ts.map