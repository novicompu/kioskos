# Kiosko — consulta de stock (Novisolutions)

App web mobile-first para personal de kioskos: login, catálogo de
productos con precio/stock según la ubicación del dispositivo (bodega(s) más
cercana(s)), e información del kiosko.

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + React Router +
  TanStack Query.
- **Backend**: Fastify + TypeScript + Prisma + PostgreSQL. Actúa como BFF:
  gestiona login/usuarios propios y proxea la API pública de Novisuite
  (Kiosko PayJoy, provista por Novisolutions) sin exponer el token de
  servicio al navegador.

## Requisitos

- Node.js 20+
- Docker (para levantar Postgres local) — o un Postgres propio.

## Puesta en marcha

```bash
# 1. Instalar dependencias (frontend + backend)
npm install

# 2. Levantar Postgres local (puerto 5433 para no chocar con otros contenedores)
docker compose up -d

# 3. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Edita backend/.env y coloca tu PAYJOY_SERVICE_KEY real

# 4. Migrar y poblar datos (usuario demo + metadata de kiosko)
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..

# 5. Levantar backend + frontend en paralelo
npm run dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:5173 (o el siguiente puerto libre)

**Usuario demo**: `pablo.gavilanes@payjoy.demo` / `payjoy123` (rol `SUPERADMIN`)

> El navegador pedirá permiso de ubicación al entrar al catálogo — es
> obligatorio, ya que de ahí depende qué bodega(s)/stock se muestran.

## Variables de entorno (backend/.env)

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión a Postgres |
| `JWT_SECRET` / `COOKIE_SECRET` | Secretos de sesión (cámbialos en producción) |
| `PAYJOY_API_BASE_URL` | Base de la API pública Novisuite |
| `PAYJOY_SERVICE_KEY` | Token de servicio para la API pública |
| `FRONTEND_ORIGIN` | Origen permitido por CORS y usado en los links de reseteo/invitación |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Opcionales. Servidor SMTP propio para enviar correos reales de recuperación de contraseña e invitaciones. Si se dejan vacíos, el correo se loguea en consola (`[mail] SMTP no configurado. Contenido para …`) en vez de enviarse. |

## Roles y gestión de usuarios

- Roles: `USER` (staff de kiosko), `ADMIN` (reservado para más adelante),
  `SUPERADMIN` (crea y administra usuarios, en `/admin/users`).
- El `SUPERADMIN` crea cuentas de dos formas: **invitación por correo**
  (la persona define su propia contraseña con un enlace, vía SMTP) o
  **contraseña definida por el superadmin** (con un generador simple
  incorporado). Cualquier usuario puede editar su nombre/correo y cambiar
  su contraseña desde "Actualizar datos".
- El rol viaja en el JWT de sesión: si un superadmin cambia el rol de
  alguien, esa persona debe volver a iniciar sesión para que se refleje.

## Pendientes conocidos

- **Panel de administración** de `KioskMeta` (dirección/contacto manual
  por bodega, para cuando la API de Novisuite no los traiga): hoy se
  mantiene con `prisma/seed.ts` o edición manual en la base de datos.
- **Desactivar/eliminar usuarios** desde el panel: por ahora solo se
  puede crear y editar nombre/rol vía API (`PATCH /api/admin/users/:id`),
  sin UI para editar ni una acción de "desactivar" todavía.

## Tests

```bash
npm test
```

Corre los smoke tests del backend (login y adapter de la API externa,
incluyendo manejo de errores de token/coordenadas inválidas).
