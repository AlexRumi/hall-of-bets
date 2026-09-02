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
- Despliegue: GitHub (`AlexRumi/hall-of-bets`, rama `main`) + Vercel (`hall-of-bets.vercel.app`), auto-deploy en cada push a `main`. Vercel necesita las variables de entorno `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `API_FOOTBALL_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > Environment Variables) — ver comentarios de cada una en `.env.example`; en local van en `.env.local` (no se sube a git)
- Limitador propio de llamadas a API-Football (`api/_lib/limitadorApiFootball.js`): nunca deja salir más de 8 peticiones/minuto hacia la API real desde ninguna de las 4 funciones que la llaman (`api/partidos.js`, `api/jugadores.js`, `api/partido.js`, `api/cuotas.js`), respaldado por una fila en Supabase (`limitador_api_football`) con `SELECT ... FOR UPDATE` para que sea atómico entre invocaciones serverless distintas — un contador en memoria de JS no serviría, cada invocación de Vercel puede correr en una instancia distinta. Motivo: la cuenta de API-Football se suspendió el 2026-09-02 tras una ráfaga de peticiones duplicadas (bug real, ver más abajo); esto es la red de seguridad para que no pueda repetirse por ningún otro motivo futuro.
- Caché permanente de plantillas de equipo (`api/jugadores.js`, tabla `plantillas_equipos`): la primera vez que se pide la plantilla de un equipo se guarda en Supabase durante 30 días — ni tú, ni tu amigo, ni un dispositivo nuevo, vuelven a gastar una llamada real por ese equipo hasta que caduque. Antes solo se cacheaba en memoria del navegador (por pestaña), así que cada dispositivo/sesión nueva la pedía de cero. 30 días (no permanente del todo) porque un equipo puede fichar/vender jugadores en el mercado de invierno/verano.
- Bot de Telegram (avisos automáticos, Mini App para resolver apuestas desde el móvil): se implementó y luego se **eliminó por completo** (2026-09-02, petición directa — no aportaba mucho más que estar pendiente del móvil, que el usuario ya hace solo). Si se retoma en el futuro, el diseño (webhook, Mini App con `initData` HMAC, avisos vía Database Webhooks de Supabase, limpieza diaria, numeración de apuestas) está documentado en el historial de git de este archivo.
- Panel lateral reutilizable (`src/components/PanelLateral.jsx`, solo escritorio): backdrop + panel deslizante desde la derecha, mecanismo común a "+ Añadir apuesta" (cabecera), al detalle de una apuesta en listados densos (`ListaApuestas.jsx`), a "Casas de apuestas"/"Academia" (detalle de una fila) y al panel "Estadísticas" de abajo. Cualquier `position: fixed` que viva dentro (dropdowns, modales) necesita `createPortal` a `document.body`, porque el `transform` de la animación del panel convierte a su contenedor en el "contenedor" de esos hijos fijos y los desposiciona (ver comentarios en `SelectorDesplegable.jsx`/`BotonInfoConcepto.jsx`).
- Panel "Estadísticas" (`src/components/PanelEstadisticas.jsx`, experimento estilo la app de referencia "Bet Analytix"): botón propio en la cabecera de escritorio (junto a "+ Añadir apuesta"), abre en un `PanelLateral` una tarjeta densa (pastillas Todas/Apuestas/Entretenimiento, desplegable de casa, cifras en 2 columnas) con un botón "Más estadísticas" que despliega los mismos gráficos que la página de Estadísticas completa. No sustituye esa página ni su lógica — reutiliza sus mismas funciones de cálculo, es solo un acceso más rápido.
- Ajuste del saldo de freebet de una casa (seguro de apuesta perdida, reembolso al anular una freebet/mixta): se calcula por DIFERENCIA, no sumando una cantidad fija en cada cambio de resultado. `efectoFreebetPorResultado(apuesta, resultado)` (en `src/App.jsx`) devuelve cuánto freebet "extra" corresponde a la apuesta si tuviera ese resultado; al cambiarlo se aplica `efecto(nuevo) − efecto(anterior)`. Bug real: antes se sumaba una cantidad fija cada vez que el resultado pasaba a "Perdida"/"Nula" — como la pastilla de partido cicla Pendiente→Ganada→Perdida→Nula, corregir un resultado (o simplemente probar varios estados) podía sumar el seguro o la devolución de freebet más de una vez. Con la diferencia, el saldo siempre acaba correcto sin importar cuántas veces se haya ciclado por el medio.
- Bankroll de una casa (`calcularBankrollPorCasa` en `src/utils/movimientos.js`, usado por Inicio/Casas de apuestas/Estadísticas/el formulario de nueva apuesta): `ingresos − retiradas + beneficio de apuestas ya resueltas − dinero real ya comprometido en apuestas todavía pendientes de esa casa` (petición directa: antes no restaba lo pendiente, así que el dinero ya jugado seguía contando como disponible hasta resolver la apuesta). Freebet puro no resta nada (esa parte nunca fue dinero real, ya se descontó del saldo de freebet al crear la apuesta); en mixta solo se resta la parte real (`stake`). El resultado se redondea a céntimos con `redondearCentimos` (mismo archivo) — encadenar sumas/restas de decimales en JS puede dejar un resto minúsculo que se veía como "-0.00€" y hacía saltar el aviso de "supera el bankroll" con un importe que en realidad cabía justo.

