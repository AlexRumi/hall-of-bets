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
- Despliegue: GitHub (`AlexRumi/hall-of-bets`, rama `main`) + Vercel (`hall-of-bets.vercel.app`), auto-deploy en cada push a `main`. Vercel necesita las variables de entorno `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `API_FOOTBALL_KEY` (Project Settings > Environment Variables) — las dos primeras para conectar con Supabase, la tercera la usa solo `api/partidos.js` (nunca lleva el prefijo `VITE_`, para que no acabe en el bundle del navegador); en local van en `.env.local` (no se sube a git, ver `.env.example`)

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
8. Promociones — ✅ hecho, luego eliminada por completo (ver "Fases futuras" más abajo)
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

## Fases futuras (22)

Ver `hall-of-bets-guion.md` (sección 8) para el detalle de la fase 22
(arquitectura futura). Se abordan una a una, sin saltar, cada una probada
antes de pasar a la siguiente.

- Fase 17 (reorganización de navegación: Inicio, Ajustes, Academia, fusión
  de Ingresos dentro de Casas de apuestas) — ✅ hecho.
- Fase 18 (dashboard de Estadísticas) — ✅ hecho. Añade el campo **deporte**
  a cada apuesta (Fútbol/Baloncesto/Tenis/eSports/Otro, por defecto Fútbol;
  las apuestas de antes de este campo cuentan como "Otro"). El dashboard
  vive en `src/components/EstadisticasDashboard.jsx`, con los cálculos
  nuevos en `src/utils/estadisticas.js` (aparte de `utils/apuestas.js` para
  no seguir engordándolo). Los gráficos usan `src/utils/coloresGrafico.js`
  porque recharts necesita colores reales (hex), no puede leer las
  variables CSS del modo oscuro — si se añade una gráfica nueva, hay que
  usar esos colores para que también funcione en oscuro.
- Fase 19 (Informe profesional) — ✅ hecho. `InformeMensual.jsx` (lista
  plana de meses) se sustituyó por `InformeProfesional.jsx`: un periodo a
  la vez (semana/mes/año, navegable con flechas — no se puede ir al
  futuro), comparado automáticamente con el periodo anterior, con
  conclusiones en texto generadas por plantilla (no IA). Pensado como un
  único bloque estático para poder añadir exportar a PDF más adelante sin
  reestructurar; el export en sí no está implementado.
- **Promociones, eliminada por completo** (no era una fase del guion, fue
  petición directa). Ya no existe como sección independiente: una promoción
  se registra ahora como una apuesta normal (opcionalmente con "Promoción"
  en el texto del evento). Se borraron `PromocionesSection.jsx`,
  `FormularioPromocion.jsx`, `PromocionItem.jsx`, `ListaPromociones.jsx` y
  `usePromociones.js`, el trofeo "Cazapromos", y toda referencia en
  `utils/trofeos.js`, `utils/copiaSeguridad.js` y la navegación. La tabla
  `promociones` de Supabase NO se ha borrado (por si hubiera datos
  históricos), simplemente ya no se usa desde la app.
- **Navegación responsive** (no era una fase del guion, petición directa
  tras varias vueltas de diseño): en escritorio (`md:` de Tailwind, ≥768px),
  `src/components/SidebarNavegacion.jsx` es una barra lateral fija a la
  izquierda con las 9 secciones; en móvil, `src/components/
  BarraInferiorMovil.jsx` es una barra fija abajo con 5 accesos (Apuestas
  despliega Apuestas/Entretenimiento al tocarlo; Informe/Casas/Ajustes solo
  están en el menú ☰). El nombre "Hall of Bets" vive en la cabecera (verde
  felt, igual en las dos versiones), no en la barra lateral, para no
  repetirlo. En escritorio el ☰ ya no lista secciones (eso ya está en la
  barra lateral): solo modo oscuro/claro y cerrar sesión, que en escritorio
  además se ven como iconos sueltos en la cabecera sin necesidad de abrir
  el ☰. La barra lateral se estira exactamente a la altura de la fila
  sidebar+contenido (`md:flex-1` en esa fila) — usar una altura fija ahí
  metía scroll de más.
- Fase 20 (Academia) — ✅ hecho. 12 conceptos (Stake, ROI, Yield, Bankroll,
  Cuota, Win Rate, EV, Probabilidad implícita, Cash Out, Void, Apuesta
  simple, Apuesta combinada) en `src/utils/academia.js` (datos puros),
  mostrados en `Academia.jsx` como acordeón con buscador. Botón ℹ️
  (`BotonInfoConcepto.jsx`) junto a las métricas que tienen concepto
  asociado en `KpisEstadisticas.jsx`, `EstadisticasApuestas.jsx` e
  `InformeProfesional.jsx` — no en `ListadoCasas.jsx`, para no repetir
  cableado por poco beneficio. Al pulsar un ℹ️ se abre un recuadro con la
  explicación del concepto ahí mismo (`BotonInfoConcepto.jsx` busca el
  concepto en `CONCEPTOS` y lo muestra en un modal propio) — al principio
  navegaba a Academia y había que volver, se cambió a este recuadro in-situ
  por feedback directo. Las fórmulas de ROI y Yield en el contenido están
  escritas para coincidir exactamente con cómo las calcula la app — si se
  cambia una fórmula en `utils/apuestas.js` o `utils/movimientos.js`, hay
  que actualizar el texto correspondiente en `utils/academia.js`.
- **Pulido de navegación y gráficas** (no era una fase del guion, varias
  rondas de ajustes directos tras la fase 20): cabecera y menú lateral de
  escritorio fijos al hacer scroll (`sticky`); menú ☰ móvil con el mismo
  orden que el lateral, borde dorado y fondo difuminado para destacar en
  oscuro; tooltips de las 4 gráficas de barras/líneas con borde dorado
  (`border-gold/40`, no `border-line` — en oscuro el tooltip y la tarjeta
  comparten `bg-surface` y con `border-line` no se distinguían), tamaño
  responsive (más pequeño en móvil, `sm:` para el tamaño normal) y versión
  más compacta si hay más de 4 barras (`GraficoBarraDivergente.jsx`, para
  cuando hay muchas casas de apuestas). Al cambiar de sección
  (`seccionActiva` en `App.jsx`) la página vuelve arriba del todo
  (`window.scrollTo(0, 0)` en un `useEffect`), porque si no se quedaba con
  el scroll de la sección anterior.
- **Bankroll disponible al apostar** (no era una fase del guion, petición
  directa): `FormularioApuesta.jsx` calcula con `calcularBankrollPorCasa`
  el bankroll de la casa elegida y lo muestra debajo del selector; si está
  a 0 o el importe lo supera, avisa en rojo. Es solo un aviso, no bloquea
  el envío — decisión consciente porque el cálculo no descuenta el stake
  de apuestas todavía pendientes en esa casa, así que a veces no sería
  exacto. `movimientos` y `apuestas` (la lista completa, sin filtrar) se
  pasan ahora también a `ListaApuestas.jsx` → `ApuestaItem.jsx`, para que
  el mismo aviso funcione también al editar una apuesta ya existente.
- Fase 21 (Gamificación de Trofeos) — ✅ hecho. `utils/trofeos.js`: cada
  trofeo tiene `categoria` (Volumen/Rachas/Cuotas/Combinadas/Especiales) y,
  si aplica, una función `progreso(ctx)` que devuelve `{ pct, texto }`
  (p.ej. "42 / 100 apuestas"); los trofeos ocultos no calculan progreso
  hasta desbloquearse, para no delatar el objetivo. `SalaTrofeos.jsx`:
  cabecera con % completado y barra, resumen de conseguidos por nivel
  (bronce/plata/oro/platino), trofeos agrupados por categoría, y barra de
  progreso en cada trofeo pendiente que tenga uno. La forma de cada trofeo
  (id, categoria, tier, comprobar, progreso opcional) está pensada para que
  un futuro "objetivo personal" del usuario encaje igual sin tocar
  `SalaTrofeos.jsx` — no implementado, queda para la fase 22.
- **Filtro por casa en Estadísticas y rediseño de la barra móvil** (no era
  una fase del guion, petición directa tras la fase 21):
  `EstadisticasDashboard.jsx` gana pastillas de acceso rápido ("Estadísticas
  Totales" + una por cada casa) que recalculan todo el dashboard (KPIs,
  gráficas, calendario, insights) para esa casa sola — "ROI por casa" se
  oculta cuando hay una casa filtrada, porque ya no aporta nada. En la barra
  inferior móvil, el botón "Inicio" pasa a ser un círculo grande que
  sobresale por encima de la barra (con un aro `ring-fondo` para que parezca
  flotar). La pestaña "Apuestas" se renombra a "Registro" y quita el
  desplegable Apuestas/Entretenimiento: ahora lleva directo al formulario
  (o te deja donde estabas si ya estabas en uno de los dos bankrolls), y el
  selector Apuestas/Entretenimiento vive arriba de esa pantalla, solo en
  móvil (`md:hidden` en `App.jsx` — en escritorio ya está en el menú
  lateral). Se renombró para evitar el choque de "Registro > Apuestas" en
  vez de "Apuestas > Apuestas".
- **Cash Out** (no era una fase del guion, petición directa): nuevo
  resultado `"cashout"` además de Ganada/Perdida/Nula, disponible en Apuestas
  y en Entretenimiento por igual (se descartó restringirlo a una sola
  sección, no aportaba nada). Al pulsarlo pide el importe pagado por la casa
  (`CashOutDialog.jsx`, no se puede calcular con la cuota) y lo guarda en la
  columna nueva `cashout_importe` de Supabase (`supabase-setup.sql`).
  Beneficio en `calcularBeneficio` (`utils/apuestas.js`): con dinero real es
  `importe recibido − stake`; con freebet, el importe recibido es ganancia
  entera (el stake nunca fue dinero propio). No cuenta como "ganada" ni
  "perdida" en el % de acierto (igual que "Nula"), pero si corta una racha
  de victorias en curso, y sí suma al beneficio/yield. Color propio
  `cashout` (azul acero) en `tailwind.config.js`/`index.css`/
  `coloresGrafico.js`, para no reutilizar ninguno de los 4 colores de
  resultado que ya existían.
- **Evento y apuesta más visibles en `ApuestaItem.jsx`** (no era una fase
  del guion, petición directa): el evento (partido) pasa a `text-base
  font-semibold`, más grande que antes. La apuesta concreta ("Gana X",
  "Over 2.5 goals") va en una pastilla con fondo/color según el resultado
  — reutiliza `ESTILOS_RESULTADO` (el mismo mapa que ya pinta la etiqueta
  Pendiente/Ganada/Perdida/Nula/Cash Out): dorado si está pendiente, verde
  si ganada, roja si perdida, gris si nula, azul si cash out. En
  combinadas, como la app no guarda resultado por selección, las tres
  cuotas comparten el color del resultado final de la apuesta completa.
  Ronda posterior de ajuste fino: el nombre de la casa pasa a pastilla
  redondeada igual que Fútbol/Ganada/etc. (antes texto suelto en `text-sm`),
  con un color propio por casa — `utils/colorCasa.js` +
  `hooks/useColorCasa.js` sacan el tono medio del logo si tiene (con caché
  por nombre, para no recalcularlo en cada apuesta), o si no lo tiene un
  color fijo a partir de un hash del nombre. Funciona bien en escritorio;
  en algún caso concreto en móvil (p.ej. el logo de Betfair) el tono sale
  distinto al esperado — pendiente de investigar la causa real en móvil
  antes de tocar el algoritmo otra vez (un primer intento de "arreglo",
  ponderar por saturación en vez de promediar RGB, se descartó porque en
  escritorio sí funcionaba bien tal como estaba). La fila de Apostado/Cuota
  total/Beneficio sube de `text-xs` a 13px (`text-[13px]`).
- **Iconos de la app renovados, splash propio descartado** (no era una fase
  del guion, varias vueltas de petición directa): `icon-192.png`,
  `icon-512.png`, `icon-1024.png` (nuevo, en `manifest.json`) y
  `apple-touch-icon.png` son el badge con aro dorado, ticket y texto "Hall
  of Bets", sobre fondo verde cuadrado liso (`#0A2A20`, igual que
  `background_color` en `manifest.json`) en vez de transparente, para que
  se vea bien en cualquier contexto. Primero se probó un `SplashScreen.jsx`
  propio (pantalla de carga a pantalla completa en React, solo en móvil),
  pero al usar el mismo diseño en el icono ya no aportaba nada — la
  pantalla de arranque que genera el propio sistema para la PWA instalada
  (a partir del icono + `background_color` del manifest) hace ese trabajo
  sola, y tener las dos añadía una transición de más. Se quitó
  `SplashScreen.jsx`, `splash-badge.png` (quedó redundante con
  `icon-1024.png`) y el `cargando` que se había añadido a `useApuestas`/
  `useCasas`/`useMovimientos` solo para esto. Como la app seguía entrando
  de golpe (sin pantalla de carga que disimulara), se añadió un fundido de
  opacidad de 1,5s al arrancar (`@keyframes app-entrada` en `index.css`,
  aplicado al `<div>` raíz en `App.jsx`) — sin volver a montar una pantalla
  propia, solo suaviza la propia aparición de la app.
- **Buscador de partidos (API-Football)** (no era una fase del guion,
  petición directa — el guion la daba por descartada, ver fase 22 y
  sección 3): al elegir un país en "Evento" (`BuscadorEvento.jsx`),
  sugiere partidos reales de 22 competiciones conectadas — España,
  Reino Unido, Alemania, Italia y Francia (primera, segunda y copa de
  cada una, agrupadas en el desplegable bajo "Grandes ligas"), Portugal/
  Holanda/Bélgica (agrupadas bajo "Europa"), y "Competición Europea"
  (Champions/Europa League/Conference); el resto de ligas del mundo se
  sigue escribiendo a mano como siempre eligiendo "Otras ligas" (o sin
  elegir país todavía). Si el país tiene más de una competición (p.ej.
  "Competición Europea"), hay que elegir también cuál antes de ver ningún
  partido — si no, listas como la de Conference League (~27 partidos en
  un día de jornada europea) saldrían mezcladas con las otras dos. Al
  elegir un partido se rellenan solos evento, país, competición y la
  fecha de la apuesta.
  - **Arquitectura**: la key de API-Football es secreta (a diferencia de
    la de Supabase) y no puede llamarse desde el navegador, así que hizo
    falta la primera pieza de servidor propio del proyecto: `api/
    partidos.js`, una Serverless Function de Vercel (gratis en su plan
    free) que guarda la key en la variable de entorno `API_FOOTBALL_KEY`
    y hace de intermediaria. El listado de las 21 ligas (con su id
    numérico de API-Football) vive en ese mismo archivo — los ids se
    verificaron a mano contra la cuenta del usuario (`GET /leagues` con
    su key), no adivinados, porque un id equivocado falla en silencio
    (esa liga nunca encontraría partidos).
  - **Cuota gratuita**: el plan free de API-Football da ~100 peticiones/
    día. Para no gastarla de más, `api/partidos.js` pide `/fixtures?date=X`
    una vez por día (trae todas las ligas del mundo de golpe, se filtra a
    las 21 después) en vez de una llamada por liga, y el hook
    `usePartidos.js` cachea el resultado en el navegador por fecha durante
    toda la visita — buscar varias veces, en varias apuestas o
    selecciones, el mismo día, no vuelve a llamar a la función. En la
    práctica es ~1 request por día distinto que se consulte, no por
    apuesta.
  - **País/competición**: se guardan dentro de cada selección (el array
    `selecciones` ya es una columna `jsonb` en Supabase, así que añadir
    estos dos campos no hizo falta ninguna migración — a diferencia de
    "deporte", que si necesitó una columna nueva). Las apuestas de antes
    de esta fase simplemente no los tienen (`null`), y no se muestran.
  - **Probar en local**: `api/partidos.js` no funciona con `npm run dev`
    normal (ese comando es solo Vite, no sabe nada de Serverless
    Functions) — hace falta `vercel dev` en su lugar para probar el
    buscador en concreto (primera vez: pide iniciar sesión en Vercel y
    enlaza el proyecto solo). El resto de la app sigue funcionando igual
    con `npm run dev`; si `/api/partidos` no responde (404, sin
    conexión...), el buscador simplemente no sugiere nada y se puede
    seguir escribiendo el evento a mano, nunca bloquea el formulario.
  - **Ojo con "Sensitive" en Vercel**: si una variable de entorno se marca
    como "Sensitive" al crearla, Vercel no la deja usar en el entorno
    Development — y esa marca no se puede quitar después (hay que borrar
    la variable y crearla de nuevo sin marcarla). `vercel dev` tampoco
    lee `.env.local` directamente para las Serverless Functions de un
    proyecto ya enlazado: usa las variables que el propio proyecto tenga
    en Vercel para el entorno Development, así que sin "Sensitive"
    quitado no llegan de ninguna manera. `API_FOOTBALL_KEY` se creó así
    por error la primera vez (tardó en detectarse porque API-Football
    responde 200 con un error dentro del JSON en vez de un código HTTP de
    error cuando falta la key, así que parecía "sin partidos" y no "sin
    key").
  - **Comparador de cuotas — oculto por ahora** (petición directa, misma
    sesión): se montó un botón "Ver cuotas" junto a un partido ya elegido
    (`CuotasDialog.jsx`, con las cuotas de Gana local/Empate/Gana
    visitante de Bet365, Betfair, William Hill, Bwin y Betway — Codere,
    Winamax y Luckia se pidieron primero pero no existen en el catálogo de
    API-Football, `GET /odds/bookmakers`) y una Serverless Function
    `api/cuotas.js` (`GET /odds?fixture=ID`, una llamada por partido, solo
    al pulsar el botón). Se comentó (no se borró) en `FormularioApuesta.jsx`
    tras probarlo: al registrar una apuesta la casa ya está decidida (la
    apuesta ya está hecha), así que comparar cuotas de otras casas ahí no
    aporta — podría tener sentido en un futuro "modo planificación" antes
    de apostar. `partidoId` se sigue guardando en cada selección (por si se
    retoma), y los archivos (`CuotasDialog.jsx`, `useCuotas.js`,
    `api/cuotas.js`) siguen intactos, solo sin usar.
  - **Ronda de ajuste tras probarlo con datos reales**: el buscador
    limitaba las sugerencias a 8 resultados (`slice(0, 8)`), pensado para
    cuando aún se podía buscar sin país; con país+competición ya
    obligatorios eso escondía partidos de verdad (una jornada de
    Conference League tiene ~27) — se quitó el límite, el cuadro ya tiene
    scroll. El desplegable de País pasó de "Otro" como valor por
    defecto a placeholder real ("Seleccionar un país"), con "Otras ligas"
    como opción explícita al final (mismo comportamiento manual, pero ya
    no es la opción inicial). Bélgica (Jupiler Pro League, id 144,
    verificado igual que el resto) se añadió al grupo "Europa" del
    desplegable junto a Portugal y Holanda.
  - **Límite de fechas del plan gratuito**: comprobado a mano el
    2026-08-07 llamando a API-Football directamente (no a través de
    `api/partidos.js`) — el plan gratuito solo deja consultar un rango
    corto alrededor de hoy (la propia API respondió con
    `errors.plan: "Free plans do not have access to this date, try from
    2026-08-06 to 2026-08-08"` al pedir una fecha de hace meses o de
    dentro de varias semanas). Fuera de ese rango, antes se devolvía
    silenciosamente una lista vacía, indistinguible de "no hay partidos
    ese día" — igual que ya pasó una vez con la key que falta (ver más
    abajo). `api/partidos.js` ahora detecta `datos.errors?.plan` y
    devuelve `{ partidos: [], fueraDeRango: true }`; `usePartidos.js`
    guarda ese objeto completo en caché (no solo la lista) y
    `BuscadorEvento.jsx` avisa con un texto explicando el límite en vez de
    quedarse en blanco. No hay forma de ampliar este rango sin pasar a un
    plan de pago de API-Football — para fechas fuera de rango, el evento
    se sigue pudiendo escribir a mano como siempre.
