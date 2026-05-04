import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

const DEMO_EMAIL = 'admin@cotizaciones.dev'
const DEMO_PASSWORD = 'admin123'
const DEMO_USER = { id: 'demo-admin', email: DEMO_EMAIL, name: 'Administrador', role: 'admin' }

export const loginValidators = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
]

export async function loginHandler(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }

  const { email, password } = req.body

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    const payload = { userId: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role }
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' } as jwt.SignOptions)
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' } as jwt.SignOptions)
    res.json({ accessToken, refreshToken, user: DEMO_USER })
    return
  }

  try {
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
    res.status(401).json({ error: message })
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token requerido' })
    return
  }

  try {
    const tokens = await authService.refresh(refreshToken)
    res.json(tokens)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al renovar token'
    res.status(401).json({ error: message })
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const { refreshToken } = req.body
  if (refreshToken) await authService.logout(refreshToken)
  res.json({ message: 'Sesión cerrada' })
}

export async function meHandler(req: AuthRequest, res: Response) {
  if (req.userId === DEMO_USER.id) {
    res.json({ ...DEMO_USER, createdAt: new Date(0).toISOString() })
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }

  res.json(user)
}
