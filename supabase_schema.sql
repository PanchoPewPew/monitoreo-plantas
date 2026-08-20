-- ============================================================
-- Schema completo — Plataforma de Monitoreo Agrícola IoT
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Extensión para UUIDs automáticos
create extension if not exists "pgcrypto";

-- ── 1. USUARIO ───────────────────────────────────────────────
create table if not exists usuario (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  email            text not null unique,
  hash_contrasena  text not null,
  rol              text not null default 'agronomo'
                     check (rol in ('admin', 'agronomo', 'inversionista')),
  num_telefono     text,
  created_at       timestamptz default now()
);

-- ── 2. PREDIO ────────────────────────────────────────────────
create table if not exists predio (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  ubicacion    text,
  tipo_cultivo text,
  created_at   timestamptz default now()
);

-- ── 3. USUARIO_PREDIO (N:M) ──────────────────────────────────
create table if not exists usuario_predio (
  usuario_id  uuid not null references usuario(id) on delete cascade,
  predio_id   uuid not null references predio(id)  on delete cascade,
  primary key (usuario_id, predio_id)
);

-- ── 4. SENSORES ──────────────────────────────────────────────
create table if not exists sensores (
  id         uuid primary key default gen_random_uuid(),
  device_id  text,
  sector     text not null default 'default',
  predio_id  uuid references predio(id) on delete cascade,
  created_at timestamptz default now()
);

-- ── 5. TELEMETRIA ────────────────────────────────────────────
create table if not exists telemetria (
  id          uuid primary key default gen_random_uuid(),
  sensor_id   uuid not null references sensores(id) on delete cascade,
  humedad     float,
  temperatura float,
  ph          float,
  voltaje     float,
  created_at  timestamptz default now()
);

-- ── 6. LECTURAS_CULTIVO ──────────────────────────────────────
-- Tabla simplificada que lee el frontend (dashboard)
create table if not exists lecturas_cultivo (
  id            uuid primary key default gen_random_uuid(),
  temperatura   float,
  humedad_aire  float,
  humedad_suelo float,
  created_at    timestamptz default now()
);

-- ── 7. UMBRALES ──────────────────────────────────────────────
create table if not exists umbrales (
  id               uuid primary key default gen_random_uuid(),
  predio_id        uuid not null references predio(id) on delete cascade,
  humedad_min      float,
  humedad_max      float,
  temperatura_min  float,
  temperatura_max  float,
  ph_min           float,
  ph_max           float,
  voltaje_min      float,
  created_at       timestamptz default now()
);

-- ── 8. ALERTAS ───────────────────────────────────────────────
create table if not exists alertas (
  id         uuid primary key default gen_random_uuid(),
  sensor_id  uuid not null references sensores(id) on delete cascade,
  tipo       text not null,
  valor      float,
  mensaje    text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS) — desactivado para API con service key
-- Si usas anon key, activa RLS y agrega políticas según necesites
-- ============================================================
alter table usuario         disable row level security;
alter table predio          disable row level security;
alter table usuario_predio  disable row level security;
alter table sensores        disable row level security;
alter table telemetria      disable row level security;
alter table lecturas_cultivo disable row level security;
alter table umbrales        disable row level security;
alter table alertas         disable row level security;
