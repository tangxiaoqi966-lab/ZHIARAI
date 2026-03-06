import { Router } from 'express'
import * as migrationController from '../controllers/migrationController'
import { authenticate } from '../utils/auth'

const router = Router()

// 所有迁移路由都需要认证
router.use(authenticate)

// 获取迁移列表
router.get('/', migrationController.getMigrations)

// 获取单个迁移
router.get('/:id', migrationController.getMigrationById)

// 创建迁移
router.post('/', migrationController.createMigration)

export default router