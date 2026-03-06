import { Router } from 'express'
import * as projectDataController from '../controllers/projectDataController'
import { authenticateProject } from '../utils/projectAuth'

const router = Router()

// 所有项目数据路由都需要项目API Key认证
router.use(authenticateProject)

// 查询表数据
router.get('/:table', projectDataController.queryProjectData)

// 插入数据
router.post('/:table', projectDataController.insertProjectData)

// 更新数据
router.put('/:table/:id', projectDataController.updateProjectData)

// 删除数据
router.delete('/:table/:id', projectDataController.deleteProjectData)

// 执行自定义查询（只读）
router.post('/query/execute', projectDataController.executeCustomQuery)

export default router