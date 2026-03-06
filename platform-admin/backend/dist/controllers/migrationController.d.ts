import { Request, Response } from 'express';
export declare const getMigrations: (req: Request, res: Response) => Promise<void>;
export declare const createMigration: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMigrationById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=migrationController.d.ts.map