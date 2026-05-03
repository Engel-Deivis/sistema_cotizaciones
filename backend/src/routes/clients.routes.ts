import { Router } from 'express'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  clientValidators,
} from '../controllers/clients.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', listClients)
router.get('/:id', getClient)
router.post('/', clientValidators, createClient)
router.put('/:id', clientValidators, updateClient)
router.delete('/:id', deleteClient)

export default router
