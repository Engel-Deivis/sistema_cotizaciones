import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Users, Clock, CheckCircle, DollarSign, ArrowRight } from 'lucide-react'
import { useQuotesStore } from '@/store/quotes.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/utils'

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { stats, fetchStats } = useQuotesStore()

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del sistema de cotizaciones</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total cotizaciones"
          value={stats?.totalQuotes ?? 0}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="Clientes"
          value={stats?.totalClients ?? 0}
          icon={Users}
          color="bg-violet-500"
        />
        <StatCard
          title="Pendientes"
          value={stats?.pendingQuotes ?? 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Aprobadas"
          value={stats?.approvedQuotes ?? 0}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ingresos totales (aprobadas)</p>
            <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cotizaciones recientes</CardTitle>
          <Link
            to="/admin/quotes"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {!stats?.recentQuotes?.length ? (
            <p className="text-center text-muted-foreground py-8">No hay cotizaciones aún</p>
          ) : (
            <div className="space-y-3">
              {stats.recentQuotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      #{q.number}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{q.client.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(q.total)}</span>
                    <Badge className={QUOTE_STATUS_COLORS[q.status]}>
                      {QUOTE_STATUS_LABELS[q.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
