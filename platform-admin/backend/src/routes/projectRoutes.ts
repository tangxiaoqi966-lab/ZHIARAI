import { Router } from 'express'
import * as projectController from '../controllers/projectController'
import { authenticate } from '../utils/auth'

const router = Router()

// 所有项目路由都需要认证
router.use(authenticate)

// 可选：只有管理员可以访问
// router.use(requireRole(['admin']))

// 获取所有项目
router.get('/', projectController.getProjects)

// 获取单个项目
router.get('/:id', projectController.getProjectById)

// 创建新项目
router.post('/', projectController.createProject)

// 更新项目
router.put('/:id', projectController.updateProject)

// 删除项目
router.delete('/:id', projectController.deleteProject)

// 生成新API Key
router.post('/:id/apikey', projectController.generateApiKey)

export default router