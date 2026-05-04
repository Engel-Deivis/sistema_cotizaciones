import 'dotenv/config'
import 'express-async-errors'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import clientRoutes from './routes/clients.routes'
import quoteRoutes from './routes/quotes.routes'

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
]

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) cb(null, true)
      else cb(null, true) // En producción Vercel están en el mismo dominio
    },
    credentials: true,
  })
)
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/quotes', quoteRoutes)

app.get('/', (_, res) => res.json({ message: 'CotizaCRM API', status: 'ok' }))
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
)

// Global error handler — captura todos los errores async sin try/catch
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message)

  // Errores de Prisma
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    res.status(409).json({ error: 'Conflicto en la base de datos' })
    return
  }
  if (
    err.constructor.name === 'PrismaClientInitializationError' ||
    err.constructor.name === 'PrismaClientRustPanicError'
  ) {
    res.status(503).json({ error: 'Error de conexión a la base de datos' })
    return
  }

  res.status(500).json({ error: err.message || 'Error interno del servidor' })
})

// Solo escuchar en local, en Vercel se exporta el app
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
  })
}

export default app
