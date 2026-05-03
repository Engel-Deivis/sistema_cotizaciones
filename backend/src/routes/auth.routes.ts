import { Router } from 'express'
import {
  loginHandler,
  loginValidators,
  refreshHandler,
  logoutHandler,
  meHandler,
} from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/login', loginValidators, loginHandler)
router.post('/refresh', refreshHandler)
router.post('/logout', logoutHandler)
router.get('/me', authenticate, meHandler)

export default router
