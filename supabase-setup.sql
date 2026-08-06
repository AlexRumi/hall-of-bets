-- Hall of Bets: esquema inicial para sincronizar entre dispositivos.
-- Pega y ejecuta esto entero en el SQL Editor de tu proyecto de Supabase.

create extension if not exists pgcrypto;

create table public.apuestas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  casa text not null,
  stake numeric not null,
  tipo_fondos text not null,
  categoria text not null,
  resultado text not null default 'pendiente',
  selecciones jsonb not null,
  creado_en timestamptz not null default now()
);

create table public.casas (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  logo text,
  primary key (user_id, nombre)
);

create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  casa text not null,
  tipo text not null,
  valor numeric not null,
  estado text not null default 'pendiente',
  beneficio_neto numeric,
  creado_en timestamptz not null default now()
);

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  casa text not null,
  tipo text not null,
  cantidad numeric not null,
  creado_en timestamptz not null default now()
);

-- Row Level Security: cada usuario solo puede ver y tocar sus propias filas.
alter table public.apuestas enable row level security;
alter table public.casas enable row level security;
alter table public.promociones enable row level security;
alter table public.movimientos enable row level security;

create policy "propietario_apuestas" on public.apuestas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "propietario_casas" on public.casas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "propietario_promociones" on public.promociones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "propietario_movimientos" on public.movimientos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: para que los cambios se vean al instante en el otro dispositivo.
alter publication supabase_realtime add table public.apuestas;
alter publication supabase_realtime add table public.casas;
alter publication supabase_realtime add table public.promociones;
alter publication supabase_realtime add table public.movimientos;
alter table public.apuestas add column deporte text;

