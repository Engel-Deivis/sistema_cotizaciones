import { useEffect, useState } from 'react'
import { Mail, Printer } from 'lucide-react'
import { useQuotesStore, Quote } from '@/store/quotes.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/utils'

interface Props {
  quoteId: string
  onClose: () => void
}

export function QuoteDetailDialog({ quoteId, onClose }: Props) {
  const { fetchQuote, sendEmail } = useQuotesStore()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchQuote(quoteId).then(setQuote)
  }, [quoteId, fetchQuote])

  const handleSend = async () => {
    if (!quote) return
    setSending(true)
    try {
      await sendEmail(quote.id)
      alert('Cotización enviada por email')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quote ? `Cotización #${quote.number}` : 'Cargando...'}
          </DialogTitle>
        </DialogHeader>

        {quote && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge className={QUOTE_STATUS_COLORS[quote.status]}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSend} disabled={sending} className="gap-2">
                  <Mail className="h-4 w-4" />
                  {sending ? 'Enviando...' : 'Enviar email'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{quote.client.name}</p>
                <p className="text-sm text-muted-foreground">{quote.client.email}</p>
                {quote.client.company && (
                  <p className="text-sm text-muted-foreground">{quote.client.company}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(quote.createdAt)}</p>
                {quote.validUntil && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">Válida hasta</p>
                    <p className="font-medium">{formatDate(quote.validUntil)}</p>
                  </>
                )}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Descripción</th>
                  <th className="py-2 text-center font-medium">Cant.</th>
                  <th className="py-2 text-right font-medium">P. Unit.</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice, quote.currency)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(item.total, quote.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t">
                <tr>
                  <td colSpan={3} className="py-2 text-right text-muted-foreground">Subtotal</td>
                  <td className="py-2 text-right">{formatCurrency(quote.subtotal, quote.currency)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 text-right text-muted-foreground">IVA (16%)</td>
                  <td className="py-2 text-right">{formatCurrency(quote.tax, quote.currency)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-bold">Total</td>
                  <td className="py-2 text-right font-bold text-lg">
                    {formatCurrency(quote.total, quote.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {quote.notes && (
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{quote.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
