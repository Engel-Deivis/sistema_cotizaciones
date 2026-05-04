# Sistema de Cotizaciones + CRM Lite

Portfolio project — Full-stack quotes management system with CRM features.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Zustand + Shadcn/ui + Tailwind CSS |
| Backend | Node.js + Express + TypeScript (Vercel Serverless) |
| Database | PostgreSQL + Prisma ORM (Neon — free tier) |
| Auth | JWT + Refresh Tokens (auto-rotation) |
| Email | Nodemailer (Ethereal en dev, SMTP en prod) |
| Deploy | Vercel (frontend + backend serverless) |

## Features

- **Formulario público** — Clientes solicitan cotizaciones sin registrarse
- **Panel admin** — Gestión de cotizaciones y clientes con filtros
- **Historial por cliente** — Todas las cotizaciones y estadísticas por cliente
- **Envío de emails** — Cotizaciones por email con preview en desarrollo
- **Auth segura** — Access token (15min) + Refresh token (7d) con rotación automática
- **Cambio de estado** — pending → sent → approved / rejected / expired

## Local Development

```bash
# 1. Clonar e instalar
git clone https://github.com/Engel-Deivis/sistema_cotizaciones.git
cd sistema_cotizaciones

cd backend && npm install
cd ../frontend && npm install

# 2. Configurar .env en backend/
cp backend/.env.example backend/.env
# Editar DATABASE_URL con tu conexión PostgreSQL local o Neon

# 3. Base de datos
cd backend
npm run db:migrate
npm run db:generate
npm run db:seed       # admin@cotizaciones.dev / admin123

# 4. Arrancar (2 terminales)
cd backend && npm run dev      # http://localhost:3001
cd frontend && npm run dev     # http://localhost:5173
```

## Deploy en Vercel (todo en uno)

### 1. Base de datos — Neon (gratis)

1. Crear cuenta en [neon.tech](https://neon.tech)
2. New Project → copiar el **Connection String**

### 2. Deploy en Vercel

1. Importar este repo en [vercel.com](https://vercel.com)
2. Vercel detecta `vercel.json` automáticamente
3. Agregar estas variables de entorno en Vercel:

```
DATABASE_URL=postgresql://...  ← Connection string de Neon
JWT_SECRET=<string aleatorio largo>
JWT_REFRESH_SECRET=<string aleatorio largo>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://tu-proyecto.vercel.app
```

4. En **Build & Development Settings**:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

5. Deploy ✓

### 3. Correr migraciones y seed en producción

En Vercel → Settings → Environment Variables, luego desde terminal local:

```bash
cd backend
DATABASE_URL="tu-neon-url" npx prisma migrate deploy
DATABASE_URL="tu-neon-url" npx tsx prisma/seed.ts
```

## Routes

| URL | Description |
|-----|-------------|
| `/` | Formulario público de cotización |
| `/login` | Acceso al panel admin |
| `/admin` | Dashboard con estadísticas |
| `/admin/quotes` | Gestión de cotizaciones |
| `/admin/clients` | Gestión de clientes |
| `/admin/clients/:id` | Detalle + historial del cliente |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Renovar tokens |
| POST | `/api/auth/logout` | No | Logout |
| GET | `/api/auth/me` | Yes | Usuario actual |
| GET | `/api/quotes/stats` | Yes | Stats del dashboard |
| GET | `/api/quotes` | Yes | Listar cotizaciones |
| POST | `/api/quotes` | Yes | Crear cotización |
| PUT | `/api/quotes/:id` | Yes | Editar cotización |
| PATCH | `/api/quotes/:id/status` | Yes | Cambiar estado |
| POST | `/api/quotes/:id/send-email` | Yes | Enviar por email |
| DELETE | `/api/quotes/:id` | Yes | Eliminar |
| POST | `/api/quotes/public` | No | Solicitud pública |
| GET | `/api/clients` | Yes | Listar clientes |
| POST | `/api/clients` | Yes | Crear cliente |
| GET | `/api/clients/:id` | Yes | Cliente + historial |
| PUT | `/api/clients/:id` | Yes | Editar cliente |
| DELETE | `/api/clients/:id` | Yes | Eliminar cliente |
