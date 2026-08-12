# Hall of Bets

Registro personal de apuestas deportivas (uso individual, no multiusuario). El dueño del proyecto tiene nivel de programación básico — explica los cambios de forma clara y evita dar por hecho conocimientos avanzados.

## Stack

- Frontend: React + Vite, JavaScript (no TypeScript por ahora)
- Estilos: Tailwind CSS (paleta y fuentes ya configuradas en `tailwind.config.js` / `src/index.css`)
- Backend: Supabase (plan gratuito) — solo como base de datos + autenticación. La fase 11 (bot de fotos) seguiría necesitando un backend propio (API key de IA), se omitió por el coste recurrente. Desde el buscador de partidos (ver más abajo) sí hay una pieza mínima de servidor propio: una Serverless Function de Vercel, solo para no exponer la key de API-Football
- Base de datos: Supabase (Postgres), con Row Level Security atada al usuario. Antes vivía en localStorage del navegador (decidido en fase 2); se migró para poder ver las mismas apuestas desde PC y móvil. Un solo usuario, creado a mano en el panel de Supabase (Authentication > Users), sin registro público. `trofeos-vistos` (qué notificaciones de trofeo ya se han visto) se queda en localStorage de cada dispositivo, no se sincroniza
- Autenticación: Supabase Auth (email + contraseña), sesión persistida por dispositivo; pantalla de login propia en `src/components/PantallaLogin.jsx`
- Gráficas: recharts
- Iconos: lucide-react
- Despliegue: GitHub (`AlexRumi/hall-of-bets`, rama `main`) + Vercel (`hall-of-bets.vercel.app`), auto-deploy en cada push a `main`. Vercel necesita las variables de entorno `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `API_FOOTBALL_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_USER_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` y `TELEGRAM_OWNER_ID` (Project Settings > Environment Variables) — ver comentarios de cada una en `.env.example`; en local van en `.env.local` (no se sube a git)
- Bot de Telegram (`api/telegram-webhook.js`): resuelve apuestas pendientes (Ganada/Perdida/Nula por mercado, o Cash Out) desde el móvil sin abrir la app, con `/pendientes`. Otra Serverless Function de Vercel, con su propio backend mínimo: escribe en Supabase con la service role key (`api/_lib/supabaseAdmin.js`, salta el RLS — no hay sesión de navegador en un webhook) y reutiliza la misma lógica de derivación de resultado que la app (`api/_lib/apuestasResueltas.js` importa `agruparSeleccionesPorPartido`/`derivarResultadoApuesta` de `src/utils/apuestas.js`, no la reescribe). Solo responde a tu ID de Telegram (`TELEGRAM_OWNER_ID`); cada petición debe traer el `secret_token` fijado al registrar el webhook (`TELEGRAM_WEBHOOK_SECRET`), si no se descarta antes de tocar la base de datos. Registro del webhook (una vez, tras desplegar y con las variables ya puestas en Vercel):
  ```
  curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://hall-of-bets.vercel.app/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
  ```
  No se puede probar en local con `vercel dev` (Telegram necesita una URL pública para mandar los mensajes) — probar contra el despliegue real, con una apuesta de prueba antes de confiarle datos reales.

## Identidad visual (no cambiar sin pedirlo explícitamente)

- Colores: `felt` #0F3D2E (verde fieltro, cabecera), `paper` #F7F4EA (fondo), `gold` #B8934D (acento), `win` #1E8E5A (verde ganancias), `lose` #C0392B (rojo pérdidas), `slate` #6B6357 (texto secundario), `line` #D9D2BC (bordes)
- Tipografías: Fraunces (títulos, clase `font-display`), IBM Plex Mono (números, clase `font-mono`), Inter (texto general, por defecto)
- Estética general: "cuaderno/ticket de apuestas" — felt verde, tarjetas blancas con bordes suaves, esquinas redondeadas moderadas

## Funcionalidades objetivo (ver guion completo para detalle)

- Registro de apuestas: fecha, casa, deporte (lista cerrada: Fútbol/Baloncesto/Tenis/eSports/Otro), evento (texto libre, sin desplegable de mercados), stake, cuota, resultado
- Estado inicial de toda apuesta nueva: **Pendiente**
- Resultados posibles: Ganada / Perdida / Nula / **Cash Out** (cierre anticipado pagado por la casa; pide el importe recibido, no se calcula con la cuota). Disponible en Apuestas y en Entretenimiento por igual
- Combinadas: apuesta con varias selecciones ("añadir nueva cuota"); la cuota total es el producto de las cuotas de cada selección
- Tipo de fondos por apuesta: dinero real / crédito bono (freebet)
  - Si gana: ganancia real = `stake × (cuota − 1)` en ambos casos
  - Si pierde con freebet: 0€ reales perdidos
  - El stake en freebet NO cuenta en el stake total ni en el yield — se muestra aparte
  - Filtro de tipo de fondos (Todas / Real / Freebet) dentro de cada sección, no es una sección propia
- Dos bankrolls independientes: **Apuestas** y **Entretenimiento**, cada uno con sus propias estadísticas
- Casas de apuestas gestionables (añadir nuevas), filtro por casa
- Estadísticas: nº apuestas, stake medio, cuota media, stake total, beneficio, yield, % acierto
- Estadísticas y gráfico por periodo: hoy / semana / mes / año
- Gráfico de beneficio acumulado
- Racha actual de apuestas ganadas
- Sala de trofeos: logros desbloqueables sin efecto en el bankroll (ej. cuota ≥ 1,8 acertada, 5 victorias seguidas), con niveles bronce/plata/oro/platino y notificación al desbloquear uno nuevo
- Bot de fotos: sube captura → IA rellena el formulario → el usuario confirma antes de guardar (requiere backend con API key propia, nunca expuesta en el frontend) — **omitida por coste recurrente de la IA, ver fases**
- Borrado individual y borrado total (con confirmación) por sección
- Persistencia real de datos (no debe perderse al recargar)

## Fases de construcción (orden — no saltar fases sin que se pida)

1. Setup del proyecto — ✅ hecho
2. CRUD básico de apuestas (una lista, sin categorías, estado Pendiente por defecto) — ✅ hecho
3. Selecciones y combinadas — ✅ hecho
4. Categorías (Apuestas / Entretenimiento) como bankrolls independientes — ✅ hecho
5. Casas de apuestas y filtros (incluyendo filtro de tipo de fondos) — ✅ hecho
6. Estadísticas y gráfica de beneficio acumulado — ✅ hecho
7. Estadísticas por periodo + racha de victorias — ✅ hecho
8. Promociones — ✅ hecho, luego eliminada por completo (ver `CHANGELOG.md`)
9. Borrado individual y total con confirmación — ✅ hecho
10. Sala de trofeos — ✅ hecho
11. Bot de fotos (backend propio) — ❌ omitida por coste recurrente de la API de IA; no retomar salvo que se pida explícitamente
12. Despliegue — ✅ hecho (GitHub + Vercel)

## Backlog pendiente (orden — no saltar sin que se pida)

1. Listado de registro de casas — ✅ hecho
2. Informe mensual — ✅ hecho (sustituido por el Informe profesional de la fase 19)
3. Desglose por casa de apuestas — ✅ hecho
4. Modo oscuro/claro — ✅ hecho (segundo intento; el primero se descartó por
   los inputs con gris nativo del navegador, arreglado esta vez fijando su
   fondo/color explícitamente en `src/index.css`)
5. Grupo "Competición Internacional" en el buscador de partidos (UEFA
   Nations League, Eurocopa —fase de clasificación y torneo—, Mundial
   —fase de clasificación Europa y torneo—) — ❌ pendiente, sin
   implementar. Antes de retomarlo, valorar cobertura de cada una en el
   plan gratuito de API-Football (mismo paso de verificación por curl que
   ya se hizo con el resto de ligas conectadas).

## Historial de decisiones

El porqué de cada cambio (peticiones directas fuera del guion, bugs
encontrados y su causa, cosas probadas y descartadas) vive en
`CHANGELOG.md`, no aquí — para que este archivo se pueda leer entero al
empezar cada sesión sin cargar de más. Consultar `CHANGELOG.md` cuando
haga falta el contexto de una decisión concreta.

## Convenciones de código

- Componentes funcionales con hooks, sin clases
- Un componente por responsabilidad clara; evita archivos gigantes
- Comentarios breves en español donde la lógica no sea obvia (freebets, combinadas, cálculo de yield)
- No añadir dependencias nuevas sin comentarlo primero
