export declare const generateToken: (userId: string, role?: string) => string;
export declare const verifyToken: (token: string) => any;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const authenticate: (req: any, res: any, next: any) => any;
export declare const requireRole: (roles: string[]) => (req: any, res: any, next: any) => any;
export declare const createDefaultAdmin: () => Promise<{
    id: string;
    username: string;
    email: string;
    role: string;
    passwordHash: string;
}>;
//# sourceMappingURL=auth.d.ts.map