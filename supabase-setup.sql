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

-- Cash Out: importe que paga la casa al cerrar una apuesta antes de tiempo
-- (solo se rellena cuando resultado = 'cashout'; en cualquier otro caso queda en null).
alter table public.apuestas add column cashout_importe numeric;

-- Objetivo personal: como mucho uno activo por bankroll (categoria), gracias
-- al unique(user_id, categoria) — guardar uno nuevo para la misma categoría
-- sustituye al anterior (upsert desde useObjetivos.js). No guarda "para qué
-- mes/semana concreto": siempre se evalúa contra el periodo actual.
create table public.objetivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  categoria text not null check (categoria in ('apuestas', 'entretenimiento')),
  tipo text not null check (tipo in ('beneficio', 'yield', 'num_apuestas', 'acierto')),
  periodo text not null check (periodo in ('semana', 'mes', 'anio')),
  valor_objetivo numeric not null,
  creado_en timestamptz not null default now(),
  unique (user_id, categoria)
);

alter table public.objetivos enable row level security;
create policy "propietario_objetivos" on public.objetivos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter publication supabase_realtime add table public.objetivos;

-- Bonos pendientes: recordatorio suelto de un freebet/bono prometido por una
-- casa (por un seguro que perdió, por un depósito, etc.) que todavía no se
-- ha registrado como apuesta. Sin "resuelto": marcarlo como hecho borra la
-- fila directamente (mismo criterio que objetivos, sin histórico).
create table public.bonos_pendientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  casa text not null,
  importe numeric not null,
  motivo text,
  fecha date not null,
  creado_en timestamptz not null default now()
);

alter table public.bonos_pendientes enable row level security;
create policy "propietario_bonos_pendientes" on public.bonos_pendientes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter publication supabase_realtime add table public.bonos_pendientes;

-- Apuesta asegurada: importe del freebet que promete la casa si esta
-- apuesta concreta se pierde (null si no tiene seguro). Al marcarla como
-- "Perdida", App.jsx crea el bono pendiente solo.
alter table public.apuestas add column seguro_freebet_importe numeric;

-- Aumento de cuota: % que la casa añade a la ganancia neta si la apuesta
-- gana (null si no tiene aumento). Ver calcularBeneficio en utils/apuestas.js.
alter table public.apuestas add column aumento_pct numeric;

