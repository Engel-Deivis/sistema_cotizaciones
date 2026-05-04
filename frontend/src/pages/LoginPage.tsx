import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Receipt } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginForm {
  email: string
  password: string
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()

  if (isAuthenticated) return <Navigate to="/admin" replace />

  const onSubmit = async ({ email, password }: LoginForm) => {
    setError('')
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) {
          setError('Email o contraseña incorrectos')
        } else if (status === 503) {
          setError('Error de conexión a la base de datos. Verifica la configuración.')
        } else {
          setError('Error del servidor. Intenta de nuevo.')
        }
      } else {
        setError('Error de conexión. Verifica tu internet.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">CotizaCRM</h1>
          <p className="text-sm text-muted-foreground">Panel de administración</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cotizaciones.dev"
                  {...register('email', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: true })}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Demo: admin@cotizaciones.dev / admin123
        </p>
      </div>
    </div>
  )
}
