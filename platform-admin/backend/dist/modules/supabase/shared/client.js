"use strict";
/**
 * Supabase Client 模块
 * 模拟 @supabase/supabase-js 客户端，提供与官方 Supabase API 兼容的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAnon = exports.supabaseAdmin = exports.createClient = exports.createAnonClient = exports.createAdminClient = exports.SupabaseClient = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// 环境变量配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWRldiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTcxMTUzNjAwMH0.mock-service-role-key';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWRldiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjgwMDAwMDAwLCJleHAiOjE3MTE1MzYwMDB9.mock-anon-key';
// 模拟 Supabase 客户端
class SupabaseClient {
    constructor(url, key, options = {}) {
        this.url = url;
        this.key = key;
        this.options = options;
        this.schema = options.schema || 'public';
    }
    // Auth 模块
    get auth() {
        return {
            // 管理员用户管理
            admin: {
                listUsers: async () => {
                    // 实际实现会在 Auth 模块中
                    return { data: { users: [] }, error: null };
                },
                getUserById: async (id) => {
                    return { data: { user: null }, error: null };
                },
                createUser: async (attributes) => {
                    return { data: { user: null }, error: null };
                },
                updateUserById: async (id, attributes) => {
                    return { data: { user: null }, error: null };
                },
                deleteUser: async (id) => {
                    return { data: null, error: null };
                }
            },
            // 普通用户认证
            signUp: async (credentials) => {
                return { data: { user: null, session: null }, error: null };
            },
            signIn: async (credentials) => {
                return { data: { user: null, session: null }, error: null };
            },
            signOut: async () => {
                return { error: null };
            },
            getSession: async () => {
                return { data: { session: null }, error: null };
            }
        };
    }
    // Database 模块 (PostgREST)
    from(table) {
        return {
            select: (columns = '*') => ({
                eq: (column, value) => ({ data: [], error: null }),
                neq: (column, value) => ({ data: [], error: null }),
                gt: (column, value) => ({ data: [], error: null }),
                lt: (column, value) => ({ data: [], error: null }),
                gte: (column, value) => ({ data: [], error: null }),
                lte: (column, value) => ({ data: [], error: null }),
                like: (column, pattern) => ({ data: [], error: null }),
                ilike: (column, pattern) => ({ data: [], error: null }),
                is: (column, value) => ({ data: [], error: null }),
                in: (column, values) => ({ data: [], error: null }),
                order: (column, options) => ({ data: [], error: null }),
                limit: (count) => ({ data: [], error: null }),
                range: (from, to) => ({ data: [], error: null }),
                single: () => ({ data: null, error: null }),
                maybeSingle: () => ({ data: null, error: null })
            }),
            insert: (values) => ({
                select: (columns = '*') => ({ data: [], error: null })
            }),
            update: (values) => ({
                eq: (column, value) => ({ data: [], error: null })
            }),
            delete: () => ({
                eq: (column, value) => ({ data: [], error: null })
            }),
            upsert: (values) => ({
                onConflict: (columns = 'id') => ({ data: [], error: null })
            }),
            rpc: (fn, params) => ({
                select: (columns = '*') => ({ data: [], error: null })
            })
        };
    }
    // Storage 模块
    get storage() {
        return {
            from: (bucket) => ({
                upload: (path, file, options) => ({ data: { path: '' }, error: null }),
                download: (path) => ({ data: null, error: null }),
                list: (path, options) => ({ data: [], error: null }),
                remove: (paths) => ({ data: [], error: null }),
                createSignedUrl: (path, expiresIn) => ({ data: { signedUrl: '' }, error: null }),
                getPublicUrl: (path) => ({ data: { publicUrl: '' }, error: null })
            }),
            listBuckets: () => ({ data: [], error: null }),
            createBucket: (id, options) => ({ data: { id: '' }, error: null }),
            deleteBucket: (id) => ({ data: null, error: null }),
            emptyBucket: (id) => ({ data: null, error: null })
        };
    }
    // Functions 模块
    get functions() {
        return {
            invoke: (name, options) => ({ data: null, error: null }),
            getFunctions: () => ({ data: [], error: null }),
            getFunction: (name) => ({ data: null, error: null })
        };
    }
    // Realtime 模块
    get realtime() {
        return {
            channel: (name) => ({
                on: (event, callback) => ({ unsubscribe: () => { } }),
                subscribe: () => ({})
            }),
            getChannels: () => ({ data: [], error: null })
        };
    }
    // 获取当前配置
    getConfig() {
        return {
            url: this.url,
            key: this.key,
            schema: this.schema,
            options: this.options
        };
    }
}
exports.SupabaseClient = SupabaseClient;
// 创建管理员客户端（使用 Service Role Key）
const createAdminClient = (options = {}) => {
    return new SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
        ...options,
        schema: options.schema || 'public'
    });
};
exports.createAdminClient = createAdminClient;
// 创建匿名客户端（使用 Anon Key）
const createAnonClient = (options = {}) => {
    return new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        ...options,
        schema: options.schema || 'public'
    });
};
exports.createAnonClient = createAnonClient;
// 默认导出（兼容官方 supabase-js 使用方式）
const createClient = (url, key, options = {}) => {
    return new SupabaseClient(url, key, options);
};
exports.createClient = createClient;
// 默认实例（用于快速开发）
exports.supabaseAdmin = (0, exports.createAdminClient)();
exports.supabaseAnon = (0, exports.createAnonClient)();
exports.default = {
    createClient: exports.createClient,
    createAdminClient: exports.createAdminClient,
    createAnonClient: exports.createAnonClient,
    supabaseAdmin: exports.supabaseAdmin,
    supabaseAnon: exports.supabaseAnon
};
//# sourceMappingURL=client.js.map