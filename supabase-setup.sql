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

-- Saldo de freebet por casa (Fase A): sustituye a "bonos_pendientes" como
-- forma de saber cuánto freebet tienes disponible — se ajusta solo desde
-- App.jsx (sube al registrar un bono de depósito o un seguro perdido, baja
-- al crear una apuesta con fondos Freebet, se devuelve si esa apuesta se
-- anula o se borra estando pendiente). "bonos_pendientes" no se borra, se
-- queda solo para el caso residual de "Otro bono" (ver Fase B).
alter table public.casas add column freebet_saldo numeric not null default 0;

-- Migración de un solo uso: arranca el saldo de cada casa con lo que ya
-- tuviera acumulado en bonos_pendientes, para no perder ese seguimiento.
update public.casas c set freebet_saldo = coalesce((
  select sum(b.importe) from public.bonos_pendientes b
  where b.user_id = c.user_id and b.casa = c.nombre
), 0);

-- Archivado por rango de fechas (Fase C): no borra nada, solo oculta de
-- las vistas normales (Apuestas/Entretenimiento, Estadísticas, Informe).
-- El dinero real (Casas de apuestas) y los trofeos siguen contando estas
-- filas igual, archivadas o no. Se gestiona desde Ajustes > Archivar datos.
alter table public.apuestas add column archivado boolean not null default false;
alter table public.movimientos add column archivado boolean not null default false;

-- Fase D: fecha de la última copia de seguridad exportada, para el aviso en
-- Ajustes. A diferencia de "trofeos-vistos" (solo local), esto sí se quiere
-- ver igual en todos los dispositivos: una fila por usuario.
create table public.ajustes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ultima_copia timestamptz
);

alter table public.ajustes enable row level security;
create policy "propietario_ajustes" on public.ajustes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter publication supabase_realtime add table public.ajustes;

-- "Otro bono" (ListadoCasas.jsx) dejó de crear una fila en bonos_pendientes
-- y pasa a sumar directo al saldo de freebet de la casa, igual que el bono
-- de depósito y el seguro perdido. Migración de un solo uso: lo que hubiera
-- quedado sin resolver en bonos_pendientes se suma ahora a freebet_saldo,
-- para no perderlo — usa "+" (no sobrescribe) porque freebet_saldo ya puede
-- tener valor por los otros dos caminos. La tabla bonos_pendientes no se
-- borra, se queda sin uso (mismo criterio que la tabla promociones).
update public.casas c set freebet_saldo = freebet_saldo + coalesce((
  select sum(b.importe) from public.bonos_pendientes b
  where b.user_id = c.user_id and b.casa = c.nombre
), 0);

-- Cuota total "manual": en combinadas de varias patas, multiplicar cuotas
-- ya redondeadas a 2 decimales acumula un pequeño error de redondeo frente
-- a la cuota real de la casa (que calcula con más precisión interna) — con
-- 4-5 patas puede notarse unos céntimos. Si el usuario introduce el
-- importe real que le paga la casa, se guarda aquí la cuota que sale de
-- ahí (importe / stake) y manda sobre el producto calculado — ver
-- calcularCuotaTotal en utils/apuestas.js.
alter table public.apuestas add column cuota_total_manual numeric;

-- Bankroll separado por bankroll (Apuestas/Entretenimiento), no solo por
-- casa: hasta ahora el dinero de una casa era el mismo para las dos
-- categorías (compartido), pero el usuario quiere llevarlas separadas de
-- verdad (p.ej. Bet365 usado para las dos a la vez). "movimientos" gana la
-- misma columna "categoria" que ya tenía "apuestas" — sin valor por
-- defecto: los movimientos ya registrados se borran y se vuelven a meter
-- (eran solo 3), así que no hace falta rellenar nada con un valor
-- adivinado. calcularBankrollPorCasa (utils/movimientos.js) filtra por
-- categoria cuando se le pasa una.
alter table public.movimientos add column categoria text check (categoria in ('apuestas', 'entretenimiento'));

-- Freebet separado por bankroll, mismo motivo que el dinero real de arriba:
-- un freebet dado por una promo de Entretenimiento no debería poder
-- gastarse sin querer en una apuesta de Apuestas. "freebet_saldo" (un solo
-- número por casa) se sustituye por dos columnas — sin migrar el valor
-- antiguo (el usuario solo tenía 2€ sueltos, los vuelve a meter a mano con
-- el selector nuevo); "freebet_saldo" se queda en la tabla sin usar, mismo
-- criterio que con "promociones"/"bonos_pendientes".
alter table public.casas add column freebet_saldo_apuestas numeric not null default 0;
alter table public.casas add column freebet_saldo_entretenimiento numeric not null default 0;

-- Caché COMPARTIDA (no por usuario) de resultados finales de partidos, para
-- gastar como mucho 1 llamada a API-Football por partido en toda la vida de
-- la app, la haga quien la haga. Sin caducidad a propósito: a diferencia de
-- la caché de fixtures del día (que sí se refresca), un resultado final no
-- cambia nunca una vez el partido termina — ver usePartidoInfo.js, que solo
-- escribe aquí cuando el estado ya es uno "terminado" (FT/AET/PEN/...).
create table public.resultados_partidos (
  partido_id bigint primary key,
  estado text not null,
  goles_local integer,
  goles_visitante integer,
  guardado_en timestamptz not null default now()
);

