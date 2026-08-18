# Stack Tecnológico — Plataforma de Monitoreo Agrícola IoT

## Visión general

Sistema full-stack para monitoreo de sensores en predios agrícolas. Arquitectura cliente-servidor con un frontend SPA, un backend REST y una base de datos gestionada en la nube.

```
┌─────────────────────┐        ┌──────────────────────┐
│   Frontend (React)  │──/api──▶   Backend (FastAPI)   │
│   nginx :80         │        │   uvicorn :8000       │
└─────────────────────┘        └──────────┬───────────┘
                                           │
                                 ┌─────────▼──────────┐
                                 │   Supabase (cloud) │
                                 │   PostgreSQL + Auth │
                                 └────────────────────┘
```

---

## Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19.2 | Librería de UI principal |
| **Vite** | 8.0 | Bundler y dev server |
| **nginx** | 1.27 | Servidor estático en producción + proxy inverso |
| **Font Awesome** | 7.2 | Iconografía |
| **ESLint** | 9.x | Linting de código |

### Estructura relevante

```
frontend/
├── src/
│   ├── pages/          # AuthPage, DashboardPage
│   ├── components/     # auth/, dashboard/
│   ├── auth/           # LoginForm, RegisterForm
│   ├── services/       # authApi.js, backendApi.js, supabaseApi.js
│   ├── utils/          # exportUtils, useSessionTimeout
│   └── data/           # dashboardData.js (datos estáticos)
├── Dockerfile          # Build multietapa: Node 20 → nginx
└── nginx.conf          # SPA routing + proxy /api → backend
```

### Notas de diseño

- SPA sin React Router instalado; navegación manejada con estado (`view` en `App.jsx`)
- Proxy `/api/*` → backend configurado en nginx (producción) y en `vite.config.js` (desarrollo)
- Exportación de telemetría a PDF y Excel via `exportUtils`
- Sesión persistida en `localStorage` con timeout de inactividad (5 min)

---

## Backend

| Tecnología | Versión | Rol |
|---|---|---|
| **Python** | 3.11 | Lenguaje base |
| **FastAPI** | latest | Framework web asíncrono |
| **Uvicorn** | latest | Servidor ASGI |
| **Pydantic** | latest | Validación de datos y esquemas |
| **SQLModel** | latest | Modelos ORM compatibles con Pydantic |
| **supabase-py** | latest | Cliente oficial de Supabase |
| **PyJWT** | latest | Generación y validación de tokens JWT |
| **bcrypt** | latest | Hash seguro de contraseñas |
| **python-dotenv** | latest | Carga de variables de entorno desde `.env` |

### Estructura relevante

```
backend/app/
├── api/            # Routers: alertas, predio, sensores, telemetry, umbrales, usuario
├── models/         # Modelos Pydantic/SQLModel por entidad
├── services/       # Lógica de negocio desacoplada de los routers
├── db/             # supabase_client.py (instancia global del cliente)
├── utils/          # auth_dependency.py, logger.py, validators.py
└── main.py         # Configuración de la app, CORS, registro de routers
```

### Módulos API expuestos

| Prefijo | Descripción |
|---|---|
| `/api/auth` | Login y registro de usuarios |
| `/api/usuarios` | CRUD de usuarios (protegido) |
| `/api/telemetry` | Recepción de muestras de sensores |
| `/api/sensores` | Gestión de sensores |
| `/api/predios` | Gestión de predios agrícolas |
| `/api/umbrales` | Configuración de umbrales por sensor |
| `/api/alertas` | Consulta y gestión de alertas |

### Autenticación

- JWT firmado con HS256, expiración de 24 horas
- Middleware `get_current_user` como dependencia FastAPI en rutas protegidas
- Control de acceso por rol (`admin`, `agronomo`, `inversionista`) via `require_rol()`

---

## Base de datos

| Tecnología | Rol |
|---|---|
| **Supabase** | BaaS (Backend as a Service) — PostgreSQL gestionado en la nube |
| **PostgreSQL** | Motor de base de datos relacional |

- Acceso desde el backend via `supabase-py` con `SUPABASE_URL` y `SUPABASE_KEY`
- No se usa ORM completo; las queries se hacen directamente con el cliente de Supabase
- Tabla principal de telemetría: `lectura_cultivos`

---

## Infraestructura y despliegue

| Tecnología | Rol |
|---|---|
| **Docker** | Contenedorización de backend y frontend |
| **Docker Compose** | Orquestación local de los servicios |
| **Railway** | Plataforma de despliegue en la nube (producción) |

### Comandos de despliegue

```bash
# Producción (build estático + nginx)
docker compose up -d --build

# Solo reconstruir un servicio
docker compose up -d --build frontend
docker compose up -d --build backend
```

### Puertos

| Servicio | Puerto host | Puerto interno |
|---|---|---|
| Frontend (nginx) | 80 | 80 |
| Backend (uvicorn) | 8888 | 8000 |

### Variables de entorno requeridas (`backend/.env`)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto en Supabase |
| `SUPABASE_KEY` | Anon/publishable key de Supabase |
| `JWT_SECRET_KEY` | Clave secreta para firmar tokens JWT |

---

## Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| **ESLint** | Linting del frontend (reglas react-hooks, react-refresh) |
| **Git** | Control de versiones |
| **.gitignore** | Excluye `.env`, `node_modules/`, `__pycache__/`, `dist/` |
