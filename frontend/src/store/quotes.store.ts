import { create } from 'zustand'
import api from '@/lib/api'

export interface QuoteItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  order: number
}

export interface Quote {
  id: string
  number: number
  clientId: string
  client: { id: string; name: string; email: string; company?: string }
  status: string
  notes?: string
  validUntil?: string
  subtotal: number
  tax: number
  total: number
  currency: string
  sentAt?: string
  createdAt: string
  updatedAt: string
  items: QuoteItem[]
}

interface QuotesState {
  quotes: Quote[]
  total: number
  isLoading: boolean
  stats: {
    totalQuotes: number
    totalClients: number
    pendingQuotes: number
    approvedQuotes: number
    totalRevenue: number
    recentQuotes: Quote[]
  } | null
  fetchQuotes: (params?: Record<string, string>) => Promise<void>
  fetchStats: () => Promise<void>
  fetchQuote: (id: string) => Promise<Quote>
  createQuote: (data: unknown) => Promise<Quote>
  updateQuote: (id: string, data: unknown) => Promise<Quote>
  updateStatus: (id: string, status: string, notes?: string) => Promise<void>
  sendEmail: (id: string) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
}

export const useQuotesStore = create<QuotesState>((set, get) => ({
  quotes: [],
  total: 0,
  isLoading: false,
  stats: null,

  fetchQuotes: async (params = {}) => {
    set({ isLoading: true })
    const { data } = await api.get('/quotes', { params })
    set({ quotes: data.quotes, total: data.total, isLoading: false })
  },

  fetchStats: async () => {
    const { data } = await api.get('/quotes/stats')
    set({ stats: data })
  },

  fetchQuote: async (id) => {
    const { data } = await api.get(`/quotes/${id}`)
    return data
  },

  createQuote: async (quoteData) => {
    const { data } = await api.post('/quotes', quoteData)
    await get().fetchQuotes()
    return data
  },

  updateQuote: async (id, quoteData) => {
    const { data } = await api.put(`/quotes/${id}`, quoteData)
    await get().fetchQuotes()
    return data
  },

  updateStatus: async (id, status, notes) => {
    await api.patch(`/quotes/${id}/status`, { status, notes })
    await get().fetchQuotes()
    await get().fetchStats()
  },

  sendEmail: async (id) => {
    await api.post(`/quotes/${id}/send-email`)
    await get().fetchQuotes()
  },

  deleteQuote: async (id) => {
    await api.delete(`/quotes/${id}`)
    await get().fetchQuotes()
  },
}))
