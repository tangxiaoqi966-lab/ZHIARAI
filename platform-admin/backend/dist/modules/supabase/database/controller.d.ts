/**
 * Supabase Database 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
import { Request, Response } from 'express';
export declare const executeSQL: (req: Request, res: Response) => Promise<void>;
export declare const listTables: (req: Request, res: Response) => Promise<void>;
export declare const getTableSchema: (req: Request, res: Response) => Promise<void>;
export declare const createTable: (req: Request, res: Response) => Promise<void>;
export declare const dropTable: (req: Request, res: Response) => Promise<void>;
export declare const queryData: (req: Request, res: Response) => Promise<void>;
export declare const insertData: (req: Request, res: Response) => Promise<void>;
export declare const updateData: (req: Request, res: Response) => Promise<void>;
export declare const deleteData: (req: Request, res: Response) => Promise<void>;
export declare const batchOperation: (req: Request, res: Response) => Promise<void>;
export declare const getDatabaseStats: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=controller.d.ts.map