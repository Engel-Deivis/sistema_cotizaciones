import { Request } from 'express'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  userRole?: string
}

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export type QuoteStatus = 'pending' | 'sent' | 'approved' | 'rejected' | 'expired'

export interface CreateQuoteItemDto {
  description: string
  quantity: number
  unitPrice: number
  order?: number
}

export interface CreateQuoteDto {
  clientId?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientCompany?: string
  items: CreateQuoteItemDto[]
  notes?: string
  validUntil?: string
  currency?: string
  taxRate?: number
}

export interface CreateClientDto {
  name: string
  email: string
  phone?: string
  company?: string
  notes?: string
}
