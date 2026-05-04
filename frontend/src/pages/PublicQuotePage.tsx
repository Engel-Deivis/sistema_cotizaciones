import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Plus, Trash2, Receipt, CheckCircle } from 'lucide-react'
import axios from 'axios'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface FormValues {
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany: string
  notes: string
  items: { description: string; quantity: number; unitPrice: number }[]
}

export function PublicQuotePage() {
  const [submitted, setSubmitted] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState<number | null>(null)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, control, formState: { isSubmitting, errors } } =
    useForm<FormValues>({
      defaultValues: {
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const onSubmit = async (data: FormValues) => {
    setError('')
    try {
      const { data: res } = await api.post('/quotes/public', data)
      setQuoteNumber(res.quoteNumber)
      setSubmitted(true)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('El servidor tardó demasiado. Intenta de nuevo.')
        } else {
          const msg = err.response?.data?.error
          setError(typeof msg === 'string' ? msg : 'Error al enviar la solicitud. Intenta de nuevo.')
        }
      } else {
        setError('Error de conexión. Intenta de nuevo.')
      }
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">¡Solicitud enviada!</h2>
            <p className="text-muted-foreground">
              Tu solicitud de cotización <strong>#{quoteNumber}</strong> fue recibida correctamente.
              Te contactaremos pronto.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Solicitar Cotización</h1>
          <p className="text-muted-foreground">Completa el formulario y nos pondremos en contacto contigo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tus datos</CardTitle>
              <CardDescription>Información de contacto</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input
                  placeholder="Juan García"
                  {...register('clientName', { required: 'Nombre requerido' })}
                />
                {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="juan@empresa.com"
                  {...register('clientEmail', {
                    required: 'Email requerido',
                    pattern: { value: /^\S+@\S+$/, message: 'Email inválido' },
                  })}
                />
                {errors.clientEmail && <p className="text-xs text-destructive">{errors.clientEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="+52 55 1234 5678" {...register('clientPhone')} />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input placeholder="Mi Empresa S.A." {...register('clientCompany')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicios solicitados</CardTitle>
              <CardDescription>Agrega los servicios o productos que necesitas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Descripción del servicio"
                      {...register(`items.${idx}.description`, { required: true })}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Cant."
                      min="0.01"
                      step="0.01"
                      {...register(`items.${idx}.quantity`, { valueAsNumber: true, min: 0.01 })}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Precio"
                      min="0"
                      step="0.01"
                      {...register(`items.${idx}.unitPrice`, { valueAsNumber: true, min: 0 })}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(idx)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

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
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (16%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base">
                  <span>Total estimado</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label>Notas adicionales</Label>
                <Textarea
                  placeholder="Describe cualquier requerimiento especial, fechas de entrega, etc."
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud de cotización'}
          </Button>
        </form>
      </div>
    </div>
  )
}
