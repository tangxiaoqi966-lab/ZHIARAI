/**
 * Supabase Client 模块
 * 模拟 @supabase/supabase-js 客户端，提供与官方 Supabase API 兼容的接口
 */
export interface SupabaseClientOptions {
    auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
        storage?: any;
        storageKey?: string;
    };
    headers?: Record<string, string>;
    schema?: string;
}
export declare class SupabaseClient {
    private url;
    private key;
    private options;
    private schema;
    constructor(url: string, key: string, options?: SupabaseClientOptions);
    get auth(): {
        admin: {
            listUsers: () => Promise<{
                data: {
                    users: never[];
                };
                error: null;
            }>;
            getUserById: (id: string) => Promise<{
                data: {
                    user: null;
                };
                error: null;
            }>;
            createUser: (attributes: any) => Promise<{
                data: {
                    user: null;
                };
                error: null;
            }>;
            updateUserById: (id: string, attributes: any) => Promise<{
                data: {
                    user: null;
                };
                error: null;
            }>;
            deleteUser: (id: string) => Promise<{
                data: null;
                error: null;
            }>;
        };
        signUp: (credentials: any) => Promise<{
            data: {
                user: null;
                session: null;
            };
            error: null;
        }>;
        signIn: (credentials: any) => Promise<{
            data: {
                user: null;
                session: null;
            };
            error: null;
        }>;
        signOut: () => Promise<{
            error: null;
        }>;
        getSession: () => Promise<{
            data: {
                session: null;
            };
            error: null;
        }>;
    };
    from(table: string): {
        select: (columns?: string) => {
            eq: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            neq: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            gt: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            lt: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            gte: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            lte: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            like: (column: string, pattern: string) => {
                data: never[];
                error: null;
            };
            ilike: (column: string, pattern: string) => {
                data: never[];
                error: null;
            };
            is: (column: string, value: any) => {
                data: never[];
                error: null;
            };
            in: (column: string, values: any[]) => {
                data: never[];
                error: null;
            };
            order: (column: string, options: {
                ascending?: boolean;
                nullsFirst?: boolean;
            }) => {
                data: never[];
                error: null;
            };
            limit: (count: number) => {
                data: never[];
                error: null;
            };
            range: (from: number, to: number) => {
                data: never[];
                error: null;
            };
            single: () => {
                data: null;
                error: null;
            };
            maybeSingle: () => {
                data: null;
                error: null;
            };
        };
        insert: (values: any) => {
            select: (columns?: string) => {
                data: never[];
                error: null;
            };
        };
        update: (values: any) => {
            eq: (column: string, value: any) => {
                data: never[];
                error: null;
            };
        };
        delete: () => {
            eq: (column: string, value: any) => {
                data: never[];
                error: null;
            };
        };
        upsert: (values: any) => {
            onConflict: (columns?: string) => {
                data: never[];
                error: null;
            };
        };
        rpc: (fn: string, params?: any) => {
            select: (columns?: string) => {
                data: never[];
                error: null;
            };
        };
    };
    get storage(): {
        from: (bucket: string) => {
            upload: (path: string, file: any, options?: any) => {
                data: {
                    path: string;
                };
                error: null;
            };
            download: (path: string) => {
                data: null;
                error: null;
            };
            list: (path?: string, options?: any) => {
                data: never[];
                error: null;
            };
            remove: (paths: string[]) => {
                data: never[];
                error: null;
            };
            createSignedUrl: (path: string, expiresIn: number) => {
                data: {
                    signedUrl: string;
                };
                error: null;
            };
            getPublicUrl: (path: string) => {
                data: {
                    publicUrl: string;
                };
                error: null;
            };
        };
        listBuckets: () => {
            data: never[];
            error: null;
        };
        createBucket: (id: string, options?: any) => {
            data: {
                id: string;
            };
            error: null;
        };
        deleteBucket: (id: string) => {
            data: null;
            error: null;
        };
        emptyBucket: (id: string) => {
            data: null;
            error: null;
        };
    };
    get functions(): {
        invoke: (name: string, options?: any) => {
            data: null;
            error: null;
        };
        getFunctions: () => {
            data: never[];
            error: null;
        };
        getFunction: (name: string) => {
            data: null;
            error: null;
        };
    };
    get realtime(): {
        channel: (name: string) => {
            on: (event: string, callback: Function) => {
                unsubscribe: () => void;
            };
            subscribe: () => {};
        };
        getChannels: () => {
            data: never[];
            error: null;
        };
    };
    getConfig(): {
        url: string;
        key: string;
        schema: string;
        options: SupabaseClientOptions;
    };
}
export declare const createAdminClient: (options?: SupabaseClientOptions) => SupabaseClient;
export declare const createAnonClient: (options?: SupabaseClientOptions) => SupabaseClient;
export declare const createClient: (url: string, key: string, options?: SupabaseClientOptions) => SupabaseClient;
export declare const supabaseAdmin: SupabaseClient;
export declare const supabaseAnon: SupabaseClient;
declare const _default: {
    createClient: (url: string, key: string, options?: SupabaseClientOptions) => SupabaseClient;
    createAdminClient: (options?: SupabaseClientOptions) => SupabaseClient;
    createAnonClient: (options?: SupabaseClientOptions) => SupabaseClient;
    supabaseAdmin: SupabaseClient;
    supabaseAnon: SupabaseClient;
};
export default _default;
//# sourceMappingURL=client.d.ts.map