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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultAdmin = exports.requireRole = exports.authenticate = exports.comparePassword = exports.hashPassword = exports.verifyToken = exports.generateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'supabase-platform-admin-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// 生成JWT Token
const generateToken = (userId, role = 'admin') => {
    const secret = JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign({ userId, role }, secret, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
// 验证JWT Token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
// 密码加密
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
exports.hashPassword = hashPassword;
// 验证密码
const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
// 认证中间件
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌' });
    }
    const token = authHeader.substring(7);
    const decoded = (0, exports.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ error: '无效或过期的认证令牌' });
    }
    req.user = decoded;
    next();
};
exports.authenticate = authenticate;
// 角色检查中间件
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: '需要认证' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: '权限不足' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// 生成默认管理员账户（开发用）
const createDefaultAdmin = async () => {
    // 在实际应用中，应该从数据库读取用户信息
    // 这里为了简化，使用固定值
    const defaultAdmin = {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        // 密码: admin123 (经过哈希)
        passwordHash: '$2a$10$XQPX6Q6Q6Q6Q6Q6Q6Q6Q6.6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6',
    };
    return defaultAdmin;
};
exports.createDefaultAdmin = createDefaultAdmin;
//# sourceMappingURL=auth.js.map