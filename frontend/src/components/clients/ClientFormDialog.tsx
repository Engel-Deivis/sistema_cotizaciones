import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useClientsStore, Client } from '@/store/clients.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
  client?: Client
}

interface FormValues {
  name: string
  email: string
  phone: string
  company: string
  notes: string
}

export function ClientFormDialog({ open, onClose, client }: Props) {
  const { createClient, updateClient } = useClientsStore()
  const isEdit = !!client

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      reset({
        name: client?.name ?? '',
        email: client?.email ?? '',
        phone: client?.phone ?? '',
        company: client?.company ?? '',
        notes: client?.notes ?? '',
      })
    }
  }, [open, client, reset])

  const onSubmit = async (data: FormValues) => {
    if (isEdit) {
      await updateClient(client.id, data)
    } else {
      await createClient(data)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="María García"
              {...register('name', { required: 'Nombre requerido' })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="maria@empresa.com"
              {...register('email', {
                required: 'Email requerido',
                pattern: { value: /^\S+@\S+$/, message: 'Email inválido' },
              })}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input placeholder="+52 55 1234 5678" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input placeholder="Mi Empresa S.A." {...register('company')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea placeholder="Observaciones sobre el cliente..." rows={3} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
