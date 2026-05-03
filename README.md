# Sistema de Cotizaciones + CRM Lite

Portfolio project — Full-stack quotes management system with CRM features.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Zustand + Shadcn/ui + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite + Prisma ORM |
| Auth | JWT + Refresh Tokens (auto-rotation) |
| Email | Nodemailer (auto Ethereal account in dev) |

## Features

- **Formulario público** — Clientes solicitan cotizaciones sin registrarse
- **Panel admin** — Gestión de cotizaciones y clientes con filtros
- **Historial por cliente** — Todas las cotizaciones y estadísticas de cada cliente
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

# 2. Configurar base de datos
cd backend
npm run db:migrate    # Crea SQLite y aplica migraciones
npm run db:generate   # Genera Prisma client
npm run db:seed       # Inserta datos de ejemplo

# 3. Arrancar servidores (2 terminales)
cd backend && npm run dev      # → http://localhost:3001
cd frontend && npm run dev     # → http://localhost:5173
```

**Credenciales demo:** `admin@cotizaciones.dev` / `admin123`

## Production Deployment

### Frontend → Vercel

1. Importar repo en [vercel.com](https://vercel.com)
2. Vercel detecta `vercel.json` automáticamente
3. Agregar variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.onrender.com
   ```
4. Deploy

### Backend → Render

1. Crear cuenta en [render.com](https://render.com)
2. New Web Service → conectar este repo
3. Root Directory: `backend`
4. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
5. Start Command: `node dist/app.js`
6. Agregar variables de entorno:
   ```
   NODE_ENV=production
   DATABASE_URL=file:./prisma/prod.db
   JWT_SECRET=<genera uno seguro>
   JWT_REFRESH_SECRET=<genera uno seguro>
   FRONTEND_URL=https://tu-app.vercel.app
   ```
7. Deploy y copiar la URL para el paso de Vercel

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
