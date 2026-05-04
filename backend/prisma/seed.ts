import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cotizaciones.dev' },
    update: { password: hashedPassword, name: 'Administrador' },
    create: {
      email: 'admin@cotizaciones.dev',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
    },
  })

  const client1 = await prisma.client.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      name: 'María García',
      email: 'maria@empresa.com',
      phone: '+52 55 1234 5678',
      company: 'Empresa ABC S.A.',
      notes: 'Cliente frecuente, prefiere comunicación por email',
    },
  })

  const client2 = await prisma.client.upsert({
    where: { id: 'seed-client-2' },
    update: {},
    create: {
      id: 'seed-client-2',
      name: 'Juan Pérez',
      email: 'juan@startup.io',
      phone: '+52 33 9876 5432',
      company: 'Startup XYZ',
    },
  })

  await prisma.quote.upsert({
    where: { id: 'seed-quote-1' },
    update: {},
    create: {
      id: 'seed-quote-1',
      number: 1,
      clientId: client1.id,
      status: 'approved',
      notes: 'Proyecto de rediseño web completo',
      subtotal: 15000,
      tax: 2400,
      total: 17400,
      currency: 'MXN',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { description: 'Diseño UI/UX', quantity: 1, unitPrice: 8000, total: 8000, order: 0 },
          { description: 'Desarrollo Frontend', quantity: 1, unitPrice: 5000, total: 5000, order: 1 },
          { description: 'Integración Backend', quantity: 1, unitPrice: 2000, total: 2000, order: 2 },
        ],
      },
    },
  })

  await prisma.quote.upsert({
    where: { id: 'seed-quote-2' },
    update: {},
    create: {
      id: 'seed-quote-2',
      number: 2,
      clientId: client2.id,
      status: 'pending',
      notes: 'MVP de aplicación móvil',
      subtotal: 25000,
      tax: 4000,
      total: 29000,
      currency: 'MXN',
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { description: 'Diseño de pantallas', quantity: 10, unitPrice: 800, total: 8000, order: 0 },
          { description: 'Desarrollo React Native', quantity: 1, unitPrice: 12000, total: 12000, order: 1 },
          { description: 'Backend API', quantity: 1, unitPrice: 5000, total: 5000, order: 2 },
        ],
      },
    },
  })

  console.log('✅ Seed completado')
  console.log(`👤 Admin: admin@cotizaciones.dev / admin123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
