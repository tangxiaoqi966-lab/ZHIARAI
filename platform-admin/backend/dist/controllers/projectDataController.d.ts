import { Response } from 'express';
export declare const queryProjectData: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const insertProjectData: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProjectData: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProjectData: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const executeCustomQuery: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=projectDataController.d.ts.map