export declare const verifyProjectApiKey: (apiKey: string) => Promise<{
    projectId: string;
    schemaName: string;
} | null>;
export declare const authenticateProject: (req: any, res: any, next: any) => Promise<any>;
export declare const setProjectSchema: (schemaName: string) => Promise<boolean>;
export declare const resetSchema: () => Promise<boolean>;
export declare const canAccessProject: (userId: string, projectId: string) => Promise<boolean>;
//# sourceMappingURL=projectAuth.d.ts.map