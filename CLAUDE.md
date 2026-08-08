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

- Componentes funcionales con hooks, sin clases
- Un componente por responsabilidad clara; evita archivos gigantes
- Comentarios breves en español donde la lógica no sea obvia (freebets, combinadas, cálculo de yield)
- No añadir dependencias nuevas sin comentarlo primero
