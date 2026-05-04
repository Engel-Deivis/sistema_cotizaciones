import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import clientRoutes from './routes/clients.routes'
import quoteRoutes from './routes/quotes.routes'

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/quotes', quoteRoutes)

app.get('/', (_, res) => res.json({ message: 'CotizaCRM API', status: 'ok' }))
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Solo escuchar en local, en Vercel se exporta el app
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
  })
}

export default app
