# Hall of Bets

Registro personal de apuestas deportivas (uso individual, no multiusuario). El dueño del proyecto tiene nivel de programación básico — explica los cambios de forma clara y evita dar por hecho conocimientos avanzados.

## Stack

- Frontend: React + Vite, JavaScript (no TypeScript por ahora)
- Estilos: Tailwind CSS (paleta y fuentes ya configuradas en `tailwind.config.js` / `src/index.css`)
- Backend: Supabase (plan gratuito) — solo como base de datos + autenticación, no hay servidor propio. La fase 11 (bot de fotos) seguiría sin backend propio (API key de IA), se omitió por el coste recurrente
- Base de datos: Supabase (Postgres), con Row Level Security atada al usuario. Antes vivía en localStorage del navegador (decidido en fase 2); se migró para poder ver las mismas apuestas desde PC y móvil. Un solo usuario, creado a mano en el panel de Supabase (Authentication > Users), sin registro público. `trofeos-vistos` (qué notificaciones de trofeo ya se han visto) se queda en localStorage de cada dispositivo, no se sincroniza
- Autenticación: Supabase Auth (email + contraseña), sesión persistida por dispositivo; pantalla de login propia en `src/components/PantallaLogin.jsx`
- Gráficas: recharts
- Iconos: lucide-react
- Despliegue: GitHub (`AlexRumi/hall-of-bets`, rama `main`) + Vercel (`hall-of-bets.vercel.app`), auto-deploy en cada push a `main`. Vercel necesita las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (Project Settings > Environment Variables) para conectar con Supabase; en local van en `.env.local` (no se sube a git, ver `.env.example`)

## Identidad visual (no cambiar sin pedirlo explícitamente)

- Colores: `felt` #0F3D2E (verde fieltro, cabecera), `paper` #F7F4EA (fondo), `gold` #B8934D (acento), `win` #1E8E5A (verde ganancias), `lose` #C0392B (rojo pérdidas), `slate` #6B6357 (texto secundario), `line` #D9D2BC (bordes)
- Tipografías: Fraunces (títulos, clase `font-display`), IBM Plex Mono (números, clase `font-mono`), Inter (texto general, por defecto)
- Estética general: "cuaderno/ticket de apuestas" — felt verde, tarjetas blancas con bordes suaves, esquinas redondeadas moderadas

## Funcionalidades objetivo (ver guion completo para detalle)

- Registro de apuestas: fecha, casa, evento (texto libre, sin desplegable de mercados), stake, cuota, resultado
- Estado inicial de toda apuesta nueva: **Pendiente**
- Combinadas: apuesta con varias selecciones ("añadir nueva cuota"); la cuota total es el producto de las cuotas de cada selección
- Tipo de fondos por apuesta: dinero real / crédito bono (freebet)
  - Si gana: ganancia real = `stake × (cuota − 1)` en ambos casos
  - Si pierde con freebet: 0€ reales perdidos
  - El stake en freebet NO cuenta en el stake total ni en el yield — se muestra aparte
  - Filtro de tipo de fondos (Todas / Real / Freebet) dentro de cada sección, no es una sección propia
- Dos bankrolls independientes: **Apuestas** y **Entretenimiento**, cada uno con sus propias estadísticas
- Sección **Promociones** aparte (no cuenta en el yield general): tipo, valor, estado, beneficio neto
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
8. Promociones — ✅ hecho
9. Borrado individual y total con confirmación — ✅ hecho
10. Sala de trofeos — ✅ hecho
11. Bot de fotos (backend propio) — ❌ omitida por coste recurrente de la API de IA; no retomar salvo que se pida explícitamente
12. Despliegue — ✅ hecho (GitHub + Vercel)

## Backlog pendiente (orden — no saltar sin que se pida)

1. Listado de registro de casas — ✅ hecho
2. Informe mensual — ✅ hecho
3. Desglose por casa de apuestas — ✅ hecho
4. Modo oscuro/claro — ✅ hecho (segundo intento; el primero se descartó por
   los inputs con gris nativo del navegador, arreglado esta vez fijando su
   fondo/color explícitamente en `src/index.css`)

## Fases futuras (18-22)

Ver `hall-of-bets-guion.md` (sección 8) para el detalle de las fases 18-22
(dashboard de Estadísticas, Informe profesional, Academia con contenido,
gamificación de Trofeos, arquitectura futura). Se abordan una a una, sin
saltar, cada una probada antes de pasar a la siguiente. La fase 17
(reorganización de navegación: Inicio, Ajustes, Academia, fusión de
Ingresos dentro de Casas de apuestas) ya está hecha.

## Convenciones de código

- Componentes funcionales con hooks, sin clases
- Un componente por responsabilidad clara; evita archivos gigantes
- Comentarios breves en español donde la lógica no sea obvia (freebets, combinadas, cálculo de yield)
- No añadir dependencias nuevas sin comentarlo primero
