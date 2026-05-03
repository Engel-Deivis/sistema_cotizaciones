import { Router } from 'express'
import {
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  updateQuoteStatus,
  sendQuoteEmail,
  getDashboardStats,
  publicCreateQuote,
  publicQuoteValidators,
  quoteValidators,
} from '../controllers/quotes.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Ruta pública para formulario de solicitud
router.post('/public', publicQuoteValidators, publicCreateQuote)

// Rutas protegidas
router.use(authenticate)

router.get('/stats', getDashboardStats)
router.get('/', listQuotes)
router.get('/:id', getQuote)
router.post('/', quoteValidators, createQuote)
router.put('/:id', quoteValidators, updateQuote)
router.delete('/:id', deleteQuote)
router.patch('/:id/status', updateQuoteStatus)
router.post('/:id/send-email', sendQuoteEmail)

export default router
