import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

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

  try {
    const { email, password } = req.body
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
