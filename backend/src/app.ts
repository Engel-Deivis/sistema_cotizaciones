import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import clientRoutes from './routes/clients.routes'
import quoteRoutes from './routes/quotes.routes'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/quotes', quoteRoutes)

app.get('/', (_, res) => res.json({ message: 'CotizaCRM API', docs: '/api/health' }))
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
  console.log(`📋 Health: http://localhost:${PORT}/api/health`)
})

export default app
