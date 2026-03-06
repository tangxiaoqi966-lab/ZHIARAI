import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../utils/auth'

const router = Router()

// 公开路由
router.post('/login', authController.login)
router.post('/logout', authController.logout)

// 需要认证的路由
router.get('/me', authenticate, authController.getCurrentUser)
router.put('/password', authenticate, authController.updatePassword)

export default router