-- Sin user_id: es una caché de datos públicos de partidos, no información
-- personal — cualquier usuario autenticado de la app (hoy solo hay uno) la
-- puede leer y escribir, así que un partido consultado por cualquiera queda
-- disponible para todos sin gastar llamadas adicionales.
alter table public.resultados_partidos enable row level security;
create policy "autenticados_resultados_partidos" on public.resultados_partidos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Avisos de partido terminado (api/telegram-avisos.js, disparado por un
-- cron externo gratuito tipo cron-job.org — Vercel Hobby solo deja crons
-- una vez al día, insuficiente para esto): marca si ya se mandó el aviso
-- de Telegram de este partido, para no repetirlo en cada revisión. Escrito
-- con la service role key (salta el RLS de arriba), igual que el resto de
-- escrituras del bot.
alter table public.resultados_partidos add column notificado boolean not null default false;

-- Mensajes de Telegram con botón "Ver apuesta"/"Abrir apuesta" mandados
-- para una apuesta (puede haber varios: uno de /pendientes, uno por cada
-- partido que va terminando en una combinada...) — para poder editar ese
-- botón más tarde (api/telegram-resuelta.js) cuando la apuesta quede
-- resuelta, sin tener que volver a mandar nada nuevo. Se borran las filas
-- en cuanto se editan los mensajes correspondientes, no hace falta
-- guardar histórico.
create table public.telegram_mensajes (
  id uuid primary key default gen_random_uuid(),
  apuesta_id uuid not null references public.apuestas(id) on delete cascade,
  chat_id bigint not null,
  message_id bigint not null,
  creado_en timestamptz not null default now()
);

-- Solo la usan las Serverless Functions del bot (service role, salta el
-- RLS) — mismo criterio que resultados_partidos: no es información
-- personal sensible más allá de lo que ya vive en "apuestas", pero se deja
-- con RLS igualmente por consistencia con el resto de tablas.
alter table public.telegram_mensajes enable row level security;
create policy "autenticados_telegram_mensajes" on public.telegram_mensajes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Limitador propio de llamadas a API-Football (independiente del límite
-- real de la API): nunca deja salir más de 8 peticiones por minuto desde
-- toda la app, sea cual sea el origen (bug, pico de visitas...) — una sola
-- fila compartida por las 4 funciones que llaman a API-Football (ver
-- api/_lib/limitadorApiFootball.js). Motivo: la cuenta de API-Football se
-- suspendió el 2026-09-02 tras una ráfaga de peticiones duplicadas (bug ya
-- corregido en usePlantilla.js) — esto es la red de seguridad para que no
-- pueda volver a pasar por ningún otro motivo futuro.
create table public.limitador_api_football (
  id int primary key default 1,
  ventana_inicio timestamptz not null default now(),
  contador int not null default 0
);
insert into public.limitador_api_football (id) values (1) on conflict (id) do nothing;

-- SELECT ... FOR UPDATE bloquea la fila mientras dura la función: si dos
-- peticiones llegan a la vez, la segunda espera a que la primera termine
-- antes de leer el contador, así nunca se cuelan las dos por encima del
-- límite a la vez.
create or replace function reservar_llamada_api_football(p_limite int, p_ventana_segundos int)
returns boolean
language plpgsql
as $$
declare
  v_ventana_inicio timestamptz;
  v_contador int;
  v_reiniciar boolean;
  v_permitido boolean;
begin
  select ventana_inicio, contador into v_ventana_inicio, v_contador
  from public.limitador_api_football
  where id = 1
  for update;

  v_reiniciar := (now() - v_ventana_inicio) >= (p_ventana_segundos || ' seconds')::interval;

  if v_reiniciar then
    v_permitido := true;
    update public.limitador_api_football set ventana_inicio = now(), contador = 1 where id = 1;
  elsif v_contador < p_limite then
    v_permitido := true;
    update public.limitador_api_football set contador = v_contador + 1 where id = 1;
  else
    v_permitido := false;
  end if;

  return v_permitido;
end;
$$;

-- Tabla de control interno pura, sin ningún dato personal — a diferencia
-- de resultados_partidos, ni siquiera hace falta una
-- política para "authenticated": nadie desde el navegador necesita tocarla
-- nunca, solo las Serverless Functions con la service role key (que salta
-- el RLS igualmente). RLS activado sin políticas = nadie más puede leerla
-- ni escribirla.
alter table public.limitador_api_football enable row level security;

-- Caché compartida y PERMANENTE de plantillas de equipo (players/squads):
-- una vez pedida la de un equipo, se guarda para siempre — nadie vuelve a
-- gastar una llamada a la API por ese equipo, sea cual sea el dispositivo o
-- el usuario. Mismo patrón que resultados_partidos, pero para plantillas
-- en vez de marcadores.
create table public.plantillas_equipos (
  equipo_id int primary key,
  jugadores jsonb not null,
  actualizado_en timestamptz not null default now()
);

-- Igual que limitador_api_football: solo la tocan las Serverless Functions
-- (service role), nadie desde el navegador necesita leerla ni escribirla
-- directamente.
alter table public.plantillas_equipos enable row level security;

-- Bot de Telegram eliminado por completo (2026-09-02, petición directa —
-- no aportaba mucho más que estar pendiente del móvil, que el usuario ya
-- hace solo). Se borra lo que ya no usa nadie: la tabla de sus mensajes y
-- la columna que marcaba "ya avisado" en resultados_partidos.
drop table if exists public.telegram_mensajes;
alter table public.resultados_partidos drop column if exists notificado;

