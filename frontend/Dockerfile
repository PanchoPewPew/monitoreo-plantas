# ── Etapa 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# URL del backend — se pasa como build arg en Render/Railway
# Ejemplo: --build-arg BACKEND_URL=https://mi-backend.up.railway.app
ARG BACKEND_URL=http://localhost:8888

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
