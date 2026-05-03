import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Mail, Eye, Trash2 } from 'lucide-react'
import { useQuotesStore } from '@/store/quotes.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/utils'
import { QuoteFormDialog } from '@/components/quotes/QuoteFormDialog'
import { QuoteDetailDialog } from '@/components/quotes/QuoteDetailDialog'

export function QuotesPage() {
  const { quotes, total, isLoading, fetchQuotes, updateStatus, sendEmail, deleteQuote } = useQuotesStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetchQuotes({
      ...(search && { search }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    })
  }, [search, statusFilter, fetchQuotes])

  const handleSendEmail = async (id: string) => {
    if (!confirm('¿Enviar cotización por email al cliente?')) return
    await sendEmail(id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return
    await deleteQuote(id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">{total} cotizaciones en total</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva cotización
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o notas..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="sent">Enviada</SelectItem>
            <SelectItem value="approved">Aprobada</SelectItem>
            <SelectItem value="rejected">Rechazada</SelectItem>
            <SelectItem value="expired">Expirada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-left font-medium">Fecha</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No hay cotizaciones
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">#{q.number}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/clients/${q.clientId}`}
                      className="font-medium hover:underline"
                    >
                      {q.client.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{q.client.email}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(q.total, q.currency)}</td>
                  <td className="px-4 py-3">
                    <Select value={q.status} onValueChange={(s) => updateStatus(q.id, s)}>
                      <SelectTrigger className="h-7 w-32 text-xs border-0 p-0 focus:ring-0">
                        <Badge className={QUOTE_STATUS_COLORS[q.status]}>
                          {QUOTE_STATUS_LABELS[q.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(QUOTE_STATUS_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(q.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedId(q.id)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendEmail(q.id)}
                        title="Enviar por email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(q.id)}
                        title="Eliminar"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <QuoteFormDialog open={showCreate} onClose={() => setShowCreate(false)} />
      {selectedId && (
        <QuoteDetailDialog quoteId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
