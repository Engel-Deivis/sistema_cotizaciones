import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react'
import { useClientsStore, Client } from '@/store/clients.store'
import { Quote } from '@/store/quotes.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/utils'
import { ClientFormDialog } from '@/components/clients/ClientFormDialog'

type ClientWithQuotes = Client & { quotes: Quote[] }

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { fetchClient } = useClientsStore()
  const [client, setClient] = useState<ClientWithQuotes | null>(null)
  const [editing, setEditing] = useState(false)

  const load = async () => {
    if (!id) return
    const data = await fetchClient(id)
    setClient(data as unknown as ClientWithQuotes)
  }

  useEffect(() => { load() }, [id])

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">Historial del cliente</p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>Editar cliente</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{client.company}</span>
              </div>
            )}
            {client.notes && (
              <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {client.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{client.quotes?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Cotizaciones</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {client.quotes?.filter((q) => q.status === 'approved').length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Aprobadas</p>
            </div>
            <div className="col-span-2 text-center border-t pt-4">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  (client.quotes ?? [])
                    .filter((q) => q.status === 'approved')
                    .reduce((sum, q) => sum + q.total, 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total facturado (aprobadas)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {!client.quotes?.length ? (
            <p className="text-center text-muted-foreground py-8">Sin cotizaciones</p>
          ) : (
            <div className="space-y-3">
              {client.quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      #{q.number}
                    </span>
                    <div>
                      <p className="font-medium">{formatCurrency(q.total, q.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</p>
                    </div>
                  </div>
                  <Badge className={QUOTE_STATUS_COLORS[q.status]}>
                    {QUOTE_STATUS_LABELS[q.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <ClientFormDialog
          open={editing}
          client={client}
          onClose={() => { setEditing(false); load() }}
        />
      )}
    </div>
  )
}
