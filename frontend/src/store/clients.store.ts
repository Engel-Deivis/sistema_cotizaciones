import { create } from 'zustand'
import api from '@/lib/api'

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  notes?: string
  createdAt: string
  updatedAt: string
  _count?: { quotes: number }
}

interface ClientsState {
  clients: Client[]
  total: number
  isLoading: boolean
  fetchClients: (params?: Record<string, string>) => Promise<void>
  fetchClient: (id: string) => Promise<Client>
  createClient: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>
  updateClient: (id: string, data: Partial<Client>) => Promise<Client>
  deleteClient: (id: string) => Promise<void>
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  total: 0,
  isLoading: false,

  fetchClients: async (params = {}) => {
    set({ isLoading: true })
    const { data } = await api.get('/clients', { params })
    set({ clients: data.clients, total: data.total, isLoading: false })
  },

  fetchClient: async (id) => {
    const { data } = await api.get(`/clients/${id}`)
    return data
  },

  createClient: async (clientData) => {
    const { data } = await api.post('/clients', clientData)
    await get().fetchClients()
    return data
  },

  updateClient: async (id, clientData) => {
    const { data } = await api.put(`/clients/${id}`, clientData)
    await get().fetchClients()
    return data
  },

  deleteClient: async (id) => {
    await api.delete(`/clients/${id}`)
    await get().fetchClients()
  },
}))