## Identidad visual (no cambiar sin pedirlo explícitamente)

- Colores: `felt` #0F3D2E (verde fieltro, cabecera), `paper` #F7F4EA (fondo), `gold` #B8934D (acento), `win` #1E8E5A (verde ganancias), `lose` #C0392B (rojo pérdidas), `slate` #6B6357 (texto secundario), `line` #D9D2BC (bordes)
- Tipografías: Fraunces (títulos, clase `font-display`), IBM Plex Mono (números, clase `font-mono`), Inter (texto general, por defecto)
- Estética general: "cuaderno/ticket de apuestas" — felt verde, tarjetas blancas con bordes suaves, esquinas redondeadas moderadas

## Funcionalidades objetivo (ver guion completo para detalle)

- Registro de apuestas: fecha, casa, título opcional (texto libre, ej. "Winiela" — identifica apuestas de una promoción concreta de la casa; se muestra en el ticket, no afecta a ningún cálculo), deporte (lista cerrada: Fútbol/Baloncesto/Tenis/eSports/Otro), evento (texto libre, sin desplegable de mercados), stake, cuota, resultado
- Estado inicial de toda apuesta nueva: **Pendiente**
- Resultados posibles: Ganada / Perdida / Nula / **Cash Out** (cierre anticipado pagado por la casa; pide el importe recibido, no se calcula con la cuota). Disponible en Apuestas y en Entretenimiento por igual
- Combinadas: apuesta con varias selecciones ("añadir nueva cuota"); la cuota total es el producto de las cuotas de cada selección
- Tipo de fondos por apuesta: dinero real / crédito bono (freebet) / **mixta** (parte real + parte freebet en la misma apuesta — p.ej. la casa exige completar un freebet con algo de dinero propio)
  - Si gana: ganancia real = `stake × (cuota − 1)` (en mixta, `stake` + la parte freebet juntas)
  - Si pierde: en freebet, 0€ reales perdidos; en mixta, solo se pierde la parte real (la freebet, si la había, no se pierde "de verdad")
  - El stake en freebet NO cuenta en el stake total ni en el yield — se muestra aparte (en mixta, solo la parte freebet)
  - Filtro de tipo de fondos (Todas / Real / Freebet) dentro de cada sección, no es una sección propia
- Dos bankrolls independientes: **Apuestas** y **Entretenimiento**, cada uno con sus propias estadísticas
- Casas de apuestas gestionables (añadir nuevas, editar logo/nombre sin perder movimientos ni saldo de freebet), filtro por casa
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
6. Rediseño de escritorio ancho (petición directa, comparando con otra
   app de referencia) — ✅ hecho, pantalla a pantalla, con confirmación
   entre cada una. Contenedor `max-w-6xl` (antes `max-w-3xl` centrado) en
   Inicio/Historial/Estadísticas/Casas de apuestas/Informe/Trofeos/
   Academia/Ajustes. Dos tratamientos según el tipo de contenido:
   - **Listas** (Inicio, Historial, Casas de apuestas, Academia): fila
     densa tipo tabla + panel lateral de detalle al tocarla, en vez de
     modal centrado o acordeón que empuja el resto hacia abajo.
     `TarjetaApuestaResumen.jsx`/`ListaApuestas.jsx` ganaron una prop
     `denso` reutilizable; `DetalleCasa.jsx`/`DetalleConcepto.jsx` se
     extrajeron del acordeón de Casas de apuestas/Academia para
     reutilizarse igual en el acordeón de móvil (sin cambios) y en el
     panel de escritorio (mismo criterio que `ApuestaItem.jsx`).
   - **Documentos de una sola pieza** (Informe, Ajustes): sin panel
     lateral — solo se reorganiza el contenido interno en 2 columnas
     donde había pares naturales (KPIs+Conclusiones en Informe, las dos
     tarjetas de Ajustes), para que los párrafos largos no se lean en
     líneas kilométricas a todo el ancho. Trofeos: solo se agrupan las
     filas de 2 en 2 (`lg:grid-cols-2`), sin tocar la fila en sí.
   - **Navegación de escritorio reestructurada**: "Apuestas"/
     "Entretenimiento" y "Estadísticas" se OCULTARON del menú lateral
     (`SidebarNavegacion.jsx` → `ITEMS`) — no se borró nada, sus rutas
     siguen intactas en `App.jsx`. En su lugar: un botón dorado "+
     Añadir apuesta" en la cabecera (abre directamente Nueva apuesta v3,
     ver más abajo), una sección nueva **Historial** (pastillas
     Todas/Apuestas/Entretenimiento + el listado denso de siempre) y un
     botón "Estadísticas" en la cabecera que abre el panel
     `PanelEstadisticas.jsx` (ver Stack). El móvil no se ha tocado en
     todo este punto — sigue con su propia navegación de siempre
     (`BarraInferiorMovil.jsx`/`MenuSecundario.jsx`).

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
