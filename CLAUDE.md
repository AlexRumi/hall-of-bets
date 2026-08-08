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

- Componentes funcionales con hooks, sin clases
- Un componente por responsabilidad clara; evita archivos gigantes
- Comentarios breves en español donde la lógica no sea obvia (freebets, combinadas, cálculo de yield)
- No añadir dependencias nuevas sin comentarlo primero
