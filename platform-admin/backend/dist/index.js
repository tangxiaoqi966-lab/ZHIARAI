"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = require("dotenv");
const database_1 = require("./utils/database");
// Import routes
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const migrationRoutes_1 = __importDefault(require("./routes/migrationRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectDataRoutes_1 = __importDefault(require("./routes/projectDataRoutes"));
const supabaseApiKeyRoutes_1 = __importDefault(require("./routes/supabaseApiKeyRoutes"));
const supabaseAuthRoutes_1 = __importDefault(require("./routes/supabaseAuthRoutes"));
const supabaseDatabaseRoutes_1 = __importDefault(require("./routes/supabaseDatabaseRoutes"));
const supabaseStorageRoutes_1 = __importDefault(require("./routes/supabaseStorageRoutes"));
const supabaseRLSPolicyRoutes_1 = __importDefault(require("./routes/supabaseRLSPolicyRoutes"));
const supabaseEdgeFunctionsRoutes_1 = __importDefault(require("./routes/supabaseEdgeFunctionsRoutes"));
// Load environment variables
(0, dotenv_1.config)();
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/migrations', migrationRoutes_1.default);
app.use('/api/project-data', projectDataRoutes_1.default);
app.use('/api/supabase', supabaseApiKeyRoutes_1.default);
app.use('/api/supabase', supabaseAuthRoutes_1.default);
app.use('/api/supabase', supabaseDatabaseRoutes_1.default);
app.use('/api/supabase', supabaseStorageRoutes_1.default);
app.use('/api/supabase', supabaseRLSPolicyRoutes_1.default);
app.use('/api/supabase', supabaseEdgeFunctionsRoutes_1.default);
// Health check endpoint
app.get('/api/health', async (_req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'supabase-platform-admin',
        version: '1.0.0',
        uptime: process.uptime(),
        checks: {
            database: 'pending',
            memory: 'pending',
            disk: 'pending',
        }
    };
    try {
        // 检查数据库连接
        const isDbConnected = await (0, database_1.testConnection)();
        health.checks.database = isDbConnected ? 'healthy' : 'unhealthy';
        if (!isDbConnected) {
            health.status = 'degraded';
        }
        // 检查内存使用
        const memoryUsage = process.memoryUsage();
        health.checks.memory = 'healthy';
        health.memory = {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
        };
        // 检查磁盘空间（简化版）
        health.checks.disk = 'healthy';
        // 获取项目统计
        try {
            const { query } = await Promise.resolve().then(() => __importStar(require('./utils/database')));
            const projectCount = await query('SELECT COUNT(*) as count FROM platform.projects');
            const migrationCount = await query('SELECT COUNT(*) as count FROM platform.migrations');
            health.stats = {
                projects: parseInt(projectCount.rows[0].count),
                migrations: parseInt(migrationCount.rows[0].count),
            };
        }
        catch (dbError) {
            health.stats = { error: 'Failed to fetch stats' };
        }
    }
    catch (error) {
        health.status = 'unhealthy';
        health.checks.database = 'unhealthy';
        if (error instanceof Error) {
            health.error = error.message;
        }
        else if (typeof error === 'string') {
            health.error = error;
        }
        else {
            health.error = 'Unknown error occurred';
        }
    }
    // 根据检查结果设置HTTP状态码
    const statusCode = health.status === 'ok' ? 200 :
        health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Supabase Platform Admin API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            projects: '/api/projects',
            migrations: '/api/migrations',
            project_data: '/api/project-data',
            supabase: '/api/supabase',
            health: '/api/health'
        },
        note: '管理API需要管理员Bearer Token认证，项目数据API需要项目API Key认证'
    });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
async function startServer() {
    try {
        // Test database connection
        const isConnected = await (0, database_1.testConnection)();
        if (!isConnected) {
            console.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        app.listen(PORT, () => {
            console.log(`Supabase Platform Admin API running on port ${PORT}`);
            console.log(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map