- **Aviso de pendientes, PDF del Informe y objetivo personal** (no eran
  fases del guion, tres peticiones directas en la misma sesión):
  - `AvisoPendientes.jsx` (nuevo, mostrado en `PantallaInicio.jsx`): avisa
    cuando hay apuestas con `resultado: "pendiente"` cuya `fecha` (la del
    evento) ya pasó — `pendientesAntiguas` en `utils/apuestas.js`. Sin
    umbral de días: si el partido ya se jugó, se puede marcar. Con botones
    para ir directo al bankroll (Apuestas/Entretenimiento) correspondiente.
  - `InformeProfesional.jsx` gana un botón "Exportar a PDF" que llama a
    `window.print()` — sin librería nueva, usando la variante `print:` de
    Tailwind (activada por defecto) para ocultar cabecera, menú lateral,
    barra inferior y los controles interactivos del informe al imprimir, y
    mostrar en su lugar un título propio del PDF con bankroll y periodo.
    Aprovecha que el informe ya se diseñó en la fase 19 como "un único
    bloque estático" pensando en esto.
  - Objetivo personal: uno activo por bankroll (Apuestas y Entretenimiento
    por separado), sin histórico — definir uno nuevo para el mismo
    bankroll sustituye al anterior. Tabla `objetivos` en Supabase con
    `unique(user_id, categoria)` (para que el `upsert` sustituya en vez de
    duplicar); `hooks/useObjetivos.js` sigue el mismo patrón que
    `useCasas.js`. El objetivo no guarda a qué mes/semana/año concreto
    pertenece: `utils/objetivos.js` (`calcularProgresoObjetivo`) siempre lo
    evalúa contra el periodo *actual* de su `periodo`, así que el progreso
    se reinicia solo al cambiar de mes/semana/año. `ObjetivoPersonal.jsx`
    se muestra en Apuestas/Entretenimiento justo después de `RachaActual`,
    con la misma barra de progreso que un trofeo en `SalaTrofeos.jsx`. Se
    dejó como función independiente en vez de forzarlo por el pipeline de
    `evaluarTrofeos`/`SalaTrofeos.jsx` (aunque la forma de un trofeo en
    `utils/trofeos.js` se pensó para eso): un único objetivo por bankroll
    sin niveles ni desbloqueo no lo necesitaba.
- **Rediseño de navegación móvil y listado de apuestas** (no era una fase
  del guion, petición directa inspirada en una captura de la app "Bet
  Analityx" — colores y modo oscuro se quedan igual, solo cambia la
  estructura). `BarraInferiorMovil.jsx` pasa de "Inicio como círculo
  central + pestaña Registro" a 5 accesos tipo Home/Bets/+/Statistics/More:
  Home (Inicio), Bets (listado del bankroll activo), + (círculo central,
  ahora dedicado solo a abrir el formulario de nueva apuesta), Statistics,
  y More (panel con Informe/Casas/Trofeos/Academia/Ajustes). Trofeos y
  Academia pierden su icono directo en la barra móvil por esto — en
  escritorio `SidebarNavegacion.jsx` no cambia, los sigue teniendo todos.
  `MenuSecundario.jsx` pasa de dropdown con botón propio (anclado en la
  cabecera) a panel controlado por `App.jsx` (props `abierto`/`onCerrar`,
  estado `masAbierto`), con pinta de hoja inferior
  (`fixed inset-x-3 bottom-[4.5rem]`) porque ahora lo abre el botón "More"
  de abajo, no un icono en la cabecera — la cabecera móvil se queda solo
  con el título. `App.jsx` separa lo que antes era un único bloque
  (formulario + lista) en dos, con el estado `mostrandoFormulario`: en
  escritorio da igual (los dos se ven siempre, `md:block`), en móvil solo
  se ve uno u otro según se haya entrado por "Bets" o por "+" (con un
  botón "Volver" en el segundo caso).
  El listado en sí (`ListaApuestas.jsx`) agrupa las apuestas por mes
  (colapsable, con el beneficio del mes) y por día dentro de cada mes
  (`utils/agrupado.js`, `agruparPorMesYDia` — aprovecha que las apuestas ya
  llegan ordenadas de más reciente a más antigua, así que un `Map` basta
  para no tener que ordenar nada a mano), con un prop `agrupada` para
  poder desactivar el agrupado en "Últimas apuestas" de
  `PantallaInicio.jsx` (5 apuestas sueltas no lo necesitan). Cada apuesta
  se pinta con la tarjeta nueva y compacta `TarjetaApuestaResumen.jsx`
  (día, evento, un emoji por deporte — no hay iconos de fútbol/baloncesto/
  tenis en `lucide-react` — y el beneficio/resultado; en `sm:`/`md:` añade
  casa/cuota/stake, aprovechando el espacio extra en escritorio). Tocar la
  tarjeta abre el detalle completo en un modal: es `ApuestaItem.jsx` tal
  cual (sin rediseñar, ya tenía todos los badges y las acciones de marcar
  resultado/Cash Out/editar/borrar), con un prop nuevo `onCerrar` opcional
  que le añade una "X" para cerrar el modal.
  Ronda de ajuste tras probarlo: las etiquetas de la barra inferior estaban
  en inglés (herencia directa del ejemplo) — se tradujeron a Inicio/
  Apuestas/Estadísticas/Más. El modal de detalle salía roto en escritorio
  (el evento se partía letra a letra): `sm:flex-row` en `ApuestaItem.jsx`
  se activa por el ancho de la ventana, no por el del contenedor, así que
  con el modal limitado a `max-w-lg` (512px) intentaba el layout "de
  escritorio" (logo + contenido + botones en fila) en un hueco demasiado
  estrecho. Se subió el modal a `max-w-3xl` en `ListaApuestas.jsx` —mismo
  ancho que el contenedor del listado normal, donde ese layout ya
  funcionaba bien—, sin tocar `ApuestaItem.jsx`.
  El botón "Más" tampoco se cerraba al tocarlo dos veces (solo funcionaba
  tocando fuera): `onAbrirMas` ponía `masAbierto` siempre a `true` (no
  alternaba), y además el botón vive en `BarraInferiorMovil.jsx`, fuera
  del `contenedorRef` de `MenuSecundario.jsx` — su propio `mousedown`
  contaba como "click fuera" y cerraba el panel un instante antes de que
  el `onClick` del botón lo volviera a abrir, así que tocarlo no cambiaba
  nada a la vista. `onAbrirMas` ahora alterna, y `App.jsx` comparte un
  `masBotonRef` entre `BarraInferiorMovil.jsx` (lo pone en el botón) y
  `MenuSecundario.jsx` (lo excluye de su detección de "click fuera").
- **Bonos pendientes** (no era una fase del guion, petición directa —
  motivada por promociones tipo "si pierdes, freebet" de Bet365 o "depósito
  con bono" de Codere). Se descartó automatizarlo desde la apuesta (un
  checkbox de "seguro" solo cubriría el caso ligado a una apuesta perdida,
  no el de bono por depósito) y también se descartó resucitar el módulo de
  Promociones que se eliminó a propósito (ver más abajo). En su lugar,
  `bonos_pendientes` es un recordatorio suelto e independiente: casa,
  importe, motivo (texto libre opcional) y fecha, sin ligarlo a ninguna
  apuesta ni movimiento. Se añade a mano en cualquier momento (al perder un
  seguro, al hacer un depósito con bono...) y se borra con "Ya lo
  registré" cuando se convierte en una apuesta real — sin estado
  "resuelto", igual que `objetivos`: borrar la fila es el único final.
  `hooks/useBonosPendientes.js` sigue el mismo patrón que
  `useMovimientos.js`. Se gestiona en `ListadoCasas.jsx` (mismo sitio que
  los movimientos de cada casa, tiene sentido financiero parecido) con
  `FormularioBono.jsx`, y un aviso resumen `AvisoBonos.jsx` en
  `PantallaInicio.jsx` (mismo patrón que `AvisoPendientes.jsx`) para que no
  pase desapercibido.
  Ronda de ajuste tras probarlo: al elegir "Freebet" como tipo de fondos en
  `FormularioApuesta.jsx`, el aviso de bankroll bajo el selector de casa
  seguía comprobando el dinero real (mensaje "No hay bankroll disponible"
  aunque la apuesta no fuera a salir de ahí). Ahora se muestran dos líneas
  siempre: "Dinero real: X€ disponibles" y "Freebets: Y€ pendientes"
  (sumando los `bonos_pendientes` de esa casa) — el aviso en rojo con
  icono solo se activa en la línea que corresponde al `tipoFondos`
  elegido. `bonos` se pasa ahora también a `FormularioApuesta.jsx` (nuevo
  prop) y de ahí a todos sus puntos de entrada: `App.jsx` (nueva apuesta),
  y `ListaApuestas.jsx` → `ApuestaItem.jsx` (editar una ya existente),
  igual que ya se hacía con `movimientos`/`apuestas`.
