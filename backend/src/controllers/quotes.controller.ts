import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../lib/prisma'
import { AuthRequest, CreateQuoteDto } from '../types'
import { sendQuoteToClient, sendNewQuoteRequestNotification } from '../services/email.service'

export const quoteValidators = [
  body('items').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem'),
  body('items.*.description').trim().notEmpty().withMessage('Descripción del ítem requerida'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Cantidad inválida'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Precio inválido'),
]

export const publicQuoteValidators = [
  ...quoteValidators,
  body('clientName').trim().notEmpty().withMessage('Nombre requerido'),
  body('clientEmail').isEmail().withMessage('Email inválido'),
]

async function nextQuoteNumber(): Promise<number> {
  const last = await prisma.quote.findFirst({ orderBy: { number: 'desc' } })
  return (last?.number ?? 0) + 1
}

function calcTotals(items: { quantity: number; unitPrice: number }[], taxRate = 0.16) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const tax = subtotal * taxRate
  return { subtotal, tax, total: subtotal + tax }
}

export async function listQuotes(req: AuthRequest, res: Response) {
  const { status, clientId, page = '1', limit = '20', search } = req.query

  const where: Record<string, unknown> = {}
  if (status) where.status = String(status)
  if (clientId) where.clientId = String(clientId)
  if (search) {
    where.OR = [
      { client: { name: { contains: String(search) } } },
      { client: { email: { contains: String(search) } } },
      { notes: { contains: String(search) } },
    ]
  }

  const skip = (Number(page) - 1) * Number(limit)

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { client: true, items: { orderBy: { order: 'asc' } } },
    }),
    prisma.quote.count({ where }),
  ])

  res.json({ quotes, total, page: Number(page), limit: Number(limit) })
}

export async function getQuote(req: AuthRequest, res: Response) {
  const { id } = req.params

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { client: true, items: { orderBy: { order: 'asc' } } },
  })

  if (!quote) {
    res.status(404).json({ error: 'Cotización no encontrada' })
    return
  }

  res.json(quote)
}

export async function createQuote(req: AuthRequest, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }

  const dto: CreateQuoteDto = req.body
  const { subtotal, tax, total } = calcTotals(dto.items, dto.taxRate)

  let clientId = dto.clientId

  // Si no hay clientId, buscar o crear cliente por email
  if (!clientId && dto.clientEmail) {
    let client = await prisma.client.findFirst({ where: { email: dto.clientEmail } })
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: dto.clientName!,
          email: dto.clientEmail,
          phone: dto.clientPhone,
          company: dto.clientCompany,
        },
      })
    }
    clientId = client.id
  }

  if (!clientId) {
    res.status(400).json({ error: 'Se requiere clientId o datos del cliente' })
    return
  }

  const quote = await prisma.quote.create({
    data: {
      number: await nextQuoteNumber(),
      clientId,
      notes: dto.notes,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      currency: dto.currency || 'MXN',
      subtotal,
      tax,
      total,
      items: {
        create: dto.items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          order: item.order ?? idx,
        })),
      },
    },
    include: { client: true, items: { orderBy: { order: 'asc' } } },
  })

  res.status(201).json(quote)
}

// Formulario público — crea cotización con status "pending"
export async function publicCreateQuote(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }

  const dto: CreateQuoteDto = req.body
  const { subtotal, tax, total } = calcTotals(dto.items)

  let client = await prisma.client.findFirst({ where: { email: dto.clientEmail! } })
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: dto.clientName!,
        email: dto.clientEmail!,
        phone: dto.clientPhone,
        company: dto.clientCompany,
      },
    })
  }

  const quote = await prisma.quote.create({
    data: {
      number: await nextQuoteNumber(),
      clientId: client.id,
      status: 'pending',
      notes: dto.notes,
      currency: 'MXN',
      subtotal,
      tax,
      total,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: dto.items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          order: item.order ?? idx,
        })),
      },
    },
    include: { client: true, items: { orderBy: { order: 'asc' } } },
  })

  // Notificar al admin (primer usuario admin)
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (admin) {
      await sendNewQuoteRequestNotification(
        admin.email,
        client.name,
        client.email,
        quote.number
      )
    }
  } catch (err) {
    console.error('Error enviando notificación al admin:', err)
  }

  res.status(201).json({
    message: 'Solicitud enviada correctamente. Te contactaremos pronto.',
    quoteNumber: quote.number,
  })
}

export async function updateQuoteStatus(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { status, notes } = req.body

  const validStatuses = ['pending', 'sent', 'approved', 'rejected', 'expired']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }

  const quote = await prisma.quote.findUnique({ where: { id } })
  if (!quote) {
    res.status(404).json({ error: 'Cotización no encontrada' })
    return
  }

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      status,
      notes: notes ?? quote.notes,
      sentAt: status === 'sent' ? new Date() : quote.sentAt,
    },
    include: { client: true, items: { orderBy: { order: 'asc' } } },
  })

  res.json(updated)
}

export async function sendQuoteEmail(req: AuthRequest, res: Response) {
  const { id } = req.params

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { client: true, items: { orderBy: { order: 'asc' } } },
  })

  if (!quote) {
    res.status(404).json({ error: 'Cotización no encontrada' })
    return
  }

  try {
    await sendQuoteToClient(quote)

    await prisma.quote.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    })

    res.json({ message: 'Cotización enviada por email' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error enviando email'
    res.status(500).json({ error: message })
  }
}

export async function updateQuote(req: AuthRequest, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }

  const { id } = req.params
  const dto: CreateQuoteDto = req.body

  const existing = await prisma.quote.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'Cotización no encontrada' })
    return
  }

  const { subtotal, tax, total } = calcTotals(dto.items, dto.taxRate)

  // Eliminar ítems anteriores y recrear
  await prisma.quoteItem.deleteMany({ where: { quoteId: id } })

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      notes: dto.notes,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      currency: dto.currency ?? existing.currency,
      subtotal,
      tax,
      total,
      items: {
        create: dto.items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          order: item.order ?? idx,
        })),
      },
    },
    include: { client: true, items: { orderBy: { order: 'asc' } } },
  })

  res.json(quote)
}

export async function deleteQuote(req: AuthRequest, res: Response) {
  const { id } = req.params

  const existing = await prisma.quote.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'Cotización no encontrada' })
    return
  }

  await prisma.quote.delete({ where: { id } })
  res.json({ message: 'Cotización eliminada' })
}

export async function getDashboardStats(req: AuthRequest, res: Response) {
  const [totalQuotes, totalClients, pendingQuotes, approvedQuotes, recentQuotes] =
    await Promise.all([
      prisma.quote.count(),
      prisma.client.count(),
      prisma.quote.count({ where: { status: 'pending' } }),
      prisma.quote.count({ where: { status: 'approved' } }),
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: true },
      }),
    ])

  const totalRevenue = await prisma.quote.aggregate({
    where: { status: 'approved' },
    _sum: { total: true },
  })

  res.json({
    totalQuotes,
    totalClients,
    pendingQuotes,
    approvedQuotes,
    totalRevenue: totalRevenue._sum.total ?? 0,
    recentQuotes,
  })
}
