# ── Etapa 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# URLs y keys — se pasan como build args en Render/Railway
ARG BACKEND_URL=http://localhost:8888
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_PUBLISHABLE_KEY=""

# Exponer como variables de entorno para que Vite las inyecte en el bundle
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa 2: servidor estático con nginx ─────────────────────────
FROM nginx:1.27-alpine

# Copiar config con placeholder y reemplazar la URL del backend
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
ARG BACKEND_URL=http://localhost:8888
RUN sed "s|BACKEND_PLACEHOLDER|${BACKEND_URL}|g" \
    /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
