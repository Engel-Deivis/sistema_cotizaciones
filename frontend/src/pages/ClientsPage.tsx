import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, Edit, FileText } from 'lucide-react'
import { useClientsStore } from '@/store/clients.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { ClientFormDialog } from '@/components/clients/ClientFormDialog'

export function ClientsPage() {
  const { clients, total, isLoading, fetchClients, deleteClient } = useClientsStore()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editClient, setEditClient] = useState<(typeof clients)[0] | null>(null)

  useEffect(() => {
    fetchClients(search ? { search } : {})
  }, [search, fetchClients])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al cliente "${name}"? Se eliminarán también sus cotizaciones.`)) return
    await deleteClient(id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">{total} clientes registrados</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o empresa..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Empresa</th>
              <th className="px-4 py-3 text-left font-medium">Cotizaciones</th>
              <th className="px-4 py-3 text-left font-medium">Registro</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">Cargando...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">No hay clientes</td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={`/admin/clients/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">{c.company || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {c._count?.quotes ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditClient(c)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id, c.name)}
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

      <ClientFormDialog open={showCreate} onClose={() => setShowCreate(false)} />
      {editClient && (
        <ClientFormDialog
          open={!!editClient}
          client={editClient}
          onClose={() => setEditClient(null)}
        />
      )}
    </div>
  )
}
