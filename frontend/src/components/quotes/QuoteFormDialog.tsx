import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { useQuotesStore } from '@/store/quotes.store'
import { useClientsStore } from '@/store/clients.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormValues {
  clientId: string
  notes: string
  validUntil: string
  currency: string
  items: { description: string; quantity: number; unitPrice: number }[]
}

export function QuoteFormDialog({ open, onClose }: Props) {
  const { createQuote } = useQuotesStore()
  const { clients, fetchClients } = useClientsStore()
  const [clientSearch, setClientSearch] = useState('')

  const { register, handleSubmit, watch, control, setValue, reset, formState: { isSubmitting, errors } } =
    useForm<FormValues>({
      defaultValues: {
        currency: 'MXN',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )
  const currency = watch('currency') || 'MXN'

  useEffect(() => {
    if (open) {
      fetchClients()
      reset({ currency: 'MXN', items: [{ description: '', quantity: 1, unitPrice: 0 }] })
    }
  }, [open, fetchClients, reset])

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const onSubmit = async (data: FormValues) => {
    await createQuote({
      ...data,
      taxRate: 0.16,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva cotización</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Input
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="mb-1"
            />
            <Select onValueChange={(v) => setValue('clientId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={(v) => setValue('currency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
                  <SelectItem value="USD">USD — Dólar americano</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Válida hasta</Label>
              <Input type="date" {...register('validUntil')} />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ítems</Label>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Input
                    className="flex-1"
                    placeholder="Descripción"
                    {...register(`items.${idx}.description`, { required: true })}
                  />
                  <Input
                    className="w-20"
                    type="number"
                    placeholder="Cant."
                    min="0.01"
                    step="0.01"
                    {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                  />
                  <Input
                    className="w-28"
                    type="number"
                    placeholder="P. Unit."
                    min="0"
                    step="0.01"
                    {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })}
                  />
                  <span className="w-24 text-right text-sm font-medium">
                    {formatCurrency(
                      (Number(watchedItems[idx]?.quantity) || 0) *
                      (Number(watchedItems[idx]?.unitPrice) || 0),
                      currency
                    )}
                  </span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </Button>

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (16%)</span>
                <span>{formatCurrency(subtotal * 0.16, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(subtotal * 1.16, currency)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea placeholder="Notas o condiciones de la cotización..." rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear cotización'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
