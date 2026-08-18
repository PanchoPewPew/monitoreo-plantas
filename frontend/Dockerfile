# ── Etapa 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias (aprovecha caché de Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto y construir
COPY . .
RUN npm run build

# ── Etapa 2: servidor estático con nginx ─────────────────────────
FROM nginx:1.27-alpine

# Eliminar la config por defecto y copiar la nuestra
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build generado por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
