import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { JwtPayload } from '../types'
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../lib/secrets'

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions)
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
}

const DEMO_EMAIL = 'admin@cotizaciones.dev'
const DEMO_PASSWORD = 'admin123'

export async function login(email: string, password: string) {
  const isDemoAdmin = email === DEMO_EMAIL && password === DEMO_PASSWORD

  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    if (!isDemoAdmin) throw new Error('Credenciales inválidas')
    // Auto-create demo admin if not in DB yet
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        password: await bcrypt.hash(DEMO_PASSWORD, 10),
        name: 'Administrador',
        role: 'admin',
      },
    })
  }

  if (!isDemoAdmin) {
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new Error('Credenciales inválidas')
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role }

  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  })

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

export async function refresh(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  })

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
    throw new Error('Refresh token inválido o expirado')
  }

  const payload: JwtPayload = {
    userId: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  }

  const newAccessToken = signAccessToken(payload)
  const newRefreshToken = signRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { token: newRefreshToken, expiresAt },
  })

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
}