- **Apuesta asegurada, aumento de cuota, bono en el ingreso, y desplegable
  de mercados** (no eran fases del guion, peticiones directas de la misma
  sesión, para registrar promociones reales de las casas más rápido):
  - Columnas nuevas en `apuestas`: `seguro_freebet_importe` (si la apuesta
    tiene seguro, el freebet que da la casa si pierde) y `aumento_pct` (si
    tiene aumento de cuota, el % de más sobre la ganancia si gana). Ambas
    opcionales, `null` si no aplican; casillas en `FormularioApuesta.jsx`
    que revelan el campo numérico al marcarlas, mismo patrón que ya usaba
    Cash Out.
  - Al marcar una apuesta con seguro como "Perdida",
    `manejarMarcarResultado` en `App.jsx` (envuelve a `marcarResultado` de
    `useApuestas.js`) crea el bono pendiente solo, con `agregarBono` de
    `useBonosPendientes` — sin este paso habría que añadirlo a mano en
    Casas de apuestas.
  - El % de aumento se aplica sobre la **ganancia neta**, no sobre el
    retorno total — comprobado con una captura real de Bet365 (cuota 4,00,
    5€, 30% de aumento → 15€ base × 1,30 = 19,50€, no 20€×1,30). Cambio en
    `calcularBeneficio` (`utils/apuestas.js`), solo en la rama "ganada"; no
    hizo falta tocar `utils/academia.js` porque la fórmula base que explica
    no cambia (el aumento es un extra opcional, igual que Cash Out ya
    tiene su propio concepto aparte sin fórmula fija).
  - `FormularioMovimiento.jsx` gana un campo opcional "Bono" (solo visible
    con tipo Ingreso): si el depósito viene con un bono de bienvenida, se
    registra en el mismo paso (llama también a `onAgregarBono`) en vez de
    abrir el formulario suelto de "Nuevo bono pendiente"
    (`FormularioBono.jsx`, que se queda igual para los casos que no vienen
    de un depósito, como el seguro).
  - `utils/mercados.js` (nuevo): catálogo `CATEGORIAS_MERCADO` (Resultado,
    Goles, Hándicap asiático, Córners) y `equiposDesdeEvento`, que separa
    el nombre de los equipos del campo "Evento" partiendo por " - " (el
    formato que ya usa el buscador de partidos), con nombres genéricos de
    repuesto si no encaja ese formato — se usa en todas las categorías
    (no solo Resultado) para que salga el nombre real del equipo siempre
    que se pueda. Cada opción ya es un mercado concreto y completo (p.ej.
    "Over 2.5 goles", generadas con un bucle sobre líneas 0.5–6.5, no
    escritas una a una); el hándicap asiático genera además las líneas
    "partidas" (cuartos) intercaladas, p.ej. "-5.0, -5.5" entre las líneas
    -5.5 y -5.0. Las líneas de córners (6.5 a 14.5) son una interpretación
    de un pedido algo incompleto en el mensaje original — fácil de ajustar
    el rango si no es exactamente lo que se quería.
  - Ronda de ajuste tras probarlo: en vez de un desplegable + un campo de
    texto "Apuesta" siempre visible al lado (que quedaba redundante en
    cuanto se elegía un mercado), `SelectorMercado.jsx` pasó a ser el
    único campo "Apuesta" de cada selección — un `<select>` con
    `<optgroup>` por categoría (mismo patrón que el desplegable de País en
    `BuscadorEvento.jsx`, para poder ir bajando hasta la opción en vez de
    escribir) más una opción "Otro mercado" al final. El campo de texto
    libre ya no se ve nunca salvo que se elija "Otro mercado" — o, al
    editar una apuesta ya creada, si su texto no coincide con ninguna
    opción del catálogo para ese evento (p.ej. apuestas de antes de este
    desplegable), en cuyo caso se abre directamente en "Otro mercado" para
    no esconder lo que ya había escrito.
  - Ampliación del catálogo, misma sesión: "Resultado al descanso" (con
    nombre de equipo, como "Resultado") y "Resultado descanso/final" (sin
    nombre de equipo — "Local/Visitante" es la notación estándar de ese
    mercado, no se sustituye) se añadieron justo después de "Resultado".
    Dentro de "Goles" se añadió Ambos marcan de 1ª/2ª mitad junto al de
    partido completo; "Goles por equipo" salió de dentro de "Goles" a su
    propia categoría, y se añadieron "Goles 1ª mitad"/"Goles 2ª mitad"
    (líneas más cortas, 0.5 a 3.5, con su propio generador
    `opcionesGolesMedioTiempo` en `utils/mercados.js`) entre "Goles" y
    "Goles por equipo".
  - Pulido final: "Otro mercado" en negrita en `SelectorMercado.jsx`
    (mismo patrón que "Otras ligas" en `BuscadorEvento.jsx`), más
    espaciado en cada tarjeta de selección de `FormularioApuesta.jsx`
    (`p-3`→`p-4`, `space-y-2`→`space-y-3`) y entre selecciones de una
    combinada (`space-y-3`→`space-y-4`). Los desplegables de País y
    Competición en `BuscadorEvento.jsx` tenían `text-xs`/`px-2 py-1.5`,
    más pequeños que el resto de campos del formulario — se igualaron a
    `text-sm`/`px-3 py-2`.
  - "Bankroll total" en `ListadoCasas.jsx` pasa a sumar dinero real +
    freebets pendientes (antes solo dinero real), con un desglose de dos
    columnas debajo ("Dinero real" / "Freebets", esta última sumando los
    `bonos_pendientes` de todas las casas) — mismo dato que ya usa
    `AvisoBonos.jsx`, solo que aquí sí se refleja en el número grande de
    arriba.
  - "Apuesta asegurada" y "Aumento de cuota" pasan a ocupar toda la fila
    del formulario (`sm:col-span-2`) en vez de ir en paralelo con el resto
    de campos del grid de 2 columnas — quedan una debajo de la otra en
    cualquier tamaño de pantalla. Sus campos numéricos limitan el ancho
    (`sm:max-w-xs`) para no estirarse a todo lo ancho de la fila nueva.
  - Última ronda: esas dos casillas se veían demasiado simples (solo texto
    pequeño), así que pasan a ser su propia caja (`border`, `p-3`,
    `rounded-lg`) que se ilumina en dorado (`border-gold bg-gold/10`)
    cuando están marcadas — mismo lenguaje visual que ya usa el resto de
    la app para "esto es una promo/bono" (Freebet, Asegurada, +X% aumento
    en `ApuestaItem.jsx`, las tarjetas de `bonos_pendientes`...). Y un
    separador (`border-t`) entre el bloque de datos generales y
    "Selecciones", que antes quedaban pegados. Las etiquetas de las dos
    casillas pierden el paréntesis explicativo ("Apuesta asegurada",
    "Aumento de cuota" a secas) — ya se entienden solas.
  - "Resultado" (renombrado a "Resultado Final" para distinguirlo de
    "Resultado al descanso") gana las 6 apuestas de Betfair Exchange
    justo después de "Gana el equipo visitante" — formato "Local: Favor" /
    "Local: Contra" / etc., sin nombre de equipo (pedido así
    explícitamente, a diferencia del resto de la categoría).
  - **`SelectorMercado.jsx` deja de usar un `<select>` nativo con
    `<optgroup>`**: probado en móvil, las cabeceras de categoría se veían
    casi igual que las opciones porque el `<select>` en Android/iOS lo
    pinta el sistema operativo entero — ningún CSS nuestro llega ahí, ni
    siquiera `font-bold`. Pasa a ser un desplegable propio (botón +
    panel absoluto con scroll, mismo patrón de "click fuera cierra" que
    `BuscadorEvento.jsx`): cabeceras de categoría con fondo `bg-felt`
    (`sticky top-0`, se quedan fijas mientras se hace scroll dentro de esa
    categoría) claramente distintas de las opciones (fondo normal, se
    resaltan en dorado la que está elegida). "Otro mercado" al final,
    separado con un borde superior doble. La lógica de guardar/leer la
    selección (`seleccionInicial`, `buscarOpcion`) no cambia.
  - Nombres genéricos de equipo (cuando "Evento" no tiene el formato
    "Local - Visitante") pasan de "el equipo local"/"el equipo visitante"
    a "Equipo Local"/"Equipo Visitante" en `equiposDesdeEvento`
    (`utils/mercados.js`) — se nota en todo el catálogo a la vez, al ser
    un único sitio. "Empate al descanso" en "Resultado al descanso" pasa
    a ser solo "Empate" (ese cambio sí es texto literal de esa opción, no
    del nombre genérico).
  - En `BuscadorEvento.jsx`: el campo "Evento" (con su placeholder "Ej.
    Real Madrid - FC Barcelona") ya no se ve nunca hasta elegir un país
    (cualquiera, incluida "Otras ligas") — antes se veía siempre, vacío,
    antes incluso de elegir nada. Al editar una selección que ya tenía
    evento escrito de antes, se muestra igual aunque no se haya tocado el
    desplegable de País en esta sesión (`paisFiltro || valor`), para no
    esconder un dato ya guardado. El "Seleccionar un país" del desplegable
    de País se cortaba en móvil (más ancho desde que se igualó su
    `text-sm`/`px-3` al resto de campos) — pasa a ser solo "País", como ya
    era "Competición" al lado.
  - `TarjetaApuestaResumen.jsx` pierde la segunda línea (casa · cuota ·
    apostado) que solo se veía en `sm:`/`md:` — quedaba redundante porque
    tocar la tarjeta ya abre el detalle completo con todo eso. En
    `ListaApuestas.jsx`, la cabecera de cada mes (antes texto suelto con
    icono) pasa a ser su propia tarjeta con borde (`bg-surface border
    border-line rounded-lg`), con su beneficio en pastilla de color
    (verde/rojo/gris) — para que se note claramente como una fila propia
    del listado, no solo una etiqueta más.
  - Se probó fusionar el día dentro de cada tarjeta (quitando la cabecera
    de día) y se descartó tras ver una captura de referencia (Bet
    Analityx): el día va como cabecera propia — texto simple ("Domingo
    11") + su beneficio del día en pastilla de color — justo encima del
    grupo de tarjetas de ese día, no dentro de la tarjeta de cada apuesta.
    Vuelta al diseño con `<div>` por día en `ListaApuestas.jsx` (cabecera +
    sus tarjetas), sin la línea de fecha dentro de
    `TarjetaApuestaResumen.jsx`. `etiquetaDia` se quedó exportada desde
    `utils/agrupado.js` por si hace falta en otro sitio, aunque ya no se
    usa fuera de ahí.
  - Ajuste final: el `<div>` de cada día pasa a tener un borde fino propio
    (`border border-line rounded-lg p-2`) — envuelve la cabecera del día y
    su(s) tarjeta(s) de apuesta en un único recuadro, para que se note que
    van juntos. En modo claro, sin fondo propio no se distinguía del
    crema de la página, así que se le añadió `bg-paperDim` (mismo token ya
    usado en el resto de la app para superficies "recogidas" — en oscuro
    también le sienta bien, no hizo falta un `dark:` aparte). La tarjeta
    de la apuesta en sí (`TarjetaApuestaResumen.jsx`) no se toca.
  - **Rediseño de fila**, dos vueltas: la primera probó filas pegadas con
    `divide-y` dentro de la tarjeta del día (prop `comoFila`); tras ver una
    captura de referencia hecha a medida para esta app, se descartó — cada
    apuesta vuelve a ser su propia tarjetita (`bg-paperDim border
    border-line rounded-xl`, sin variante `comoFila`: mismo aspecto en
    todos los sitios, incluida "Últimas apuestas" de `PantallaInicio.jsx`),
    con espacio entre ellas dentro de la tarjeta del día (que pasa a
    `rounded-2xl p-3 sm:p-4 space-y-3`, con cabecera en fuente grande
    `font-display` y el beneficio en píldora `rounded-full`). Cada tarjeta
    de apuesta: emoji del deporte dentro de un círculo (`bg-surface`,
    contraste con el `bg-paperDim` de la tarjeta), badge Simple/Combinada
    en píldora dorada rellena, evento en negrita más grande, y la franja
    vertical de resultado (mayúsculas girada,
    `[writing-mode:vertical-rl] rotate-180`, fondo sólido — sin utilidad
    de Tailwind para "writing-mode", hace falta la sintaxis arbitraria).
    Se preguntó por un badge de "hora" (la captura de referencia sí lo
    llevaba) y se descartó a propósito: es la hora del partido, no la de
    registro, y la app no guarda ese dato.
  - Ronda de pulido tras verlo con datos reales: la cabecera del mes
    (antes sin tamaño explícito) pasa a `text-xl font-bold` y su píldora
    de beneficio a `rounded-full`/`text-sm`, y la cabecera de cada día baja
    de `text-lg font-bold` a `text-sm font-semibold` (píldora `text-xs`) —
    así queda claro que el mes manda visualmente y el día es un nivel por
    debajo, no al revés. La franja vertical de resultado dejó de usar los
    tokens `win`/`lose`/... (que se aclaran a propósito en modo oscuro
    para leerse bien como *texto*) y pasó a colores RGB fijos
    (`bg-[rgb(...)]`, los mismos valores que ya usa el modo claro) porque
    como fondo sólido con texto encima, la versión clara de esos tokens se
    veía descolorida en oscuro — con RGB fijo, la franja se ve igual en
    los dos modos.
  - Bug real encontrado al usarlo: en `BuscadorEvento.jsx`,
    `necesitaCompeticion` solo exigía elegir competición si el país tenía
    más de una conectada — Portugal/Holanda/Bélgica (una sola competición
    cada uno) se saltaban ese paso y mostraban partidos solo con el país
    elegido. Si el usuario no llegaba a tocar el desplegable de
    Competición, la selección podía quedar sin partido de verdad elegido
    y la apuesta no se guardaba (fallo silencioso, sin aviso — la
    validación de `FormularioApuesta.jsx` ya existía, esto era la causa).
    Ahora `necesitaCompeticion` exige competición siempre que hay país
    elegido, sin importar cuántas tenga conectadas.
    Ronda de ajuste: con el país elegido pero la competición todavía
    pendiente, el cuadro de "Escribe para filtrar" (vacío, sin partidos
    que filtrar todavía) se veía a la vez que el aviso de "Elige una
    competición" — redundante. Ahora el cuadro entero (input + lista de
    partidos) no se pinta hasta que `necesitaCompeticion` es `false`; el
    aviso de "Elige una competición" ya no hacía falta (siempre era falso
    dentro de ese bloque) y se quitó.
  - **Simplificación del detalle** (petición directa, misma sesión): el modo
    "✎ Editar" inline de `ApuestaItem.jsx` (quitar mercados sueltos con ✕
    sin salir del detalle) se quitó del todo — quitar un mercado de un
    partido ya se puede hacer desde el formulario completo (el bet builder
    de `FormularioApuesta.jsx` ya deja borrar mercados de un bloque), así
    que tener dos formas distintas de "editar" en la misma pantalla no
    aportaba, solo confundía. Ahora hay un único botón "Editar" (icono
    lápiz, cabecera) que abre siempre el formulario completo — y de paso
    la fila de acciones de abajo queda solo con lo que pedía el usuario:
    Ganada/Perdida/Nula (si está pendiente), Cash Out y Eliminar apuesta.
    Se borraron `quitarSelecciones` y `actualizarSelecciones` de
    `useApuestas.js` (y el hilo de props `onQuitarSelecciones`/
    `onActualizarSelecciones` por `App.jsx` → `PantallaInicio.jsx`/
    `ListaApuestas.jsx` → `ApuestaItem.jsx`) por quedarse sin ningún punto
    de entrada tras este cambio.
    El mini-selector Ganada/Perdida/Nula por partido (solo en combinadas,
    2 o más partidos) pasa a verse siempre, sin depender de ningún modo de
    edición — y se corrigió el bug real que motivó todo esto: marcar el
    resultado final de la apuesta completa (p.ej. "Perdida") ya NO pinta
    todos los partidos de rojo. Antes `colorResultado` se calculaba como
    `!esPendiente ? apuesta.resultado : grupo.resultado`, así que en
    cuanto la apuesta se resolvía, el resultado propio de cada partido
    quedaba oculto detrás del resultado general. Ahora es
    `esCombinada ? grupo.resultado : apuesta.resultado` — cada partido de
    una combinada conserva su propio punto/etiqueta de color
    independientemente de si la apuesta entera ganó o perdió (se puede
    acertar 4 de 5 y que se vea), y solo en una apuesta simple (1 único
    partido, sin mini-selector propio) el punto sigue el resultado general
    porque ahí son la misma cosa.
  - Ronda de pulido tras probarlo (peticiones directas, misma sesión): los
    mercados de cada partido (antes en una sola línea separados por "·")
    pasan a listarse uno debajo de otro, más fáciles de leer con varios
    mercados. Textos y logo de la cabecera del detalle, que se veían
    pequeños, suben de tamaño (logo de la casa de `w-5 h-5` a `w-10 h-10`;
    el resto de textos un escalón de Tailwind por encima de donde estaban).
    "Eliminar apuesta" deja de vivir como botón grande al final de la
    tarjeta y pasa a ser un icono (papelera, `lucide-react` `Trash2`) junto
    al lápiz de "Editar" en la cabecera — mismo sitio, mismo tamaño. Con
    los dos únicos botones grandes de abajo ya movidos arriba (Editar y
    Eliminar), el bloque de acciones del final (antes siempre presente)
    pasa a existir solo si la apuesta sigue pendiente (Ganada/Perdida/Nula
    + Cash Out) — si ya está resuelta, no queda nada que mostrar ahí y el
    bloque entero desaparece en vez de dejar un hueco vacío.
    Cada mercado ("Gana PSV", "Over 2.5 goles"...) se quedaba demasiado
    apagado (`text-slate`, el mismo gris que la competición/país) al lado
    del evento en negrita — ahora lleva una marca `▸` dorada delante y pasa
    a `text-ink font-medium`: se distingue mejor del evento sin llegar al
    `font-semibold` de este (probado primero en semibold, un paso de más
    según el usuario).
- **Cuota total ajustada a mano en combinadas** (no era una fase del guion,
  petición directa: el usuario detectó que una combinada de 5 partidos en
  Bet365 le pagaba con cuota 8,00 y la app calculaba 7,60/7,92). Causa: la
  app guarda la cuota de cada selección redondeada a 2 decimales (la que
  se ve en el ticket) y calcula la cuota total multiplicándolas —
  Bet365 (y cualquier casa) calcula internamente con más precisión y solo
  redondea el resultado final, así que con 4-5 patas el error de redondeo
  de cada cuota se acumula y se nota en unos céntimos. No hay forma de que
  cuadre exacto sin conocer la cuota real sin redondear de cada selección
  (que la casa no enseña), así que en vez de intentar arreglarlo, se dio
  una vía de escape manual.
  - `calcularCuotaTotal` (`utils/apuestas.js`) cambia de firma —
    `(selecciones)` a `({ selecciones, cuotaTotalManual })`, así que ahora
    recibe la apuesta entera (todos los sitios que la llamaban con
    `a.selecciones` pasan a llamarla con `a`: `calcularBeneficio`,
    `calcularEstadisticas`, `calcularBeneficioPorRangoCuota`
    en `utils/estadisticas.js`, el trofeo "Cazador de cuotas" en
    `utils/trofeos.js`, y `ApuestaItem.jsx`). Si `cuotaTotalManual` tiene
    valor, manda sobre el producto calculado.
  - Columna nueva `cuota_total_manual numeric` en `apuestas` (Supabase).
    En combinadas de 2 o más partidos, `FormularioApuesta.jsx` muestra un
    campo opcional "Importe que paga la casa si aciertas todo" debajo de
    "Cuota total combinada" — confirmado con el usuario que este importe
    es el retorno total (incluye el stake, lo que la casa muestra como "a
    cobrar"), no solo la ganancia neta. Al guardar, se convierte a cuota
    (`importe / stake`) y esa es la que se guarda en `cuotaTotalManual`;
    vacío, sigue funcionando exactamente igual que antes (producto de las
    cuotas). Al editar una apuesta que ya tiene este valor, el campo se
    precarga reconstruyendo el importe (`cuotaTotalManual × stake`).
  - `ApuestaItem.jsx` marca "Cuota total *" con una nota al pie cuando hay
    un valor manual, para que quede claro por qué esa cifra no coincide
    con multiplicar las cuotas de cada partido de la lista de abajo.
  - **Trade-off asumido, avisado en el propio código** (comentario en
    `calcularCuotaTotal`): con un valor manual puesto, deja de aplicarse el
    ajuste automático por partido anulado (`resultado === "nula"` — ver
    `agruparSeleccionesPorPartido`), porque no hay forma de saber qué parte
    del importe manual correspondía a esa pata. Si se anula un partido de
    una combinada con cuota ajustada a mano, habría que volver a editar el
    importe manual (o borrarlo, para volver al cálculo automático).
  - **Pendiente**: ejecutar `alter table public.apuestas add column
    cuota_total_manual numeric;` en Supabase antes de usar este campo en
    producción (añadido al final de `supabase-setup.sql`).
- **Editar apuesta también en picks simples del constructor** (no era una
  fase del guion, petición directa tras probar la cuota manual: si te
  equivocas de mercado o de cuota en un pick de 1 mercado dentro de
  "Apuesta en construcción", antes solo se podía "Quitar partido" entero y
  rehacer país/competición/partido/mercado/cuota desde cero). El botón
  "Editar apuesta" de `FormularioApuesta.jsx` deja de estar solo en
  bloques "multi" (2+ mercados) y aparece en todos — en un pick simple, en
  vez de la lista de mercados con su ✕ (que solo tiene sentido con varios),
  se muestra directamente `SelectorMercado.jsx` (mismo componente que ya
  usa `ConstructorPartido.jsx`, con el `evento` del bloque para generar el
  catálogo) para poder cambiar el mercado elegido, junto al campo de cuota
  que ya existía. Nuevo estado `mercadoEditando` (mismo patrón que
  `cuotaEditando`: texto libre mientras se edita, se aplica al bloque solo
  al pulsar "Listo"), inicializado con el mercado actual solo si el bloque
  tiene 1 único mercado (en un "multi" no se toca, ahí se sigue editando
  mercado a mercado con su ✕).
  "Quitar partido"/"Editar apuesta"/"Listo" (en cada bloque de "Apuesta en
  construcción") pasan de texto suelto subrayado al pasar el ratón a
  píldoras con borde a juego (`rounded-full`, `border-lose/40`/
  `border-gold/40`, fondo tenue al pasar el ratón) — se veían demasiado
  discretos para acciones que se usan bastante al construir una combinada.

## Fases futuras pedidas (5, una a una con confirmación)

Petición directa de una tanda de 5 cambios grandes (freebets, archivado,
copia de seguridad, desplegables), a abordar en fases separadas,
confirmando cada una antes de la siguiente.

- **Fase A — Saldo de freebet por casa** — ✅ hecho. Sustituye el sistema
  de `bonos_pendientes` (lista de avisos que se borraban a mano con "Ya lo
  registré") por un **saldo numérico por casa** (`casas.freebet_saldo`)
  que se ajusta solo: sube al registrar un bono de depósito
  (`FormularioMovimiento.jsx`) o un seguro perdido (`manejarMarcarResultado`
  en `App.jsx`), baja al crear una apuesta con fondos Freebet
  (`manejarAgregar`) — pase lo que pase después con esa apuesta —, y se
  devuelve si esa apuesta se anula (`manejarMarcarResultado`, resultado
  "nula") o se borra estando aún Pendiente (`manejarBorrarApuesta`, nueva).
  Si ya estaba resuelta (ganada/perdida/cash out) no se devuelve al
  borrarla: el freebet ya se gastó de verdad. `useCasas.js` gana
  `ajustarSaldoFreebet(nombre, delta)`, que lee el saldo actual del propio
  estado local y hace un `update` en Supabase.
  **A propósito, sin tocar en esta fase**: `FormularioBono.jsx`,
  `useBonosPendientes.js` y el listado de "Bonos pendientes"/"Ya lo
  registré" en `ListadoCasas.jsx` — sus dos disparadores automáticos
  (depósito, seguro) ya no crean bonos pendientes, así que a partir de
  ahora esa lista solo recibe el caso residual ("Otro bono"), que es
  justo lo que pide la Fase B — así que esa fase ya queda más pequeña de
  lo que parecía. Se hizo también una migración de datos de un solo uso
  (sin borrar `bonos_pendientes`) que sumó lo que ya hubiera pendiente de
  cada casa dentro de su saldo inicial, para no perder ese seguimiento.
- **Fase B — Ajuste de "Nuevo bono pendiente"** — ✅ hecho.
  `FormularioBono.jsx` pasa a llamarse "Otro bono", con un botón ℹ️ junto
  al título (`useState` local, alterna un texto explicativo debajo, mismo
  patrón sencillo que ya usa `BuscadorEvento.jsx`/`SelectorMercado.jsx`
  para paneles que se abren/cierran) aclarando que es solo para bonos que
  no vienen de un depósito ni de una apuesta asegurada — esos ya suman
  solos al saldo de freebet desde la Fase A. Más discreto que el resto de
  formularios de la app a propósito (se usará raramente): borde
  `border-dashed` en vez de sólido, título más pequeño, botón "Añadir"
  más pequeño. La lista de "Bonos pendientes" y su botón "Ya lo registré"
  en `ListadoCasas.jsx` no cambian — a partir de ahora solo mostrarán lo
  que se añada desde aquí.
  Ronda de ajuste tras Fase B (petición directa, misma sesión): tanto la
  lista de "Bonos pendientes" como el formulario "Otro bono" se sacan del
  bloque suelto arriba del todo de `ListadoCasas.jsx` y pasan a vivir
  dentro de cada tarjeta de casa (junto al resto de sus datos:
  Ingresos/Retiradas/Beneficio/ROI/Freebet), filtrados a esa casa —
  ya no hace falta elegir casa en el formulario (`FormularioBono.jsx`
  gana un prop `casaFija`, mismo patrón que `FormularioMovimiento.jsx`).
  El formulario se abre con un botón discreto "+ Otro bono" (`useState`
  `mostrandoBono` en `ListadoCasas.jsx`, se cierra solo al cambiar de casa
  expandida), colocado justo debajo de `FormularioMovimiento` (con sus
  campos Cantidad/Bono recibido con este depósito) — para seguir el orden
  lógico: primero el caso automático (bono con el depósito), después el
  residual (Otro bono). Y "Bankroll total" (la caja de arriba del todo) pasa a
  mostrarse siempre que haya al menos una casa registrada, aunque no
  tenga ningún movimiento todavía (antes solo aparecía si alguna casa
  tenía movimientos o apuestas) — mismo cambio de condición ya usado en
  la tarjeta de cada casa individual (`SIN_MOVIMIENTOS` como valor por
  defecto).
- **Fase C — Archivado por rango de fechas** — ✅ hecho. `apuestas` y
  `movimientos` ganan una columna `archivado` (boolean, `false` por
  defecto) — no se toca `promociones` (ya sin uso) ni `casas`/`objetivos`/
  `bonos_pendientes` (sin un rango de fechas con sentido). Nada se borra:
  archivar solo oculta esas filas de las vistas normales.
  - `useApuestas.js`/`useMovimientos.js` ganan `archivarPorRango(desde, hasta, archivado)`
    (mismo patrón que `borrarTodoBankroll`, pero `.update({archivado})` en
    vez de `.delete()` — sirve tanto para archivar como para desarchivar
    según el booleano). `utils/apuestas.js` gana `filtrarPorRango(apuestas, desde, hasta)`,
    un rango libre (a diferencia de `filtrarPorPeriodo`, que solo conoce
    los bloques de calendario hoy/semana/mes/año).
  - **Lo que nunca cambia al archivar**: "Casas de apuestas"
    (`ListadoCasas.jsx` — bankroll por casa, saldo de freebet) sigue
    recibiendo `apuestas`/`movimientos` sin filtrar, así que el dinero real
    no se mueve ni un céntimo, se archive lo que se archive. Los trofeos
    tampoco — `useTrofeos(apuestas)` en `App.jsx` ya recibía (y sigue
    recibiendo) el array completo sin filtrar por bankroll/casa/periodo,
    así que archivar apuestas antiguas nunca "quita" un trofeo ya
    conseguido.
  - **Lo que sí se oculta por defecto**: en `App.jsx`, `apuestasDelBankroll`
    (la base de la que cuelgan `apuestasFiltradas`, `apuestasPeriodo`, la
    racha actual y el listado de Apuestas/Entretenimiento) excluye lo
    archivado salvo que el nuevo checkbox "Ver también archivado" de
    `FiltrosApuestas.jsx` (estado `verArchivadas`) esté marcado.
    `EstadisticasDashboard.jsx` e `InformeProfesional.jsx` reciben el
    array completo como siempre y hacen su propio filtrado local (mismo
    patrón que ya usaban para su filtro de casa/bankroll/periodo), cada
    uno con su propio checkbox "Ver también archivado".
  - **Rango libre en Estadísticas**: además del checkbox,
    `EstadisticasDashboard.jsx` gana una pastilla "Rango de fechas" que
    sustituye a las pastillas de casa mientras está activa — dos
    `<input type="date">` (desde/hasta) que usan `filtrarPorRango` y
    **siempre** cruzan archivado + activo (es su propósito: consultar un
    periodo histórico completo, p.ej. un año ya archivado entero, en un
    solo vistazo), sin depender del checkbox.
  - Apuestas archivadas se distinguen con una pastilla gris "Archivada"
    (`bg-void/10 text-void`, para no confundirla con las doradas de
    promoción) en `ApuestaItem.jsx` y `TarjetaApuestaResumen.jsx` — solo
    se llega a ver con "Ver también archivado" activado.
  - **Ajustes** gana una tarjeta nueva `ArchivarDatos.jsx` (bajo
    `CopiaSeguridad`): interruptor Archivar/Desarchivar, dos fechas
    (desde/hasta), un recuento en vivo ("X apuestas y Y movimientos"),
    un botón "Exportar JSON de este rango" (recomendado, no obligatorio —
    nueva función `exportarRango(desde, hasta)` en `utils/copiaSeguridad.js`,
    mismo patrón que `exportarDatos()` pero solo `apuestas`/`movimientos`
    filtrados por fecha) y el botón de confirmar la acción con
    `ConfirmDialog`. El mismo panel sirve para desarchivar (mismo rango,
    mismo botón, solo cambia el interruptor) para que quede totalmente
    reversible, sin necesitar una pantalla aparte.
- **Fase D — Aviso de copia de seguridad** — ✅ hecho. `CopiaSeguridad.jsx`
  muestra siempre una línea de estado ("Última copia de seguridad
  realizada hace X días" / "hoy" / "Todavía no se ha hecho ninguna copia
  de seguridad" si nunca se ha exportado) — pasados 7 días desde esa
  fecha, el texto cambia a estilo de aviso (dorado) y añade "Conviene
  hacer una nueva", pero nunca bloquea nada. Cuenta tanto una exportación
  completa como una de un rango (Fase C, `ArchivarDatos.jsx`) — cualquiera
  de las dos "renueva" la fecha. Si nunca se ha exportado, la referencia
  es la fecha de alta de la cuenta (`sesion.user.created_at`, la da
  Supabase Auth sin guardar nada nuevo — prop `fechaAltaCuenta` desde
  `App.jsx` hasta `CopiaSeguridad.jsx`).
  A diferencia de "trofeos-vistos" (solo local), esta fecha sí se quiso
  ver igual en todos los dispositivos (petición directa tras probarlo):
  nueva tabla `ajustes` en Supabase (una fila por usuario, columna
  `ultima_copia timestamptz`) y `hooks/useAjustes.js` (mismo patrón que
  `useCasas.js`: fetch inicial + canal realtime + `upsert` con
  `onConflict: "user_id"`) en vez de `localStorage`. `registrarCopiaRealizada()`
  se llama desde `App.jsx` (vía prop `onCopiaRealizada`) al terminar
  `exportarDatos()`/`exportarRango()`, no dentro de esas funciones — así
  quedan como utilidades puras, sin depender de la sesión.
  Bug real encontrado al probarlo: exportar justo al entrar en Ajustes no
  actualizaba el texto hasta la siguiente exportación (y el archivo se
  descargaba duplicado, "...(1).json", porque el segundo intento generaba
  el mismo nombre de archivo del mismo día). Causa: una carrera entre el
  fetch inicial del hook (`select` disparado al montar) y el `upsert` de
  `registrarCopiaRealizada` — si el fetch inicial tardaba más en responder,
  su resultado (la fila de antes de exportar) llegaba después y pisaba el
  valor ya puesto por el upsert. `useAjustes.js` añade `masReciente(a, b)`
  (compara las dos fechas ISO como texto, igual que ya se comparan las
  `fecha` de apuestas/movimientos en otros sitios) y lo usa en los tres
  puntos que tocan `ultimaCopia` (fetch inicial, canal realtime, upsert),
  para que una respuesta que llega tarde nunca pueda retroceder el valor.
- **Fase E — Desplegables en responsive (casa/país/competición +
  desplegable de mercados cortado en móvil)** — ✅ hecho. Nuevo
  `SelectorDesplegable.jsx`: mismo patrón que ya tenía `SelectorMercado.jsx`
  (botón + panel propio, no `<select>` nativo — en móvil un `<select>` con
  `<optgroup>` lo pinta el sistema operativo entero, sin dejar aplicar
  ningún estilo), pero genérico (`grupos: [{ etiqueta?, opciones: [{valor,
  texto, destacado?}] }]`, grupo sin `etiqueta` = lista plana sin
  cabecera), para no repetir la misma lógica de abrir/cerrar y "click
  fuera cierra" en cada sitio. `CampoCasa.jsx` (antes `<select>` liso) y
  "País"/"Competición" en `BuscadorEvento.jsx` (antes `<select>` con
  `<optgroup>`) pasan a usarlo — `SelectorMercado.jsx` no se tocó por
  dentro (ya funcionaba bien), solo se corrigió el bug de abajo.
  Bug real corregido de paso: el desplegable de mercados "se cortaba" en
  móvil y no llegaba a verse "Otro mercado". Causa: su panel tenía `z-20`,
  por debajo de la barra inferior móvil (`z-40`, `BarraInferiorMovil.jsx`)
  — si se abría cerca del final de la pantalla, la barra (opaca) tapaba la
  parte de abajo del panel. Se sube a `z-50` (mismo nivel que el resto de
  overlays de la app — `ConfirmDialog.jsx` y similares) tanto en
  `SelectorMercado.jsx` como en `SelectorDesplegable.jsx` y en los otros
  dos paneles de `BuscadorEvento.jsx` (aviso de "fuera de rango" y lista de
  partidos, mismo problema potencial). De paso, `max-h-80` (320px fijos)
  pasa a `max-h-[50vh]` en los tres, para que la altura máxima del panel se
  ajuste a la pantalla en vez de a un valor fijo que podía no caber en
  móviles pequeños.
  Ronda de ajuste (petición directa, misma sesión): los cuatro paneles
  (`SelectorDesplegable.jsx`, `SelectorMercado.jsx`, y los dos de
  `BuscadorEvento.jsx`) ganan posición inteligente con el nuevo
  `hooks/usePosicionDesplegable.js`: al abrirse, mide con
  `getBoundingClientRect()` el hueco libre encima y debajo del campo y
  decide abrir hacia abajo (de toda la vida) o hacia arriba si hay poco
  sitio debajo y más arriba — así encaja bien tanto si el campo está al
  principio del formulario como si está pegado abajo del todo. La altura
  máxima del panel (antes fija en `max-h-[50vh]`) pasa a ajustarse también
  al hueco real disponible en cada caso (mínimo 120px), vía un
  `style={{ maxHeight }}` en vez de una clase de Tailwind. Solo se mide al
  abrir, no en cada scroll con el panel ya abierto. En `SelectorMercado.jsx`
  hizo falta además quitar `space-y-2` del contenedor y poner los márgenes
  a mano (`mt-2` en el campo de texto de "Otro mercado"): ese margen
  automático se aplicaba también al panel aunque estuviera en `absolute`,
  y al abrir hacia arriba lo empujaba en la dirección contraria a la que
  debía ir.
- **Ampliación de Academia y ℹ️ en "Otro bono"** (no era una fase del
  guion, petición directa tras la fase E). `utils/academia.js` gana 5
  conceptos nuevos, mismo formato que los 12 de la fase 20 (definición,
  "en cristiano", fórmula, ejemplo, interpretación, errores frecuentes):
  **Bono / Freebet**, **Apuesta asegurada (seguro)**, **Aumento de cuota
  (odds boost)**, **Promociones de casas de apuestas** (aclara que esta
  app ya no tiene una sección propia de Promociones — se registran como
  apuesta normal con seguro/aumento/bono) y **Matched Betting** (con las
  fórmulas del importe a apostar en contra —"lay"— en un exchange como
  Betfair Exchange, tanto con dinero real como con un freebet, y un
  ejemplo completo). "Cuota" ya existía desde la fase 20, no se duplica.
  `FormularioBono.jsx` ("Otro bono") cambia su ℹ️ de un texto propio
  (`useState` local que alternaba una frase) al `BotonInfoConcepto.jsx`
  estándar que ya usa el resto de la app, enlazado al concepto "Bono /
  Freebet" — la aclaración de que ese formulario es solo para el caso
  residual pasa a vivir dentro del concepto de Academia, sin duplicarla en
  dos sitios.
  Ronda de orden (petición directa, misma sesión): con 17 conceptos ya no
  bastaba la lista plana de la fase 20. `utils/academia.js` gana
  `CATEGORIAS_ACADEMIA` (mismo patrón que `CATEGORIAS` de `utils/
  trofeos.js`: un `id`/`etiqueta` por categoría) y cada concepto una
  `categoria` — de lo más básico a lo más avanzado: Fundamentos (Stake,
  Bankroll, Cuota, Probabilidad implícita, Apuesta simple, Apuesta
  combinada), Rendimiento y evaluación (ROI, Yield, Win Rate, EV),
  Resultados especiales (Cash Out, Void) y Bonos, promociones y matched
  betting (Bono, Apuesta asegurada, Aumento de cuota, Promociones, Matched
  Betting). `Academia.jsx` agrupa por esa categoría (cabecera dorada por
  grupo, se oculta si el buscador la deja sin conceptos) en vez de la
  lista plana de antes — se descartó a propósito un filtro alfabético
  aparte: con solo ~17 conceptos y el buscador de texto ya existente,
  agrupar por tema ayuda más a encontrar algo relacionado que ir letra por
  letra.
- **Bonos pendientes — eliminado por completo, "Otro bono" pasa a sumar
  directo** (no era una fase del guion, bug real detectado por el usuario:
  un bono de Betfair añadido desde "Otro bono" no aparecía como freebet
  disponible al crear una apuesta). Causa: desde la Fase A, el bono de
  depósito y el seguro perdido suman solos al saldo de freebet de la casa,
  pero "Otro bono" se quedó sin engancharse a ese sistema — seguía creando
  una fila en `bonos_pendientes` (el sistema de antes de la Fase A, con un
  botón "Ya lo registré" que solo borraba el aviso, sin tocar el saldo).
  `FormularioBono.jsx` ahora llama a `onAjustarSaldoFreebet` directamente
  (mismo prop que ya usa el campo "Bono recibido con este depósito" de
  `FormularioMovimiento.jsx`), sin paso intermedio — y de paso pierde los
  campos "Fecha" y "Motivo", que ya no se guardaban en ningún sitio real
  (`ajustarSaldoFreebet` solo lleva casa + importe). Con esto,
  `bonos_pendientes` se queda sin ningún punto de entrada en la app: se
  borran `AvisoBonos.jsx`, `useBonosPendientes.js` y toda la lista "Bonos
  pendientes" / botón "Ya lo registré" de `ListadoCasas.jsx`, y el prop
  `bonos` que se pasaba (sin usarse ya) por `App.jsx` → `PantallaInicio.jsx`
  / `ListaApuestas.jsx` / `ApuestaItem.jsx` / `FormularioApuesta.jsx`. La
  tabla `bonos_pendientes` no se borra (mismo criterio que `promociones`),
  pero una migración de un solo uso suma a `freebet_saldo` lo que hubiera
  quedado sin resolver ahí, para no perder ningún bono ya registrado antes
  de este arreglo. De paso, se corrigió un texto suelto y desactualizado en
  `FormularioApuesta.jsx` ("Apuesta asegurada" decía que el freebet se
  añadiría a "Bonos pendientes" al marcar Perdida — llevaba así desde antes
  de la Fase A, cuando en realidad ya sumaba directo al saldo de freebet).
- **Constructor de apuesta por partidos ("bet builder" v2)** (no era una
  fase del guion — la v1, un simple colapsado de selecciones consecutivas
  del mismo partido dentro de la lista plana, se descartó tras probarla: no
  dejaba ver de un vistazo qué llevaba ya la apuesta, y "Cambiar partido"
  para combinar varios partidos no era evidente. Rediseño completo a partir
  de una maqueta HTML interactiva que trajo el usuario como referencia).
  `FormularioApuesta.jsx` ya no construye `selecciones` como una lista
  plana editable a mano: la sección "Selecciones" pasa a ser
  `ConstructorPartido.jsx` (nuevo) + una tarjeta "Apuesta en construcción"
  con los partidos ya guardados.
  - **`ConstructorPartido.jsx`**: wizard de 2 pasos por partido. 1) Elegir
    partido (reutiliza `BuscadorEvento.jsx` tal cual) + botón "Elegir este
    partido". 2) Con el partido ya fijado (chip dorado arriba, con
    "Cambiar de partido" para volver al paso 1), elegir modo: **"+ Añadir
    cuota"** (un mercado + su propia cuota, como una selección normal) o
    **"Crear multi de este partido"** (varios mercados del mismo partido,
    sin pedir cuota por mercado — no tiene sentido pedirla, la cuota
    combinada de varios mercados del mismo partido no es el producto de
    las cuotas sueltas, es la que da la propia casa — con un único campo
    "Cuota de este partido" al final que la introduce el usuario a mano).
    Al guardar cualquiera de los dos modos, se llama a `onGuardarBloque`
    con `{evento, país, competición, partidoId, cuota, mercados: [...]}`
    y el wizard se reinicia solo, listo para el siguiente partido.
    `key={resetId}` en `BuscadorEvento`/`SelectorMercado` los remonta con
    estado limpio en cada reinicio — su valor inicial se calcula una sola
    vez al montar (`useState(() => ...)`), así que cambiar el prop "valor"
    a "" desde fuera no bastaba para vaciarlos visualmente. Un
    `onKeyDown` en el contenedor raíz evita que pulsar Enter en cualquier
    campo de aquí dentro (buscador, mercado, cuota) envíe sin querer el
    formulario completo de la apuesta — el único `type="submit"` de la
    página vive fuera de este componente.
  - **`FormularioApuesta.jsx`**: guarda los partidos confirmados en un
    array `bloques` (uno por partido, con su lista de mercados y su
    cuota), mostrados en la tarjeta "Apuesta en construcción" (partido +
    cuota + mercados en viñetas + botón "Quitar partido" cada uno, y
    "Cuota total combinada" = producto de la cuota de cada bloque). El
    botón final ("Crear apuesta" / "Guardar cambios" al editar) se
    deshabilita hasta que haya al menos un bloque. Al enviar, cada bloque
    se "aplana" a una selección por mercado (mismo formato que antes:
    `{evento, apuesta, cuota, pais, competicion, partidoId}`) — el primer
    mercado de cada bloque lleva la cuota real, el resto cuenta como 1 —
    así el cálculo de cuota total de la apuesta (`utils/apuestas.js`) no
    cambia ni falta ninguna migración de datos: una apuesta con un único
    bloque de un mercado se guarda exactamente igual que antes de este
    rediseño. Al editar una apuesta ya guardada, `bloquesDesdeApuesta`
    reconstruye los bloques agrupando selecciones consecutivas del mismo
    partido con cuota exactamente 1 (mismo criterio que ya usaba la v1
    para no romper combinadas antiguas con selecciones reales de cuota 1
    por casualidad — caso muy raro, se acepta el riesgo).
- **Dos mercados nuevos y desplegable de mercados en acordeón** (petición
  directa, misma sesión). `utils/mercados.js`: dentro de "Goles", justo
  después de "Ambos equipos marcan en la 2ª mitad: No", se añaden "Gol en
  ambas mitades: Sí" y "Gol en ambas mitades: No" (si hay gol en la 1ª Y en
  la 2ª mitad, sin importar qué equipo — distinto de "Ambos equipos
  marcan", que es sobre qué equipos marcan, no en qué mitad).
  `SelectorMercado.jsx` pasa de mostrar todas las categorías abiertas a la
  vez (panel largo, mucho scroll) a un acordeón: solo una categoría
  expandida cada vez (estado `categoriaAbierta`), tocar una cierra la que
  estuviera abierta y abre la nueva. Al abrir el desplegable, si la
  selección ya tenía un mercado elegido, arranca con la categoría de ese
  mercado ya expandida (para no esconder lo ya elegido). La cabecera de
  cada categoría sigue siendo `sticky top-0` dentro del panel, ahora
  también como botón clicable con su propio chevron. "Otro mercado" (al
  final del panel) pasa del estilo antiguo (texto normal, borde superior
  grueso) al mismo aspecto que las cabeceras de categoría (`bg-felt`,
  dorado, mayúsculas) pero sin chevron ni desplegarse — sigue siendo un
  botón que elige "Otro mercado" directamente al tocarlo, sin acordeón.
- **Editar un bloque ya guardado en el constructor de apuesta** (petición
  directa, misma sesión — caso real: una combinada con un "multi" de un
  partido donde luego resulta que un jugador de una de las selecciones no
  juega, así que hay que quitar esa selección y bajar la cuota conjunta).
  En la tarjeta "Apuesta en construcción" de `FormularioApuesta.jsx`, cada
  bloque con más de un mercado gana un botón "Editar apuesta" junto a
  "Quitar partido" (los picks simples, de un solo mercado, no lo llevan —
  para eso ya está "Quitar partido" entero). En modo edición, cada mercado
  del bloque muestra una "X" para quitarlo suelto y la cuota pasa a un
  campo editable; "Listo" cierra la edición y guarda la cuota nueva. Si se
  quita el único mercado que quedaba, el bloque entero desaparece solo. La
  cuota en edición se guarda en un estado de texto aparte
  (`cuotaEditando`), no en el número ya redondeado del bloque, para no
  interferir con la coma/punto decimal mientras se escribe — mismo motivo
  por el que `ConstructorPartido.jsx` ya usaba texto libre para sus cuotas.
- **Detalle de combinada agrupado por partido, y resultado por partido**
  (petición directa, misma sesión — el detalle de una combinada con varios
  "multi" se veía muy saturado, una fila suelta por mercado repitiendo el
  nombre del partido; y no había forma de marcar que una pata concreta ya
  se había ganado/perdido/anulado sin resolver toda la apuesta). Nueva
  `agruparSeleccionesPorPartido(selecciones)` en `utils/apuestas.js` (mismo
  criterio de agrupado que ya usaba `bloquesDesdeApuesta` en
  `FormularioApuesta.jsx` — selecciones consecutivas del mismo evento con
  cuota exactamente 1 son mercados extra del bloque anterior — ahora
  compartido entre los dos sitios en vez de duplicado) devuelve, por cada
  partido, su cuota, sus mercados y el índice de la selección "líder" (la
  que lleva la cuota real). `ApuestaItem.jsx` pinta cada partido como su
  propia caja (evento + cuota arriba, mercados en píldoras debajo) en vez
  de una lista plana.
  Cada caja gana botones Ganada/Perdida/Nula (mientras la apuesta entera
  siga Pendiente — igual que los botones de toda la apuesta) que marcan el
  resultado de ESE partido, independiente del resultado final de toda la
  combinada — pulsar el mismo botón otra vez lo vuelve a dejar en
  Pendiente. Se guarda en la propia selección líder (`resultado`, dentro
  del jsonb de `selecciones` — sin migración de esquema) vía la función
  nueva `marcarResultadoSeleccion(id, indice, resultado)` de
  `useApuestas.js`, que reescribe el array completo (no hay columna propia
  por selección). Importante: marcar un partido aquí **no** cambia
  automáticamente el resultado final de toda la apuesta (eso lo sigue
  decidiendo el usuario a mano con los botones de arriba) — es solo un
  seguimiento por partido, para no meterse en la complejidad de qué pasa
  con el freebet/seguro/cash out si se intentara automatizar también el
  resultado final.
  La excepción es "Nula": `calcularCuotaTotal` (`utils/apuestas.js`) ahora
  ignora en el producto las selecciones marcadas `resultado: "nula"` (como
  si su cuota fuera 1), así que anular un partido ajusta solo la cuota
  total real de la combinada — y por tanto el beneficio si se marca la
  apuesta como Ganada — sin tener que editar la cuota a mano como hasta
  ahora. Compatible con datos antiguos: las selecciones de apuestas ya
  guardadas no tienen `resultado`, así que no se descarta ninguna (se
  comportan exactamente igual que antes de este cambio).
  Rediseño completo del detalle (`ApuestaItem.jsx`), misma sesión — el
  primer intento con una caja por partido se veía saturado con combinadas
  grandes (9 selecciones), y el usuario pidió partir de una maqueta HTML
  de referencia en vez de seguir puliendo a ciegas. Cabecera con
  fecha/casa/deporte en una línea + badge de tipo ("Combinada · N
  selecciones" / "Simple"); resumen de 3 columnas (Stake, Cuota total,
  Ganancia potencial si está pendiente o Beneficio si ya se resolvió);
  lista de selecciones ligera con separadores finos en vez de tarjetas
  (punto de color según su estado, partido + competición/país, sus
  mercados en una sola línea separados por "·"); y al final, siempre
  visibles, tres botones grandes Ganada/Perdida/Nula para toda la apuesta
  y una fila con Cash Out/Eliminar apuesta.
  El botón "✎ Editar" de la cabecera (solo en combinadas) activa un modo
  de edición ligero — sin abrir el formulario completo — donde cada
  selección gana una "✕" para quitarla de la apuesta (nueva
  `quitarSelecciones(id, idsAQuitar)` en `useApuestas.js`, reescribe el
  array `selecciones` sin las que coincidan; nunca deja la apuesta sin
  ninguna) y un mini-selector Ganada/Perdida/Nula para marcar esa
  selección en concreto (reutiliza `marcarResultadoSeleccion`, ya
  existente). La maqueta no incluía ningún botón para editar fecha/casa/
  stake/etc. — se mantuvo igualmente un botón discreto "Editar todo" junto
  a "Eliminar apuesta" para no perder esa función del todo, ya que no
  había ningún otro sitio desde el que editar esos datos.
  El modal que abre el detalle (`ListaApuestas.jsx`) pasa de `max-w-3xl` a
  `max-w-xl`: el diseño anterior necesitaba ese ancho por su layout de
  escritorio en fila (`sm:flex-row`), que este rediseño ya no tiene — es
  una lista vertical siempre, se ve mejor más estrecha, tipo tarjeta.
  Ronda de ajuste tras probarlo con datos reales: "Combinada" pasa a
  contar partidos, no mercados sueltos — un "multi" de un solo partido con
  varios mercados (un bet builder) se veía como "Combinada · 4
  selecciones" cuando en realidad es 1 partido, y el mini-selector
  Ganada/Perdida/Nula por partido no aportaba nada ahí (ya es lo mismo que
  marcar la apuesta entera). `esCombinada` en `ApuestaItem.jsx` pasa a
  `gruposPartido.length > 1` (mismo cambio en `TarjetaApuestaResumen.jsx`
  y en el trofeo "Combinada ganadora" de `utils/trofeos.js`, con su
  descripción actualizada a "2 o más partidos"); el badge dice ahora
  "Combinada · N partidos". El botón "✎ Editar" y el aviso de ayuda pasan
  a depender de un criterio distinto, `hayVariosMercados` (más de una
  selección suelta, sea o no combinada), porque quitar mercados de un
  "multi" de un solo partido también hace falta aunque no sea combinada.
  Bug real corregido de paso: la única forma de quitar un mercado suelto
  de un "multi" (ej. "Luis Suárez anota 2+" si al final no juega) era
  "Editar todo" → abrir la selección → borrarla — demasiados pasos. Ahora,
  en modo edición, un partido con varios mercados los lista uno por línea
  con su propia ✕ (en vez de una única ✕ para todo el partido); la ✕ de
  todo el partido se queda solo para partidos de un único mercado. Nueva
  `quitarMercado` en `ApuestaItem.jsx` + `actualizarSelecciones(id, nuevasSelecciones)`
  en `useApuestas.js` (sustituye el array entero, a diferencia de
  `quitarSelecciones` que solo filtra por id): si el mercado quitado era
  el que llevaba la cuota real del grupo (el primero), esa cuota pasa al
  que quede primero, para no perder el valor combinado del resto.

## Tres funcionalidades pedidas (estadísticas por mercado, búsqueda, ranking por casa)

Petición directa de una tanda de 3 funcionalidades, a abordar en fases
separadas, probando cada una antes de pasar a la siguiente.

- **Fase A — Estadísticas por tipo de mercado** — ✅ hecho. Nueva
  `calcularEstadisticasPorMercado(apuestas)` en `utils/estadisticas.js`
  (mismo patrón que `calcularDesglosePorCasa`/`calcularDesglosePorDeporte`:
  agrupa y reutiliza `calcularEstadisticas` para cada grupo), agrupando por
  categoría de `CATEGORIAS_MERCADO` (`utils/mercados.js`: Resultado, Goles,
  Hándicap asiático...). Con varios mercados o partidos en la misma
  apuesta no tiene sentido repartir su stake/beneficio entre categorías,
  así que se atribuye entera a la categoría de la selección "líder": la
  primera del primer partido (`agruparSeleccionesPorPartido(...)[0]`,
  mismo criterio que ya usa esa función para la cuota real del bloque). Si
  el texto de esa selección no coincide con ningún mercado del catálogo
  (escrito a mano en "Otro mercado", o de apuestas de antes del
  desplegable), cuenta como "Otro mercado".
  - Nueva `buscarMercadoPorTexto(apuestaTexto, equipos)` en
    `utils/mercados.js`: dado el texto ya guardado de una selección y los
    equipos del partido, busca en el catálogo qué categoría+opción genera
    ese mismo texto. Se extrajo de `seleccionInicial` en
    `SelectorMercado.jsx` (que hacía exactamente esto para preseleccionar
    el mercado al editar una apuesta) para no duplicar la misma lógica.
  - En `EstadisticasDashboard.jsx`: un gráfico más "ROI por tipo de
    mercado" (reutiliza `GraficoBarraDivergente.jsx` tal cual, mismo
    patrón que "ROI por deporte"/"ROI por casa" — así ya usa
    `coloresGrafico.js` sin tocar nada) y, debajo, una tabla nueva
    (`TablaEstadisticasMercado.jsx`, mismo estilo de tabla que ya usaba
    `CuotasDialog.jsx`: filas alternas con `bg-paperDim`) con las columnas
    que pedía el usuario que el gráfico no puede enseñar a la vez
    (Apuestas, Stake, Beneficio, Yield, Acierto) — un gráfico de barras
    solo puede representar un número por categoría (aquí, el yield), así
    que hacía falta la tabla para el resto.
  - Se preguntó por reorganizar la entrada a Estadísticas (elegir "Casas"
    vs "Mercados" al entrar, en vez de todo en una sola página larga) —
    de momento se dejó como está: el patrón ya existente de la página
    (pastillas de casa + "Rango de fechas" arriba, y debajo todos los
    desgloses uno tras otro en scroll continuo — deporte, casa, cuota, y
    ahora mercado) ya convive bien con varios desgloses a la vez sin
    obligar a elegir uno. Si la página se nota demasiado larga una vez
    probada esta fase, valorar una navegación por pestañas en una fase
    aparte.
  - **Ajuste real tras probarlo**: `calcularEstadisticasPorMercado`
    atribuye cada apuesta entera a la categoría de su selección líder — el
    usuario detectó que esto esconde los mercados "secundarios" de una
    combinada o bet builder (p.ej. una apuesta con Resultado + Goles de un
    equipo + Córners contaba entera como "Resultado Final", sin rastro de
    los otros dos). Se decidió entre 3 opciones (dejarlo así; que la
    apuesta cuente en todas sus categorías, con el problema de que sumar
    la columna Beneficio ya no daría el beneficio real; o una tabla nueva
    de frecuencia sin dinero) y se eligió la tercera, para no falsear los
    números de dinero. Nueva `calcularFrecuenciaMercados(apuestas)` en
    `utils/estadisticas.js`: cuenta CADA selección de CADA apuesta por su
    categoría (no solo la líder), sin ningún dato de dinero — mostrada en
    `TablaFrecuenciaMercados.jsx` (barras horizontales simples, sin
    recharts ni `coloresGrafico.js`: son solo conteos, no hay
    positivo/negativo que colorear) debajo de la tabla de dinero en
    `EstadisticasDashboard.jsx`. La tabla de dinero
    (`TablaEstadisticasMercado.jsx`) no se toca, sigue siendo exacta.
  - **Filtro de bankroll en Estadísticas**: al probarlo con datos reales,
    el usuario notó que las apuestas de Entretenimiento (más
    experimentales, con varios mercados en la misma apuesta tipo bet
    builder) ensuciaban el desglose por mercado de sus apuestas "de
    verdad". `EstadisticasDashboard.jsx` gana una fila de pastillas nueva
    (Apuestas / Entretenimiento / Todas, mismo estilo que las pastillas de
    casa) que filtra `apuestas` antes de cualquier otro cálculo — por
    defecto en "Apuestas". No filtra `movimientos`: los movimientos son de
    la casa entera (ingresos/retiradas), sin columna `categoria` — Apuestas
    y Entretenimiento comparten el mismo dinero de cada casa, así que
    "Bankroll"/"ROI" del panel de KPIs y "ROI por casa" siguen combinando
    las dos categorías siempre, sea cual sea la pastilla elegida (mismo
    comportamiento que ya tenía el filtro de casa con estos dos KPIs).

- **Fase B — Búsqueda de texto libre en el historial** — ✅ hecho.
  `ListaApuestas.jsx` gana un campo de búsqueda (icono `Search`, mismo
  patrón que ya usa `Academia.jsx`: filtrado en vivo con cada tecla, sin
  botón de buscar) que coincide contra el evento o el mercado de
  CUALQUIER selección de la apuesta, no solo la líder — así buscar
  "Córners" encuentra también una combinada donde ese mercado es uno más
  entre varios. Solo se muestra cuando `agrupada` es `true` (el historial
  normal de Apuestas/Entretenimiento); en "Últimas apuestas"
  (`PantallaInicio.jsx`, `agrupada=false`, solo 5 apuestas) no aporta con
  tan pocas.
  Nuevo `utils/texto.js` con `normalizarTexto` (quita acentos, para que
  escribir sin tildes también encuentre resultados) — se extrajo de
  `BuscadorEvento.jsx` (que ya tenía exactamente esta función de forma
  local, sin exportar) para no duplicarla.

- **Fase C — Ranking de rendimiento por casa** — ✅ hecho.
  `ListadoCasas.jsx` reutiliza `calcularDesglosePorCasa` (`utils/apuestas.js`
  — ya calculaba `yieldPct` por casa, entre otras cosas, para un uso que no
  llegó a usarse aquí) en vez de reimplementar nada. Pastillas "Mejor
  rendimiento" (por defecto) / "Alfabético" arriba del listado, mismo
  patrón que el resto de filtros de la app; "Mejor rendimiento" ordena por
  `yieldPct` descendente, con las casas sin apuestas todavía al final (no
  aparecen en `calcularDesglosePorCasa`, que solo agrupa sobre apuestas
  existentes). El yield se muestra en dos sitios: una pastilla pequeña
  bajo el nombre de la casa en la cabecera siempre visible (verde/roja
  según signo, oculta si la casa no tiene ninguna apuesta) para que el
  orden se entienda de un vistazo sin tener que abrir cada tarjeta, y una
  columna más en la rejilla ya expandida (`Ingresos/Retiradas/Beneficio/
  ROI/Freebet` pasa a `sm:grid-cols-6` con "Yield" junto a "Beneficio",
  como pedía el usuario). Yield (beneficio/stake apostado) y ROI
  (beneficio/ingresos depositados) se quedan como dos columnas distintas
  a propósito — son fórmulas distintas que la app ya distinguía en
  Estadísticas, fusionarlas habría sido confuso.

- **Ronda de pulido sobre las 3 fases** (peticiones directas, misma
  sesión):
  - Las pastillas Apuestas/Entretenimiento/Todas de `EstadisticasDashboard.jsx`
    se veían casi idénticas a las de casa/rango justo debajo, demasiado
    pegadas — pasan a ser un control segmentado propio (`bg-paperDim`,
    contorno, botones dentro con `flex-1`, el activo en fondo felt) en vez
    de pastillas sueltas, con `pt-2` extra antes de la fila de casa/rango
    para separarlas visualmente. Es el filtro más importante de la página
    (decide qué bankroll se analiza entero), así que merecía destacar más
    que un filtro secundario.
  - "ROI por tipo de mercado" y "Estadísticas por tipo de mercado" (las dos
    vistas de dinero por mercado) se ocultan cuando `filtroBankroll` es
    "entretenimiento" — el motivo que las hizo confusas en primer lugar
    (bet builders con varios mercados a la vez, atribuidos enteros a un
    solo mercado líder) es sobre todo un problema de Entretenimiento.
    "Mercados más usados" (sin dinero, cuenta todos los mercados por
    igual) sigue viéndose en cualquier bankroll — nunca tuvo ese problema.
    En "Apuestas" y "Todas" las tres vistas se quedan igual que estaban.
  - Buscador de `ListaApuestas.jsx` más vistoso: de `border` recto a
    `border-2 rounded-full`, icono más grande (16→18) que se pone dorado
    con el foco (`group-focus-within:text-gold`), y un botón "✕" para
    vaciar la búsqueda de un toque en vez de borrar letra a letra —
    aparece solo si hay texto escrito.

- **Sello de resultado por partido en el detalle** (petición directa, con
  maqueta HTML de referencia). En `ApuestaItem.jsx`, cada partido con
  `colorResultado !== "pendiente"` gana un "sello" superpuesto: un tinte
  de color sólido (`TINTE_SELLO`, mismos tokens que `COLOR_PUNTO` pero
  como relleno) a opacidad 0.82 con desenfoque (`backdrop-blur-[3px]`), y
  encima la etiqueta GANADA/PERDIDA/NULA/CASH OUT grande y centrada
  (`font-display font-extrabold text-2xl`). Al pasar el ratón por encima
  (`group`/`group-hover` sobre el contenedor del partido): el texto
  desaparece del todo, se quita el desenfoque, y el tinte baja a 0.48 de
  opacidad — mismo color, deja leer el contenido de debajo sin perder la
  marca visual de si se ganó o se perdió. El sello lleva
  `pointer-events-none`, así que el mini-selector Ganada/Perdida/Nula de
  las combinadas (que vive dentro del mismo contenedor, debajo) se puede
  seguir pulsando a través suyo sin que el sello lo bloquee. Los partidos
  en "Pendiente" no llevan sello.
  Ajuste tras verlo con datos reales: el punto/cuota/botón "Nula" salían
  pegados al borde del tinte, porque el contenedor de cada partido no
  tenía padding horizontal propio — dependía del `px-3 sm:px-4` del
  contenedor de la lista, y el tinte (`absolute inset-0`) llega hasta el
  borde de su propio contenedor sin importar el padding de sus hijos. El
  padding horizontal se mueve del contenedor de la lista (que pasa a no
  tener ninguno) a cada fila de partido (`px-4 sm:px-5`, igual que la
  cabecera y el resumen de arriba, para que quede todo alineado al mismo
  margen) — así el tinte sigue llegando de borde a borde (a juego con los
  separadores entre partidos), pero el contenido de dentro ya no toca sus
  bordes.
  Segunda maqueta de referencia, misma sesión: el sello sube de opacidad
  0.82 a 0.90 y de `blur(3px)` a `blur(5px)` por defecto (no debe poder
  leerse nada de debajo hasta el hover), y el hover sigue bajando a 0.48
  sin desenfoque. La etiqueta pasa de una línea a dos: GANADA/PERDIDA/NULA
  grande arriba y, más pequeño y algo más tenue (`text-paper/90`), el
  nombre del partido de esa selección debajo — útil sobre todo en
  combinadas, para saber de un vistazo a qué partido corresponde ese
  sello sin tener que quitar el hover. El texto de estado suelto que
  vivía junto a la cuota (`GANADA`/`PERDIDA`/... en pequeño, con
  `COLOR_TEXTO`) se quita del todo — el sello ya lo cubre, era
  redundante; `COLOR_TEXTO` se borra de `ApuestaItem.jsx` por quedarse
  sin ningún punto de entrada.
  **Pendiente de decidir**: en móvil no hay hover, así que de momento el
  sello se queda fijo (no se revela nunca al tocar). Se planteó un
  "toque para alternar" (tap-to-toggle, replicando el hover con estado
  local por partido) como la opción recomendada frente a dejarlo siempre
  tapado — pero no se ha implementado todavía, a la espera de que el
  usuario lo confirme.
  Ronda de ajuste tras verlo con datos reales, misma sesión: dos bugs
  reales.
  - El desenfoque no ocultaba el texto de debajo del todo, aunque
    `blur(5px)` ya era el valor pedido. Causa: `backdrop-blur` y
    `opacity` estaban en el MISMO elemento — el navegador aplica el
    desenfoque y luego reduce la opacidad del resultado ya desenfocado
    como una capa, así que ese ~10% de opacidad restante dejaba pasar el
    contenido original SIN desenfocar por debajo (el blur nunca se
    "reaplica" al mezclar). Se separa en dos capas absolutas apiladas: una
    solo con `backdrop-blur` (sin opacity ni color, siempre al 100%) y
    otra encima solo con el color + opacity — así el contenido de detrás
    siempre pasa primero por el desenfoque antes de que el tinte decida
    cuánto se transparenta.
  - El sello ocupaba todo el ancho de la fila (a sangre completa, borde
    con borde con las líneas separadoras) — "muy forzado y feo" según el
    usuario, porque en la maqueta de referencia el sello llena toda la
    tarjeta, pero ahí la tarjeta ya es una tarjeta discreta con margen y
    esquinas redondeadas propias; en la app es una fila dentro de una
    lista continua sin margen ni esquinas. Las dos capas del sello pasan
    de `inset-0` a `inset-x-2 sm:inset-x-3 inset-y-1 rounded-xl`: deja un
    margen a los lados y arriba/abajo, con las esquinas redondeadas, para
    que se vea como una tarjeta flotando dentro de la fila en vez de un
    bloque de pared a pared — sin tocar el ancho/padding/márgenes del
    resto de la tarjeta de detalle, tal como pidió el usuario.

- **Cabecera por encima de los modales** (petición directa, misma
  sesión — detectado al probar el sello: con el detalle de una apuesta
  abierto, no había forma de tocar el interruptor de modo oscuro/claro ni
  "Cerrar sesión" sin cerrar antes el modal). Causa: el fondo oscuro de
  cualquier diálogo (`ConfirmDialog.jsx`, `ApuestaItem.jsx` vía
  `ListaApuestas.jsx`, `CashOutDialog.jsx`...) usa `fixed inset-0 ... z-50`
  — cubre toda la pantalla, cabecera incluida, y la cabecera (`App.jsx`)
  estaba a `z-30`, por debajo. El fondo oscuro en sí se mantiene (sirve
  para cerrar tocando fuera y centra la atención en el modal); la cabecera
  sube a `z-[60]` (por encima de cualquier `z-50`) para quedar siempre
  alcanzable, con o sin un modal abierto.
  Bug real de ese mismo cambio, detectado al probarlo: la cabecera ahora
  tapaba visualmente la parte de arriba del modal, que se veía "cortado"
  en línea recta justo debajo de la cabecera. Causa: el fondo de los
  diálogos sigue centrado en la pantalla ENTERA (`fixed inset-0` +
  `items-center`, sin saber nada de la cabecera), así que su caja seguía
  extendiéndose por debajo de la cabecera como siempre — solo que ahora,
  al estar la cabecera por encima en el z-index, esa parte se pintaba
  encima y tapaba el modal en vez de quedar oculta detrás de él. Los 5
  fondos de diálogo (`ConfirmDialog.jsx`, `CashOutDialog.jsx`,
  `CuotasDialog.jsx`, `BotonInfoConcepto.jsx`, el de `ApuestaItem.jsx` en
  `ListaApuestas.jsx`) pasan de `p-4` a `px-4 pb-4 pt-36 md:pt-20`: un
  hueco superior generoso (calculado a ojo a partir de la altura real de
  la cabecera en cada tamaño — banner grande en móvil, barra fina en
  escritorio) que empuja el modal entero por debajo de la cabecera, para
  que ya no se solapen. Los dos modales con altura máxima fija
  (`max-h-[90vh]` en el detalle de apuesta, `max-h-[80vh]` en
  `BotonInfoConcepto.jsx`) se recalculan a `max-h-[calc(100vh-10rem)]
  md:max-h-[calc(100vh-6rem)]` (mismos valores que el hueco superior + un
  margen inferior) para que sigan cabiendo enteros en el espacio que
  queda libre debajo de la cabecera, en vez de desbordar por abajo de la
  pantalla.

- **Cash Out en la misma fila, importe directo sin diálogo** (petición
  directa, misma sesión). En `ApuestaItem.jsx`, los botones de resultado
  de una apuesta pendiente pasan de 3+1 (Ganada/Perdida/Nula en una fila,
  Cash Out suelto debajo abriendo `CashOutDialog.jsx`) a una única fila de
  4 (`grid-cols-4`) con los nombres acortados ("Apuesta Ganada" → "Ganada",
  etc., para que quepan cuatro sin apretarse). Pulsar "Cash Out" no abre
  ya un modal aparte: revela un campo de importe + botón "Confirmar" justo
  debajo, en la propia tarjeta (mismo patrón que ya usaba el diálogo,
  trasladado a la tarjeta) — un segundo toque en "Cash Out" lo cierra sin
  guardar. `CashOutDialog.jsx` se borra por quedarse sin ningún punto de
  entrada.
  De paso, confirmado con el usuario que ya funcionaba sin tocar nada: si
  se marca un partido de una combinada como Nula con el mini-selector, la
  Cuota Total de arriba ya se recalculaba sola (`calcularCuotaTotal`
  ignora en el producto las selecciones `resultado: "nula"`) — llevaba
  implementado desde la fase "Detalle de combinada agrupado por partido,
  y resultado por partido", más arriba en este documento.

- **Icono de ojo por partido para revelar el sello en móvil** (petición
  directa, misma sesión). El sello de resultado por partido (ver más
  arriba) solo se revelaba con `group-hover`, que en móvil no existe de
  verdad — el usuario detectó que algunos navegadores simulan un ":hover"
  al tocar que se queda pegado de forma impredecible (hacía falta tocar
  OTRA apuesta para que se ocultara la primera). Primer intento: un único
  interruptor en la cabecera para toda la apuesta — el usuario aclaró que
  lo quería por partido (revelar el primero no debía afectar al segundo),
  así que se cambió antes de subirlo. `ApuestaItem.jsx` guarda
  `revelados` como un `Set` de `indiceLider` (no un booleano único) con
  `alternarRevelado(indiceLider)` para añadir/quitar; dentro del `.map` de
  partidos, `revelado = revelados.has(grupo.indiceLider)`. Cada partido ya
  resuelto (`colorResultado !== "pendiente"`) gana su propio icono
  `Eye`/`EyeOff` en la esquina superior derecha de su propia tarjeta
  (`absolute top-3 right-3`, con fondo `bg-black/15` para verse igual de
  bien tapado que revelado) — colocado DESPUÉS del sello en el JSX para
  pintar encima suyo sin necesitar z-index, y fuera de su
  `pointer-events-none` así que siempre es pulsable. Con `revelado` en
  `true` para ese partido se fuerza el aspecto "revelado" (texto oculto,
  sin desenfoque, tinte al 0.48) sin depender de hover; en `false`
  (por defecto), el hover de escritorio se conserva como atajo rápido de
  propina.
  Ronda de pulido en móvil, misma sesión: el ojo estaba demasiado pegado a
  la esquina de la tarjeta (`top-2 right-2` → `top-3 right-3`, con más
  margen aún en `sm:`). Y la fila Stake/Cuota total/Ganancia potencial se
  veía grande en pantallas estrechas — "Ganancia potencial" llegaba a
  partirse en dos líneas por falta de sitio. Las etiquetas ganan
  `whitespace-nowrap` y pasan de `text-xs` fijo a `text-[10px] sm:text-xs`
  (los valores de `text-base` a `text-sm sm:text-base`), y las propias
  etiquetas se acortan: "Cuota total" → "Cuota", "Ganancia potencial" →
  "Ganancia" (a juego con "Beneficio", que ya era una sola palabra) — así
  cada una cabe en una línea sin depender solo de bajar el tamaño de letra.
  Segunda vuelta: `top-3 right-3` seguía sin ser suficiente — con
  `rounded-xl` (radio de 12px) en la esquina del sello, el ojo quedaba
  parcialmente cortado por la propia curva de esa esquina, no solo cerca
  del borde recto. Sube a `top-4 right-5` (sin variante `sm:` aparte, ya
  vale para los dos tamaños) para quedar claramente dentro de la curva,
  no pegado a ella.
  Bug real detectado al usarlo: marcar un partido como Ganada/Perdida/Nula
  con el mini-selector (que vive dentro del mismo contenedor `relative
  group` que el sello) revelaba el sello sin haber tocado el ojo. Causa:
  el sello todavía llevaba clases `group-hover:` de refuerzo "por si acaso
  en escritorio" — en móvil, tocar el mini-selector disparaba un ":hover"
  simulado por el navegador sobre ese contenedor, que activaba esas
  mismas clases. Se quitan todas las `group-hover:` (y el propio `group`
  del contenedor, ya sin ningún punto de entrada): "revelado" —el ojo—
  pasa a ser la ÚNICA forma de revelar el sello, en cualquier
  dispositivo, sin ningún atajo de hover que pueda dispararse solo.

- **Cash out con beneficio o pérdida cuenta para la racha y el % de
  acierto** (petición directa, misma sesión, en dos pasos: primero solo
  el caso con beneficio para "Racha actual"; el usuario preguntó si
  también debía afectar al % de acierto, y de ahí cayó en la cuenta de
  que un cash out con pérdida debía contar como fallo, no como neutral).
  Dos funciones nuevas en `utils/apuestas.js`, hermanas:
  `cuentaComoGanada(apuesta)` (`true` si `resultado === "ganada"`, o cash
  out con `calcularBeneficio(apuesta) > 0`) y `cuentaComoPerdida(apuesta)`
  (`true` si `resultado === "perdida"`, o cash out con
  `calcularBeneficio(apuesta) < 0`). Solo el caso exacto de recuperar
  justo el stake (cash out con beneficio 0) se queda neutral, igual que
  una apuesta nula — ni acierto ni fallo. Sustituyen el
  `resultado === "ganada"`/`"perdida"` suelto en:
  - `calcularRachaActual` y `calcularEstadisticas` (`aciertoPct` —
    numerador y qué apuestas cuentan como "decididas" en el denominador)
    en `utils/apuestas.js`.
  - `calcularRachas` (`utils/estadisticas.js`, mejor racha Y peor racha
    del histórico — antes solo la mejor racha usaba el criterio nuevo).
  - `calcularMejorRacha`, `hayRemontada` y `aciertoPerfecto`/`decididas`
    (`utils/trofeos.js`), para que los trofeos "X victorias seguidas",
    "El fénix" y "Perfeccionista" cuenten igual que "Racha actual" y el
    % de acierto de Estadísticas, sin desincronizarse.
  No se tocó `ganadas` en `construirContexto` (trofeos.js) — esa sigue
  siendo solo victorias literales, porque los trofeos de cuota acertada,
  combinada ganada y beneficio de freebet no tienen sentido aplicados a
  un cash out (no hay una cuota "acertada" ni una freebet jugada hasta
  el final).

- **Calendario de actividad por beneficio, no por volumen** (petición
  directa, misma sesión). `CalendarioActividad.jsx` pintaba cada día como
  un mapa de calor dorado según el NÚMERO de apuestas de ese día (estilo
  GitHub); pasa a colorear según el BENEFICIO neto del día (suma de
  `calcularBeneficio` de sus apuestas, pendientes incluidas — aportan 0):
  verde con beneficio, rojo con pérdidas, y un tercer color neutral
  (`bg-void`, el mismo tono ya usado para "Nula"/archivado) si el día
  tiene apuestas pero se queda justo en 0€ (p.ej. solo pendientes, o
  ganancias y pérdidas que se cancelan) — distinto del gris de "sin
  apuestas ese día", para que se note la diferencia entre "no jugué" y
  "jugué y quedé en tablas". Se quitan `nivelIntensidad`/`CLASES_NIVEL`
  (la lógica de intensidad por volumen, sin uso ya) y se añade una
  leyenda de 3 colores debajo del calendario. El tooltip de cada día
  (`title`) ahora incluye también el beneficio del día, no solo el
  número de apuestas.

- **Desglose de beneficio/yield por bankroll en Inicio — probado y
  descartado** (petición directa, misma sesión): se probaron dos
  versiones (líneas pequeñas bajo el KPI; luego tarjetas propias de
  Beneficio/Yield con desglose de dos columnas, estilo "Bankroll total"
  de Casas de apuestas) pero al verlas el usuario prefirió volver al
  diseño original de siempre (una sola fila de 4 KPI combinados: Bankroll
  total, Beneficio, Yield, Racha actual, sin desglose por bankroll).
  `PantallaInicio.jsx` queda sin cambios respecto a antes de esta ronda.

- **Bankroll separado de verdad por Apuestas/Entretenimiento** (no era una
  fase del guion, petición directa tras la ronda anterior). El usuario
  aclaró su intención real: pretende usar las mismas casas — Bet365,
  Winamax, Codere — tanto para Apuestas como para Entretenimiento, así que
  el "truco" de usar nombres de casa distintos por bankroll no le sirve, y
  sin más información no hay forma de saber cuánto del dinero de una casa
  es de cada bankroll. Solución de fondo en vez del atajo visual de antes:
  `movimientos` gana su propia columna `categoria` (igual que ya tenía
  `apuestas`), así que ahora sí se puede calcular un bankroll real y
  separado por casa y por bankroll.
  - **Supabase**: `alter table public.movimientos add column categoria
    text check (categoria in ('apuestas', 'entretenimiento'));` — sin
    valor por defecto ni migración de datos: el usuario solo tenía 3
    movimientos registrados, así que optó por borrarlos y volver a meterlos
    con el selector nuevo en vez de adivinar a qué bankroll pertenecía cada
    uno. Los movimientos sin categoría (los borrados, o cualquiera futuro
    sin asignar) simplemente no cuentan en ningún bankroll filtrado — solo
    en el total combinado de siempre.
  - `useMovimientos.js`: `categoria` en `desdeFila` y en `agregarMovimiento`
    (que ahora la recibe y la guarda). No hay `editarMovimiento`, así que no
    hizo falta tocar nada más ahí.
  - `FormularioMovimiento.jsx` gana un selector "Bankroll" (Apuestas/
    Entretenimiento, por defecto Apuestas) — hacía falta preguntarlo,
    porque a diferencia de `FormularioApuesta.jsx` (que ya sabe en qué
    bankroll está por la sección activa), este formulario vive dentro de
    Casas de apuestas, que no está ligada a ningún bankroll.
    `MovimientoItem.jsx` muestra la categoría como una pastilla más, junto
    a Ingreso/Retirada.
  - `calcularBankrollPorCasa` (`utils/movimientos.js`) gana un tercer
    parámetro opcional `categoria`: sin él, sigue devolviendo el bankroll
    combinado de toda la vida (así no hizo falta tocar `PantallaInicio.jsx`
    ni `EstadisticasDashboard.jsx`, que siguen queriendo el total
    combinado); con él, filtra movimientos y apuestas por esa categoría
    antes de sumar.
  - `ListadoCasas.jsx`: el bloque "Bankroll total" de arriba gana una
    segunda fila (Bankroll Apuestas / Bankroll Entretenimiento, dinero
    real). Cada tarjeta de casa, en la cabecera cerrada, cambia su único
    "Bankroll" por dos valores más pequeños lado a lado (Apuestas /
    Entret.); al abrirla, la fila combinada de Ingresos/Retiradas/
    Beneficio/Yield/ROI/Freebet se convierte en dos filas, una por
    bankroll, sacadas a un componente nuevo `FilaBankroll` para no
    triplicar el JSX (el Freebet de cada fila se separó también, ver más
    abajo).
  - `FormularioApuesta.jsx` gana un prop `categoria` (opcional): al crear
    una apuesta nueva, `App.jsx` le pasa la sección activa
    (`seccionActiva`); al editar una ya existente, usa la propia categoría
    guardada de la apuesta (`apuestaInicial.categoria`) en vez del prop —
    nunca se cambia de bankroll editando. El aviso de "Dinero real
    disponible" pasa a comprobar el bankroll de esa categoría en esa casa,
    no el combinado — para avisar de verdad de si hay fondos en el
    bankroll correcto, no en la suma de los dos.
  - **Pendiente**: ejecutar el `alter table` de Supabase, borrar los 3
    movimientos ya registrados y volver a meterlos con el bankroll
    correcto antes de dar esto por probado.
  - Al probarlo, el usuario detectó de paso que ya no existe ningún "aviso
    de bono pendiente" al añadir un "Otro bono" — no es un fallo: ese
    sistema (`bonos_pendientes`, `AvisoBonos.jsx`) se eliminó a propósito
    hace unas fases, sustituido por la suma directa al saldo de freebet
    (ver "Bonos pendientes — eliminado por completo" más arriba). También
    se confirmó que borrar una apuesta de freebet ya resuelta no devuelve
    el saldo (solo se devuelve si estaba Pendiente o se marca Nula, regla
    ya existente) — comportamiento esperado, no un bug.

- **Freebet separado también por bankroll** (petición directa, misma
  sesión, tras la del dinero real de arriba: mismo motivo — un freebet de
  una promo de Entretenimiento no debería poder gastarse sin querer en
  Apuestas). `casas.freebet_saldo` (un único número por casa) se sustituye
  por dos columnas, `freebet_saldo_apuestas` y
  `freebet_saldo_entretenimiento` — sin migrar el valor antiguo (el
  usuario solo tenía 2€ sueltos de una prueba, los volvió a meter a mano
  con el selector nuevo); `freebet_saldo` se queda en la tabla sin usar,
  mismo criterio que con `promociones`/`bonos_pendientes`.
  - `useCasas.js`: `desdeFila` expone `freebetSaldoApuestas` y
    `freebetSaldoEntretenimiento` en vez de un único `freebetSaldo`.
    `ajustarSaldoFreebet(nombre, delta, categoria)` gana un tercer
    parámetro (por defecto `"apuestas"` si no se indica, por seguridad) que
    decide qué columna/campo tocar — nueva `camposFreebet(categoria)`
    interna para no repetir el mismo `if/else` en cada sitio de este hook
    que toca el saldo.
  - Los 4 disparadores automáticos en `App.jsx` (crear apuesta Freebet,
    seguro perdido, nula que devuelve el freebet, borrar una Freebet
    pendiente) ya tenían a mano la categoría de la apuesta implicada
    (`apuesta.categoria` o `seccionActiva`), así que solo hizo falta
    añadirla a la llamada — sin lógica nueva.
  - `FormularioMovimiento.jsx` reutiliza su propio selector de bankroll
    (ya añadido en la fase anterior) también para el "Bono recibido con
    este depósito": no hacía falta preguntarlo dos veces, el bono es del
    mismo bankroll que el ingreso. `FormularioBono.jsx` ("Otro bono"), que
    no está ligado a ningún ingreso, gana su propio selector Apuestas/
    Entretenimiento (por defecto Apuestas).
  - `FormularioApuesta.jsx`: el aviso de "Freebets disponibles" pasa a
    mirar el campo de freebet de la categoría en la que se está creando la
    apuesta (`categoriaEfectiva`, la misma variable que ya se usaba para
    el dinero real), no un valor combinado.
  - `ListadoCasas.jsx`: `FilaBankroll` gana una sexta columna (Freebet)
    con el valor de esa categoría — la fila de Ingresos/Retiradas/
    Beneficio/Yield/ROI/Freebet queda así completa por bankroll, ya no
    hace falta un bloque de Freebet aparte sin repartir. El "Freebets" del
    gran total de arriba sigue combinado (suma de las dos columnas nuevas).
  - **Pendiente**: ejecutar los dos `alter table` de Supabase, y volver a
    registrar el freebet de 2€ (bankroll Entretenimiento) con el
    formulario nuevo antes de dar esto por probado.
  - Bug real de esta misma fase, detectado al probarlo: la columna nueva
    "Bankroll Apuestas"/"Bankroll Entretenimiento" del gran total de
    arriba solo sumaba dinero real, sin freebets — con un freebet de 2€ en
    Entretenimiento y nada de dinero real, esa fila mostraba "0,00€" en
    las dos, que no cuadraba con los "2,00€" de "Freebets" en la fila de
    arriba. El usuario propuso el arreglo: en vez de una fila suelta de
    dinero real por bankroll, cada bankroll (Apuestas/Entretenimiento)
    pasa a tener su propia tarjeta completa — mismo formato que "Bankroll
    total" (total grande arriba, Dinero real/Freebets debajo) — así cada
    una "cuadra" por sí sola. Nuevo componente `TarjetaBankroll`
    (`etiqueta`, `dineroReal`, `freebets`, `grande` opcional) para no
    triplicar esa tarjeta a mano; `freebetsTotal` se separa en
    `freebetsTotalApuestas`/`freebetsTotalEntretenimiento` (sumando
    `casa.freebetSaldo*` de todas las casas) en vez de un único valor
    combinado.
  - **`TarjetaBankroll` también arriba de Apuestas/Entretenimiento**
    (petición directa, misma sesión — retoma algo que se había descartado
    antes de esta fase: "no lo metería, el bankroll es dinero compartido
    entre las dos categorías, saldría el mismo número en las dos
    secciones"; ahora que sí hay un bankroll propio por categoría, ese
    motivo ya no aplica). `TarjetaBankroll` se saca de `ListadoCasas.jsx`
    a su propio archivo (ya se usaba en tres sitios de esa pantalla: total,
    Apuestas y Entretenimiento). `App.jsx` calcula `bankrollCategoria`
    (`calcularBankrollPorCasa(movimientos, apuestas, seccionActiva)`
    sumado) y `freebetsCategoria` (suma de
    `casa.freebetSaldoApuestas`/`freebetSaldoEntretenimiento` según
    `seccionActiva`).
    Ronda de ajuste tras probarlo: la tarjeta empezó dentro del bloque
    "lista" (junto a `RachaActual`/`ObjetivoPersonal`), pero ese bloque se
    oculta en móvil mientras se está en el formulario ("+"), así que no se
    veía al crear una apuesta — justo cuando más falta hace saber el
    bankroll disponible. Se saca de los dos bloques ("formulario" y
    "lista", que se ocultan el uno al otro según `mostrandoFormulario`) a
    su propio sitio, visible siempre en cualquier vista. De paso, las dos
    tarjetas "Bankroll Apuestas"/"Bankroll Entretenimiento" que se habían
    añadido en `ListadoCasas.jsx` se quitan de ahí — quedaban redundantes
    ahora que ya se ven en su sección correspondiente; "Bankroll total"
    (combinado) se queda, es el único sitio que lo enseña.

- **Ampliación grande del catálogo de mercados, y 10 ligas nuevas**
  (petición directa, misma sesión). `utils/mercados.js` gana 9 categorías
  nuevas en `CATEGORIAS_MERCADO` (mismo patrón que las ya existentes:
  funciones generadoras + líneas Over/Under donde aplica):
  - **Tarjetas** (total 0.5-6.5, por equipo — mismas líneas que el total,
    igual que ya hacía "Goles por equipo" —, "Primera tarjeta: Local/
    Visitante", "Ambos equipos reciben tarjeta: Sí/No").
  - **Córners por equipo** (Local/Visitante, mismas líneas que "Córners"
    ya existente, más por mitad 1ª/2ª — líneas propias más cortas,
    `LINEAS_CORNERS_MEDIO`, interpretación del pedido igual que ya pasó
    con las líneas del total).
  - **Goles por equipo por mitad** (Local/Visitante, 1ª/2ª mitad,
    `LINEAS_GOLES_MEDIO`) — categoría separada de "Goles por equipo"
    (partido completo) a propósito. A diferencia de
    `opcionesGolesMedioTiempo` (que no menciona la mitad en el texto, sin
    ambigüedad porque no compite por nombre de equipo con nada más), aquí
    el texto sí dice "1ª mitad"/"2ª mitad" explícitamente — si no,
    "Goles Madrid: Over 1.5" del partido completo y de una mitad
    generarían el mismo texto y no habría forma de distinguirlos al
    editar (mismo criterio que ya usaba "Ambos equipos marcan en la 1ª
    mitad").
  - **Resultado exacto**: las 25 combinaciones de 0-0 a 4-4, más "Otro
    resultado" para cualquier marcador fuera de ese rango.
  - **Equipo — mayor número**: de córners, tarjetas, remates y remates a
    puerta, cada uno con Local/Visitante/Igualados.
  - **Mitad con más goles**: 1ª mitad/2ª mitad/Igualadas.
  - **Margen de victoria**: Local o Visitante gana por 2+/3+/4+/5+ goles.
  - **Especiales**: gana una mitad, gana las dos mitades, anota en una
    mitad, anota en las dos mitades, gana a cero, gana remontando — cada
    uno con Local/Visitante.
  - **Jugador**: a diferencia de todo lo anterior, el texto final no se
    puede generar solo con los equipos del partido — hace falta también
    el jugador, elegido en un desplegable propio alimentado por la API
    (ver más abajo). Los 12 mercados (Anota un gol, Anota 2+ goles, Da una
    asistencia, Remates a puerta +0.5/+1.5/+2.5, Remates totales +0.5/
    +1.5/+2.5, Falta cometida, Falta recibida, Recibe tarjeta) se guardan
    como plantillas (`PLANTILLAS_JUGADOR`, con un `sufijo` de texto en vez
    de un texto completo) sin ningún nombre de jugador hardcodeado. La
    categoría lleva una marca `requiereJugador: true` que
    `SelectorMercado.jsx` usa para pintar una UI especial en vez de la
    lista de botones normal. `interpretarMercadoJugador(texto)` hace el
    camino inverso (separa jugador + plantilla a partir del texto ya
    guardado, comprobando el sufijo) para poder preseleccionar los dos
    campos al editar una apuesta ya creada con este tipo de mercado — el
    `buscarMercadoPorTexto` genérico nunca los reconocería, porque no
    puede generar ese texto sin saber el jugador de antemano.
  - **Desplegable de jugador y su plumbing de datos** (la parte más
    grande de esta fase): igual que api/partidos.js, la key de
    API-Football es secreta, así que hizo falta una segunda Serverless
    Function, `api/jugadores.js` (`GET /players/squads?team=ID`), y un
    hook `usePlantilla.js` (mismo patrón que `usePartidos.js`, pero
    cacheado por equipo en vez de por fecha, sin lógica de "fuera de
    rango" — una plantilla apenas cambia entre visitas, así que no hace
    falta refrescarla a diario). Para poder llamar a ese endpoint hacía
    falta el id numérico de cada equipo, que la app no guardaba en
    ningún sitio (solo nombres, vía el texto de "Evento") — `api/
    partidos.js` ahora añade `equipoLocalId`/`equipoVisitanteId` a cada
    partido devuelto (ya venían en la respuesta de API-Football, no
    costó ninguna llamada extra), y esos dos ids se guardan igual que ya
    se guardaba `partidoId`: `ConstructorPartido.jsx` los lleva en su
    estado `partido`, `FormularioApuesta.jsx` los lleva en cada
    `bloque` y los guarda en cada selección al enviar, y
    `agruparSeleccionesPorPartido` (`utils/apuestas.js`) los reconstruye
    al editar. Las apuestas de antes de esta fase, o con el evento
    escrito a mano, no tienen estos ids — en ese caso
    `SelectorMercado.jsx` cae a un campo de texto libre para el nombre
    del jugador en vez del desplegable (nunca bloquea, mismo criterio que
    el resto del buscador de partidos). Cuando sí hay plantilla, el
    desplegable (`SelectorDesplegable.jsx` reutilizado, con un grupo por
    equipo) alimenta un único campo de texto (`jugadorTexto`) que se
    combina con la plantilla elegida al pulsar uno de los 12 botones de
    mercado — deshabilitados hasta que hay un jugador elegido.
  - **Ligas nuevas conectadas al buscador de partidos**: Austria
    (Bundesliga austríaca, id 218), Dinamarca (Superliga, id 119), Suiza
    (Super League, id 207), Turquía (Süper Lig, id 203), Noruega
    (Eliteserien, id 103), Suecia (Allsvenskan, id 113), Argentina (Liga
    Profesional, id 128), Brasil (Brasileirão Série A, id 71), México
    (Liga MX, id 262) y Estados Unidos (MLS, id 253) — de 22 a 32
    competiciones en `api/partidos.js` (`LIGAS`) y `utils/
    ligasConectadas.js` (`PAISES_CONECTADOS`). Verificadas una a una por
    curl directo contra la API (no en el dashboard web, más rápido y
    igual de fiable) el 2026-08-10: primero se confirmó el id numérico
    correcto de cada una (`GET /leagues?country=X`, comparando el nombre
    exacto de la competición, no solo el país — Argentina y Brasil tienen
    decenas de competiciones menores con nombres parecidos). Después se
    comprobó cobertura real en el plan gratuito con el mismo patrón de
    consulta que usa la app de verdad (`GET /fixtures?date=X`, no
    `league=`/`season=`/`next=`, que tienen restricciones de plan
    totalmente distintas y no representan lo que hace `api/partidos.js`):
    8 de las 10 aparecieron directamente en los 3 días permitidos por el
    plan gratuito alrededor de esa fecha; Turquía y México no tenían
    partido en ninguno de esos 3 días concretos (no una restricción de
    plan), así que se confirmaron aparte con una consulta histórica
    dentro del rango que sí permite el plan gratuito (`season=2023`, con
    resultados reales para las dos). Las 10 pasaron la comprobación, así
    que no hubo ninguna que dejar fuera. Los dos nuevos grupos del
    desplegable de País en `BuscadorEvento.jsx` — "Resto de Europa" (los
    6 países europeos) y "Sudamérica y Norteamérica" (los 4 restantes) —
    evitan agrandar "Grandes ligas" o el "Europa" ya existente
    (Portugal/Holanda/Bélgica), con sus arrays de agrupación
    (`PAISES_GRUPO_RESTO_EUROPA`, `PAISES_GRUPO_AMERICA`) en `utils/
    ligasConectadas.js` junto al `PAISES_GRUPO_EUROPA` que ya había.
  - **Pendiente**: probar el buscador de partidos con `vercel dev` (no
    `npm run dev`, que no sirve las Serverless Functions) para confirmar
    en local que el desplegable de jugador trae datos reales de al menos
    un partido conectado, antes de dar la fase por probada.
  - **Orden de las categorías** (petición directa, misma sesión): el
    orden de `CATEGORIAS_MERCADO` en `utils/mercados.js` (que es el orden
    del acordeón en `SelectorMercado.jsx`) pasa a ser el pedido por el
    usuario, de lo más general a lo más específico — Resultado Final,
    Resultado Exacto, Margen de victoria, Resultado al descanso,
    Resultado Descanso/Final, Jugador, Goles, Goles 1ª mitad, Goles 2ª
    mitad, Goles por equipo, Goles por equipo por mitad, Mitad con más
    goles, Hándicap asiático, Córners, Córners por equipo, Tarjetas,
    Equipo — mayor número, Especiales. "Otro mercado" no forma parte de
    este array (es el botón fijo al final del desplegable), así que no
    hizo falta tocarlo.

- **Rediseño del selector de mercado y del buscador de partido: buscador +
  pestañas, cascada progresiva, y colapso del bloque superior del
  formulario** (petición directa, misma sesión, a partir de tres maquetas
  HTML interactivas de referencia que trajo el usuario). Los dos
  desplegables propios que ya existían (`SelectorMercado.jsx` con acordeón
  de categorías, `BuscadorEvento.jsx` con dos `SelectorDesplegable` para
  País/Competición) se sustituyen por un patrón nuevo, compartido entre
  los dos: buscador de texto libre arriba + pestañas horizontales con
  scroll debajo. Los dos dejan de ser un desplegable que se abre/cierra
  (sin `abierto`, sin "click fuera cierra", sin `usePosicionDesplegable`)
  y pasan a ser un panel siempre visible en línea — más simple de usar, y
  tiene sentido ahora que el bloque superior del formulario ya no ocupa
  sitio de forma permanente (ver más abajo).
  - **`TabsDesplazables.jsx`** (nuevo, compartido): fila de pestañas con
    scroll horizontal, desvanecido sutil (`bg-gradient-to-r`) en el borde
    derecho, y flechas ‹ › que solo se pintan con ratón de verdad. Como
    Tailwind no tiene un variante nativo para `@media (hover:hover) and
    (pointer:fine)`, se centralizó en dos clases CSS en `index.css`
    (`.mq-solo-raton`, `.mq-oculto-raton`) en vez de repetir el variante
    arbitrario `[@media(hover:hover)_and_(pointer:fine)]:` en cada sitio
    — las usan tanto las flechas como la bandera de país (ver abajo).
    `colorActivo` ("felt" por defecto, "gold" para mercado) para que la
    pestaña activa combine con el resto de la pantalla donde se use.
  - **`SelectorMercado.jsx`**: buscador arriba (filtra las opciones de
    TODAS las categorías a la vez, agrupadas con su cabecera — salvo
    "Jugador", que no tiene texto real sin elegir antes un jugador) +
    `TabsDesplazables` con una pestaña por categoría más "Otro mercado" al
    final. Sin texto de búsqueda, la pestaña activa decide qué lista de
    opciones se ve (filas compactas con check dorado a la derecha si están
    elegidas). La categoría "Jugador" sigue teniendo su UI especial
    (desplegable de jugador + los 12 mercados) dentro de su propia
    pestaña, sin cambios de fondo respecto a la fase anterior. Encima de
    todo, si ya hay un mercado elegido, se ve como una píldora dorada
    (antes era el texto del botón cerrado del desplegable).
  - **`BuscadorEvento.jsx`**: incluso más simplificado, porque aquí el
    buscador de texto libre ES el propio campo "Evento" (no una copia
    aparte) — escribir algo busca en TODOS los partidos conectados de la
    fecha (de cualquier país/competición) y agrupa por competición, ignora
    a propósito qué pestaña de país esté activa (igual que hace la
    maqueta de referencia). Sin texto, aparece una cascada estricta: país
    (pestañas, con `BANDERAS_PAIS` nuevo en `utils/ligasConectadas.js` —
    la bandera solo se ve en táctil, `.mq-oculto-raton`, porque algunas
    versiones de Windows no renderizan bien los emoji de bandera
    compuestos) → competición (chips, solo si ese país tiene datos
    conectados) → partidos de esa competición — cada bloque solo se pinta
    cuando el paso anterior ya está completo, sin ningún texto de relleno
    de por medio. Elegir un país reinicia competición Y el texto ya
    escrito (`onCambiar("")`), para no dejar una combinación a medias —
    mismo comportamiento que la maqueta. "Otras ligas" se queda sin
    cascada (no hay datos conectados): el buscador de arriba, ya con
    placeholder de escribir a mano, es lo único que hace falta. Con esto,
    los dos `<select>` de País/Competición desaparecen del todo, así como
    los grupos `PAISES_GRUPO_EUROPA`/`PAISES_GRUPO_RESTO_EUROPA`/
    `PAISES_GRUPO_AMERICA` de `ligasConectadas.js` (sin uso ya: las
    pestañas van en una sola fila plana, sin cabeceras de grupo).
  - **`FormularioApuesta.jsx`**: el bloque superior (Fecha, Casa,
    Cantidad, Deporte, Tipo de fondos, Apuesta asegurada, Aumento de
    cuota) gana un botón "Confirmar →" al final (deshabilitado hasta que
    haya casa y cantidad), que lo colapsa en una tira resumen ("09/08/2026
    · Bet365 · 10,00€ · Real · Fútbol") con un "✎ Editar" para reabrirlo.
    Dos estados separados a propósito: `bloqueSuperiorAbierto` (si se ve
    el formulario completo o la tira) y `confirmado` (si la sección
    "Selecciones" ya está desbloqueada) — reabrir con "✎ Editar" solo
    toca el primero, así que las selecciones ya añadidas no desaparecen
    mientras se corrige un dato de arriba. Antes de confirmar, en el
    sitio de "Selecciones" se ve un aviso ("Confirma los datos de arriba
    para empezar a añadir partidos") en vez de `ConstructorPartido` — al
    editar una apuesta ya existente, `confirmado` arranca en `true`
    (datos ya completos, no tiene sentido pedir confirmarlos otra vez) y
    el bloque superior arranca colapsado.
  - **Bug real encontrado en revisión de código, antes de compilar**:
    `puedeConfirmar` (el cálculo que activa el botón "Confirmar") usaba
    `stakeNumero` en la línea donde se declaraba el nuevo estado, pero
    `stakeNumero` no se declaraba hasta más abajo en el componente —
    error de "temporal dead zone" de JavaScript (acceder a un `const`
    antes de su propia declaración), que `npx vite build` NO detecta (es
    un fallo en tiempo de ejecución, no de compilación) pero sí habría
    roto la página en el navegador. Se corrigió subiendo la declaración
    de `stakeNumero` a justo después de los `useState`, antes de
    calcularse `puedeConfirmar`.
  - **Bug real encontrado por el usuario al probarlo**: al elegir un
    mercado o un partido, el panel entero (buscador + pestañas + lista)
    se quedaba abierto — no había ninguna señal de que la elección se
    hubiera aplicado, y ocupaba sitio de sobra. Confirmado con el usuario
    (con `AskUserQuestion`) que el arreglo debía ser el mismo patrón que
    el bloque superior de `FormularioApuesta.jsx` recién hecho: colapsar
    tras elegir. `SelectorMercado.jsx` y `BuscadorEvento.jsx` ganan un
    estado `expandido` (arranca en `true` si no había valor guardado,
    `false` si ya lo había, p.ej. al editar una selección ya creada);
    elegir una opción de la lista (o un partido) lo pone en `false` y
    colapsa el panel a una píldora dorada con lo elegido + un enlace
    "Cambiar mercado"/"Cambiar partido" que lo vuelve a abrir — mismo
    lenguaje visual que la tira resumen del bloque superior ("✎ Editar").
    Los dos campos de texto libre que no pasan por una lista clicable
    ("Otro mercado" en `SelectorMercado.jsx`, el modo "Otras ligas" en
    `BuscadorEvento.jsx`) no se colapsan solos al escribir (no tendría
    sentido cerrar el campo en cada tecla): ganan un botón "Listo"
    (deshabilitado hasta que hay texto) para colapsar a mano cuando se
    termina de escribir.
  - **Marcador final con caché compartida y permanente en Supabase**
    (petición directa, misma sesión — sustituye el diseño anterior de
    `EtiquetaPartidoEnVivo`, que llamaba a `api/partido.js` una vez por
    partido y por SESIÓN de navegador, sin compartir nada entre
    dispositivos ni usuarios). Nueva tabla `resultados_partidos` en
    Supabase (`partido_id` como clave primaria, `estado`/`goles_local`/
    `goles_visitante`, sin `user_id` — es una caché de datos públicos del
    partido, no información personal, así que cualquier usuario
    autenticado de la app la lee y escribe sin distinción) — **sin
    caducidad a propósito**, a diferencia de la caché de fixtures del día:
    un resultado final no cambia nunca una vez el partido termina.
    `usePartidoInfo.js` cambia de "una única petición por partido y
    sesión" a un flujo de tres pasos: 1) si el partido no debería haber
    terminado todavía (hora de inicio + 2,5h sin pasar), no se consulta
    nada, ni siquiera Supabase — nadie podría tener ya un resultado final
    guardado; 2) si ya debería haber terminado, se mira primero
    `resultados_partidos` (lectura normal de Supabase, gratis) — si ya
    está, se usa directo, cero llamadas a API-Football; 3) solo si tampoco
    está en Supabase, se hace la única llamada a `api/partido.js`, y si el
    estado devuelto ya es "terminado" (FT/AET/PEN/...) se guarda en
    `resultados_partidos` para que cualquier visita futura (tuya, de tu
    amigo, de otra pestaña) lo lea sin gastar nada. Con esto, cada partido
    de fútbol apostado en la vida de la app gasta como mucho 1 llamada a
    la API, una única vez, para siempre — no 1 por sesión de cada persona
    que mire el detalle, que era el diseño anterior.
    Para saber "hora de inicio + 2,5h" hacía falta la hora de inicio de
    cada partido, que hasta ahora no se guardaba en ningún sitio (solo
    vivía de forma efímera en `BuscadorEvento.jsx` mientras se elegía el
    partido). `hora` (HH:MM, ya en hora de España) se añade al mismo
    "pipeline" que ya llevaban `partidoId`/`equipoLocalId`/
    `equipoVisitanteId`: `ConstructorPartido.jsx` la guarda en su estado
    `partido` al elegir uno del buscador, `agruparSeleccionesPorPartido`
    (`utils/apuestas.js`) la expone en cada grupo, y las dos listas
    blancas de `useApuestas.js` (`agregarApuesta`/`editarApuesta`) la
    guardan sin tocar el resto. De paso, `EtiquetaPartidoEnVivo` deja de
    depender de la API para mostrar la HORA (antes esperaba la respuesta
    de `usePartidoInfo` incluso para ese dato tan simple, que ya se sabía
    sin llamar a nada): ahora la pinta directo desde `grupo.hora`, y solo
    usa `usePartidoInfo` para el marcador final. Las selecciones de antes
    de esta fase (sin `hora` guardada) no tienen forma de saber si el
    partido ya terminó, así que consultan siempre — caso raro y
    autolimitado, ya que todas las apuestas nuevas guardan la hora.
    **Pendiente**: ejecutar el `create table resultados_partidos` (con su
    política de RLS) de `supabase-setup.sql` en el SQL Editor de Supabase
    antes de que este marcador funcione en producción.
  - **Pendiente**: probar de verdad en el navegador (con `vercel dev`,
    para que el buscador de partidos y el de jugador tengan datos reales)
    — solo se pudo comprobar que `npx vite build` compila limpio y que
    los módulos se transforman sin error en el servidor de desarrollo de
    Vite; no hay herramienta de navegador en esta sesión para clicar la
    cascada país→competición→partido, las pestañas de mercado, ni el
    colapso/reapertura de ninguno de los tres paneles de verdad.

- **Marcado de resultado por pick, universal, y resultado real derivado
  solo de los picks** (petición directa, a partir de dos maquetas HTML de
  referencia — full-bet-demo.html/pick-status-demo.html — inspiradas en el
  ticket de una combinada de Bet365). Cambio de fondo, confirmado con el
  usuario tras explicarle el tradeoff (con `AskUserQuestion`): el resultado
  REAL de la apuesta (el que mueve beneficio, freebet, racha y trofeos) ya
  no se marca con botones grandes Ganada/Perdida/Nula — se DERIVA solo del
  estado de los picks.
  - **Icono circular por pick, universal** (Simple o Combinada, un único
    pick o varios dentro de un "multi"): cicla Pendiente (aro vacío) →
    Ganada (relleno verde, ✓) → Perdida (relleno rojo, ✕, texto tachado) →
    Nula (relleno gris, –, texto tachado, etiqueta "Anulada") → Pendiente.
    Sustituye por completo al mini-selector de 3 botones que había por
    partido (solo en combinadas) — ahora es el único sitio donde se marca
    cualquier resultado, y funciona igual en una apuesta simple de 1 pick.
  - **`derivarResultadoGrupo`/`derivarResultadoApuesta`** (nuevas en
    `utils/apuestas.js`): mismo patrón en dos niveles — Ganada si todos los
    picks/partidos no anulados están Ganada; Perdida en cuanto alguno esté
    Perdida (aunque otros sigan pendientes); Nula si TODOS están anulados;
    Pendiente en cualquier otro caso. `agruparSeleccionesPorPartido` ya no
    lee el "resultado" de la selección líder tal cual — calcula el
    `resultado` de cada grupo con `derivarResultadoGrupo` sobre TODOS sus
    picks (no solo el líder), y cada pick dentro de `grupo.selecciones`
    lleva ahora su `indice` absoluto en el array original (para poder
    marcarlo individualmente — de paso corrige un `key={s.id}` que llevaba
    tiempo roto en `ApuestaItem.jsx`: las selecciones nunca tuvieron `id`,
    así que ese key siempre había sido `undefined`). `calcularCuotaTotal`
    pasa a operar a nivel de GRUPO (antes, de selección suelta): ahora un
    partido cuenta como "nula" en el producto (cuota 1) en cuanto TODOS
    sus picks están anulados, no solo si el líder lo estaba.
  - **El sello se dispara solo, para toda apuesta**: `colorResultado` en
    `ApuestaItem.jsx` pasa a ser siempre `grupo.resultado` (antes era
    `esCombinada ? grupo.resultado : apuesta.resultado`) — con esto, una
    apuesta simple de un único partido también saca su sello en cuanto se
    marca su pick, cosa que antes no pasaba (dependía solo del resultado
    final). El ojo de revelado por partido no cambia.
  - **`manejarMarcarResultadoPick` (nuevo, `App.jsx`)**: en cuanto el
    resultado derivado de TODA la apuesta cambia de verdad, reutiliza
    `manejarMarcarResultado` (mismo punto de entrada que antes usaban los
    botones grandes, ya retirados) para guardarlo de verdad — así los
    efectos de freebet que ya existían (seguro perdido → suma freebet;
    nula con fondos freebet → devuelve el stake) se disparan igual,
    vengan de donde vengan. Si la apuesta ya tiene Cash Out, los picks se
    pueden seguir marcando (para llevar el registro), pero ya no pisan
    ese resultado — Cash Out se queda como acción manual aparte,
    independiente de los picks, tal como se pidió.
  - **Riesgo aceptado y avisado, no resuelto**: como los picks se pueden
    ciclar libremente en cualquier momento (no solo mientras la apuesta
    está pendiente), es más fácil que antes que un pick oscile
    Perdida→Pendiente→Perdida por error — y `manejarMarcarResultadoPick`
    no comprueba si el freebet del seguro ya se sumó antes, así que un
    vaivén así podría sumarlo dos veces. Esto ya era posible antes (el
    botón "Perdida" tampoco comprobaba si ya se había aplicado), solo que
    ahora es más fácil llegar a ese caso sin querer. No se ha construido
    ninguna protección extra (idempotencia) para esto — queda anotado
    como límite conocido.
  - **Aviso de cuota tras anular un pick**: al marcar un pick como Nula,
    se abre un aviso no bloqueante bajo ese partido pidiendo la cuota
    nueva que dé la casa, con campo numérico y "Guardar" — que llama a
    `actualizarCuotaSeleccion` (nueva en `useApuestas.js`, mismo patrón
    que `marcarResultadoSeleccion`: reescribe la cuota de la selección
    líder de ese grupo). Si se ignora, la cuota se queda como estaba, y
    se puede reabrir después con el enlace "✎ Ajustar cuota" que aparece
    junto a la cuota del partido mientras tenga algún pick anulado. Si la
    apuesta tiene `cuotaTotalManual` puesto, esto no lo toca (limitación
    ya existente y documentada, sin cambios).
  - **Bug real encontrado en revisión de código, antes de compilar**:
    tanto `agregarApuesta` como `editarApuesta` (`useApuestas.js`) tenían
    su propia lista blanca de campos al guardar cada selección en
    Supabase, y esa lista NUNCA incluyó `equipoLocalId`/`equipoVisitanteId`
    — es decir, esos ids (para el desplegable de jugador, fase de la
    sesión anterior) se perdían ya al CREAR la apuesta, así que el
    desplegable de jugador nunca habría podido encontrar la plantilla al
    editar una apuesta ya guardada. Tampoco incluía `resultado`, que hasta
    ahora solo afectaba al sello decorativo si se perdía al editar, pero
    con este cambio es el dato que decide el resultado financiero real —
    perderlo al editar (p.ej. solo para corregir el stake) habría hecho
    que la apuesta volviera a "pendiente" sola. Las dos listas blancas
    ganan `equipoLocalId`/`equipoVisitanteId`/`resultado`. Además,
    `FormularioApuesta.jsx` reconstruye `selecciones` desde cero en cada
    guardado (por diseño, el bet builder no guarda `resultado` en su
    propio estado) — `manejarEnvio` ahora recupera el `resultado` de cada
    pick emparejando evento+texto contra `apuestaInicial.selecciones`
    antes de enviarlo, para no perderlo al editar por el formulario
    completo.
  - **Ronda de bugs reales al probarlo en local** (`vercel dev`, mismo
    día): tres fallos distintos, todos corregidos.
    - **"Crear apuesta" pedía un segundo partido sin motivo**: el campo
      de texto de `BuscadorEvento.jsx` llevaba `required` de HTML — como
      ConstructorPartido.jsx se reinicia (vacío) tras guardar un bloque,
      listo por si se quiere añadir otro partido opcional, ese campo
      vacío-pero-required seguía dentro del `<form>` de
      `FormularioApuesta.jsx`, y el navegador bloqueaba el envío entero
      por él aunque ya hubiera un bloque válido — parecía "obliga a elegir
      otro partido" sin serlo. Se quitó el `required`: la validación real
      (al menos un bloque) ya la hacían `disabled` en otros botones, no
      dependía de este atributo.
    - **El desplegable de mercado se veía "gigante"**: en "Crear multi de
      este partido", el `<div className="flex-1">` que envuelve
      `SelectorMercado.jsx` (junto al botón "+") no tenía `min-w-0` — un
      hijo flex, por defecto, no se encoge por debajo del ancho de su
      contenido, y con tantas pestañas de categoría eso empujaba todo el
      bloque (y la página entera) más ancho en vez de dejar que las
      pestañas hicieran su propio scroll horizontal contenido. `min-w-0`
      en ese `div`, y de paso en la raíz de `TabsDesplazables.jsx` (para
      que sea robusto en cualquier otro sitio flex donde se use).
    - **Marcar un pick "desde fuera" sin querer**: el primer diseño ponía
      un lápiz junto a cada pick, pero al tocar el sello (que es
      `pointer-events-none`, deja pasar el toque a lo que hay debajo) el
      toque caía sobre la fila entera y cambiaba el resultado sin querer.
      Rediseño final, a petición directa: el lápiz pasa a vivir junto al
      ojo (uno por partido, no por pick), y solo se ve mientras el sello
      está puesto del todo (ni revelado ni en edición). Al tocarlo entra
      en un modo edición nuevo (`editandoPicks`, Set de `indiceLider` en
      `ApuestaItem.jsx`): el sello desaparece por completo (no solo se
      atenúa) y los picks se vuelven botones tocables (ciclan sin pedir
      confirmación, como ya hacían). El ojo, mientras ese modo está
      activo, sale de él en vez de alternar "revelado" — así siempre es
      el mismo botón el que vuelve a aplicar el sello, ya con el
      resultado recalculado.
    - **El selector de mercado se reabría solo tras cada "+"**: en "Crear
      multi de este partido", tras añadir un mercado el comportamiento
      era reiniciar `SelectorMercado.jsx` fresco y expandido, listo para
      el siguiente — pero eso hacía que se quedara "abierto" aunque la
      combinada ya tuviera todos los mercados que se querían. Nuevo
      estado `mostrandoSelectorMercado` en `ConstructorPartido.jsx`: tras
      "+", se colapsa del todo a un botón pequeño "+ Añadir otro mercado"
      en vez de al buscador completo; solo se vuelve a mostrar si se
      pulsa ese botón a propósito.
  - **Segunda ronda de bugs reales al probarlo**, ambos ya corregidos:
    - **La tarjeta del último partido se veía "cortada" abajo**: cuando
      una apuesta ya está resuelta no hay bloque de Cash Out después (solo
      aparece con `esPendiente`), así que el último partido quedaba pegado
      sin margen contra el borde inferior redondeado de la tarjeta — su
      sello se veía cortado justo ahí, dando la sensación de que faltaba
      scroll cuando en realidad ya era el final de verdad. `pb-3` en el
      contenedor de la lista de partidos.
    - **Barra de scroll visible, pedida más "limpia"**: nueva clase
      `.scrollbar-oculto` en `index.css` (Firefox `scrollbar-width` +
      `::-webkit-scrollbar` para Chrome/Safari) — oculta la barra sin
      quitar el scroll en sí. Aplicada al modal de detalle de apuesta
      (`ListaApuestas.jsx`) y a las listas de `SelectorMercado.jsx`/
      `BuscadorEvento.jsx`; `TabsDesplazables.jsx` pasa a usar esta misma
      clase en vez de repetir el mismo CSS a mano.
    - **El lápiz/ojo no aparecían en partidos con picks a medio marcar**:
      bug real — los dos dependían de `colorResultado !== "pendiente"`,
      pero un partido con picks mezclados (uno ya marcado, otro sin
      tocar) sigue derivándose "pendiente" en conjunto
      (`derivarResultadoGrupo`), así que nunca aparecía ni el lápiz ni el
      ojo y no había forma de entrar en modo edición ni para el pick ya
      marcado. El lápiz ahora se ve siempre que no se esté ya revelando o
      editando (haya o no sello puesto); el ojo se ve si hay sello que
      mostrar/ocultar O si hay que salir del modo edición. Sin sello de
      fondo (pendiente, o ya en edición) los dos botones cambian a un
      estilo con más contraste (`bg-paperDim border`) en vez del
      `bg-black/15` pensado para ir sobre el tinte de color, que ahí casi
      no se veía.
  - **Tercera ronda: tarjetas de partido de tamaño distinto entre sí**:
    dos partidos con un único pick cada uno se veían con distinta altura
    de sello — el sello cubre toda la fila (`inset-0`), y la fila crece o
    encoge según su contenido real (si tiene o no país/competición
    guardados, si tiene o no el enlace "Ajustar cuota"...), así que dos
    partidos "iguales" en número de picks podían salir con cajas verdes
    de tamaño distinto. `min-h-[6.75rem]` en la fila de cada partido: fija
    un alto mínimo común, y solo crece por encima de eso si el contenido
    de verdad lo necesita (varios picks, textos largos).
  - **Pendiente**: seguir probando en el navegador — no hay herramienta de
    navegador en esta sesión, así que solo se pudo comprobar que compila
    limpio.

- **Hora y resultado del partido en el buscador, y orden cronológico**
  (petición directa, misma sesión). `api/partidos.js` ya traía toda esta
  información dentro de la misma llamada a `/fixtures?date=X` de siempre
  (comprobado a mano con curl antes de tocar nada, no hacía falta gastar
  cuota aparte): `fixture.date` (hora exacta), `fixture.status.short`
  (NS/1H/HT/2H/FT/AET/PEN...) y `goals.home`/`goals.away`. Se añade
  `&timezone=Europe/Madrid` a la llamada (comprobado que cambia el offset
  de `fixture.date` de `+00:00` a `+02:00` sin coste extra) para no tener
  que convertir a mano en el frontend — con el lío del cambio de horario
  CET/CEST, mejor que lo resuelva la propia API. Cada partido devuelto
  gana `hora` (`HH:MM`, ya en hora de España), `estado`, `golesLocal` y
  `golesVisitante`. De paso, `datos.response` se ordena por
  `fixture.date` antes de filtrar/mapear — la API no garantiza ningún
  orden concreto, así que los partidos ya salían de sitio en el buscador.
  `BuscadorEvento.jsx` pinta una píldora a la derecha de cada partido:
  hora (dorada) si `estado` no es uno de los terminados
  (`ESTADOS_FINALIZADOS`: FT/AET/PEN), o el resultado final (gris,
  `golesLocal-golesVisitante`) si ya lo es — en cualquier otro estado
  (1H/HT/2H, en juego) se sigue mostrando la hora, ya que el resultado
  todavía no es definitivo.
  - **Aclaración tras probarlo**: esto solo vive en el buscador (mientras
    se elige el partido) — al guardar la selección no se guarda hora ni
    resultado, así que las apuestas ya registradas nunca lo mostraban. El
    usuario en realidad quería verlo en el propio detalle de la apuesta
    (`ApuestaItem.jsx`), estilo ticket de una casa de apuestas.
  - **Hora/resultado en el detalle de la apuesta**: nueva Serverless
    Function `api/partido.js` (`GET /fixtures?id=X`, con
    `timezone=Europe/Madrid` igual que `api/partidos.js`) — a diferencia
    de pedir por fecha, pedir por id NO tiene la restricción de rango del
    plan gratuito (comprobado a mano: un partido de fuera del rango
    permitido respondió sin `errors.plan`), así que funciona para
    cualquier apuesta con partido conectado, sea de cuando sea. Hook
    `usePartidoInfo.js` (mismo patrón que `usePlantilla.js`, caché por
    partido dentro de la visita) + componente `EtiquetaPartidoEnVivo` en
    `ApuestaItem.jsx`, en la esquina de cada partido junto a la cuota —
    solo se pinta si la selección tiene `partidoId` guardado (partido
    elegido desde el buscador, no escrito a mano) y mientras la API
    responda; si no, no aparece nada, nunca bloquea el detalle.
  - **Marcador "en directo" — probado y descartado por cuota** (petición
    directa, misma sesión): primer intento con `usePartidoInfo.js`
    volviendo a pedir cada minuto (luego cada 3) mientras el partido
    siguiera sin terminar, para que el marcador se actualizara solo. Al
    calcular el gasto real (una combinada con varios partidos en juego a
    la vez multiplica las peticiones, y el plan gratuito son ~100 al
    día), el propio usuario decidió que no compensaba. Vuelta a una
    única petición por partido y visita — igual que `usePlantilla.js` —
    sin repetirla nunca: si el partido aún no ha terminado cuando se
    pide, se enseña la hora sin más, y para ver el resultado final basta
    con volver a abrir el detalle más tarde (eso sí cuenta como una
    petición nueva). `EtiquetaPartidoEnVivo` vuelve a los dos únicos
    estados visuales de antes: dorado con la hora, o gris con el
    resultado final.
  - **Cash Out demasiado ancho**: el botón pasó de formar parte de una
    fila de 4 (con Ganada/Perdida/Nula, ya retirados) a ser el único de
    su sección, y se había quedado con `w-full` — se veía como una franja
    entera en vez de un botón. Ancho ajustado al contenido (`px-5`, sin
    `w-full`), como cualquier otro botón normal de la app.
  - **Hora/resultado junto al partido, cuota abajo a la derecha**
    (petición directa, misma sesión): la píldora de `EtiquetaPartidoEnVivo`
    vivía en una columna a la derecha, junto a la cuota — ahí es donde
    chocaba con el ojo/lápiz de la esquina superior (ver el ajuste
    anterior, el `pt-10`). En vez de mantener ese hueco a medida,
    `ApuestaItem.jsx` cambia de sitio los dos: la píldora pasa a ir
    pegada al nombre del partido (`{grupo.evento} {grupo.partidoId &&
    <EtiquetaPartidoEnVivo .../>}` en la misma línea, con `flex flex-wrap`
    por si no caben en una), y la cuota (+ el enlace "✎ Ajustar cuota" si
    hay algún pick anulado) baja a una fila propia alineada a la derecha,
    debajo de la lista de picks. Al no competir ya por la esquina superior
    derecha, el `pt-10` que se había añadido para esquivar el ojo/lápiz ya
    no hacía falta y se quitó.

- Componentes funcionales con hooks, sin clases
- Un componente por responsabilidad clara; evita archivos gigantes
- Comentarios breves en español donde la lógica no sea obvia (freebets, combinadas, cálculo de yield)
- No añadir dependencias nuevas sin comentarlo primero
