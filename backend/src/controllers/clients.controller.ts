import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../types'

export const clientValidators = [
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('notes').optional().trim(),
]

export async function listClients(req: AuthRequest, res: Response) {
  const { search, page = '1', limit = '20' } = req.query

  const where = search
    ? {
        OR: [
          { name: { contains: String(search) } },
          { email: { contains: String(search) } },
          { company: { contains: String(search) } },
        ],
      }
    : {}

  const skip = (Number(page) - 1) * Number(limit)

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { quotes: true } } },
    }),
    prisma.client.count({ where }),
  ])

  res.json({ clients, total, page: Number(page), limit: Number(limit) })
}

export async function getClient(req: AuthRequest, res: Response) {
  const { id } = req.params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      quotes: {
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
    },
  })

  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  res.json(client)
}

export async function createClient(req: AuthRequest, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }

  const { name, email, phone, company, notes } = req.body

  const existing = await prisma.client.findFirst({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Ya existe un cliente con ese email' })
    return
  }

  const client = await prisma.client.create({
    data: { name, email, phone, company, notes },
  })

  res.status(201).json(client)
}

export async function updateClient(req: AuthRequest, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }

  const { id } = req.params
  const { name, email, phone, company, notes } = req.body

  const existing = await prisma.client.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  const client = await prisma.client.update({
    where: { id },
    data: { name, email, phone, company, notes },
  })

  res.json(client)
}

export async function deleteClient(req: AuthRequest, res: Response) {
  const { id } = req.params

  const existing = await prisma.client.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'Cliente no encontrado' })
    return
  }

  await prisma.client.delete({ where: { id } })
  res.json({ message: 'Cliente eliminado' })
}
