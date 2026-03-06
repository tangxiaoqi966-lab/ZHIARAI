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
const express_1 = require("express");
const projectController = __importStar(require("../controllers/projectController"));
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
// 所有项目路由都需要认证
router.use(auth_1.authenticate);
// 可选：只有管理员可以访问
// router.use(requireRole(['admin']))
// 获取所有项目
router.get('/', projectController.getProjects);
// 获取单个项目
router.get('/:id', projectController.getProjectById);
// 创建新项目
router.post('/', projectController.createProject);
// 更新项目
router.put('/:id', projectController.updateProject);
// 删除项目
router.delete('/:id', projectController.deleteProject);
// 生成新API Key
router.post('/:id/apikey', projectController.generateApiKey);
exports.default = router;
//# sourceMappingURL=projectRoutes.js.map