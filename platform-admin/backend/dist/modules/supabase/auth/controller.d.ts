/**
 * Supabase Auth 控制器
 * 处理 HTTP 请求并调用相应的服务方法
 */
import { Request, Response } from 'express';
export declare const listUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUser: (req: Request, res: Response) => Promise<void>;
export declare const createUser: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
export declare const signIn: (req: Request, res: Response) => Promise<void>;
export declare const verifyToken: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export declare const getAuthConfig: (req: Request, res: Response) => Promise<void>;
export declare const batchUpdateUsers: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=controller.d.ts.map