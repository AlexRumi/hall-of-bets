# Changelog — Hall of Bets

Historial detallado de decisiones: peticiones directas fuera del guion,
bugs encontrados y su causa, cosas probadas y descartadas. Ordenado
cronológicamente (más antiguo arriba, más reciente abajo). Para el
estado actual del proyecto (stack, identidad visual, funcionalidades
objetivo, fases y backlog), ver `CLAUDE.md`.

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
    antes de que este marcador funcione en producción. — Hecho, confirmado
    por el usuario.
  - **Bug real, detectado al probarlo en producción**: en una combinada
    con partidos de días distintos (p.ej. 5 el sábado y 2 el domingo, caso
    normal para este usuario), el marcador final de los partidos del
    sábado nunca llegaba a pedirse. Causa: `horaInicioPartido` combinaba
    la HORA de cada partido (correcta, guardada por grupo) con la FECHA
    de toda la apuesta (`apuesta.fecha`) — un único campo compartido que
    `ConstructorPartido.jsx` sobrescribe con la fecha del ÚLTIMO partido
    añadido (`onFechaPartido`). Con partidos de varios días, esa fecha
    compartida no coincide con la de cada partido: para uno del sábado
    podía acabar calculando su hora de inicio con la fecha del domingo,
    que cae en el futuro, así que el "gate" (hora de inicio + 2,5h)
    bloqueaba la consulta para siempre — el partido ya había terminado de
    verdad, pero la app creía que ni había empezado. Arreglo: `fecha`
    (la del partido, no la de la apuesta) se añade al mismo "pipeline" que
    ya llevaba `hora` — `ConstructorPartido.jsx` la guarda por partido,
    `agruparSeleccionesPorPartido` la expone en cada grupo, y las dos
    listas blancas de `useApuestas.js` la guardan. `ApuestaItem.jsx` pasa
    a calcular la hora de inicio con `grupo.fecha ?? apuesta.fecha` (con
    reserva a la fecha de toda la apuesta solo para selecciones de antes
    de este arreglo, que no tienen `fecha` propia guardada). Para una
    apuesta ya guardada antes de este arreglo, la única forma de que su
    marcador empiece a funcionar es quitar ese partido del editor y
    volver a elegirlo del buscador (así se guarda su `fecha` real) — no
    hay migración automática posible, el dato original nunca se guardó.
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

- **Ajustes responsive y ampliación de la Sala de Trofeos** (peticiones
  directas de la misma sesión):
  - El control segmentado Apuestas/Entretenimiento/Todas de
    `EstadisticasDashboard.jsx` apretaba mucho el texto de
    "Entretenimiento" en móvil (mismo `text-sm` que las otras dos
    pestañas, mucho más cortas). Pasa a `text-xs sm:text-sm` con un
    `px-1` de margen interno, para que quepa con holgura en pantallas
    estrechas sin tocar el resto del control.
  - **Cash Out cuenta para los trofeos de cuota/combinada cuando los picks
    ya estaban todos en Ganada**: caso real del usuario — una combinada de
    7 partidos con cuota >12, cerrada con Cash Out una vez los 7 picks ya
    estaban marcados Ganada uno a uno, no desbloqueaba "Cazador de
    cuotas" ni "Combinada ganadora". Causa: `construirContexto`
    (`utils/trofeos.js`) filtraba `ganadas` por `resultado === "ganada"`
    literal — pero Cash Out se guarda siempre como `resultado: "cashout"`
    a propósito (ver "Marcado de resultado por pick..." más arriba: el
    Cash Out no se deja pisar por el resultado derivado de los picks).
    Nueva `esGanadaDeVerdad(apuesta)`: además de `resultado === "ganada"`,
    también cuenta un Cash Out cuyo resultado DERIVADO de todos sus picks
    (`derivarResultadoApuesta`, no el guardado) sea "ganada" — es decir,
    cobraste antes de tiempo pero los partidos acabaron acertados de
    todas formas. Un Cash Out a medio partido (con picks todavía
    pendientes o alguno perdido) sigue sin contar. Con esto también se
    benefician "Dinero gratis" (mejor beneficio de una freebet) y todos
    los trofeos nuevos de Combinadas, ver abajo.
  - **Catálogo ampliado de 15 a 32 trofeos** (petición directa: "hay pocos
    trofeos, intenta llegar a 30"), repartidos en las mismas 5 categorías
    de siempre (no hizo falta ninguna nueva, "Especiales" ya funcionaba
    como cajón de sorpresas):
    - Volumen: +2 — "Medio centenar" (50 apuestas, oro) y "Enciclopedia"
      (250 apuestas, platino).
    - Rachas: +2 — "Sobre ruedas" (7 victorias seguidas, oro) y "Máquina
      de guerra" (15 victorias seguidas, platino).
    - Cuotas: +2 — "Rompebancas" (cuota ≥10, platino) y "Milagro" (cuota
      ≥20, platino, oculto).
    - Combinadas: +5 (de 1 a 6) — "Tu primera combinada" (registrar una,
      sin necesidad de ganarla, bronce), "Póker de aciertos" (ganar una
      de 4+ partidos, plata), "Máquina de combinadas" (ganar 5
      combinadas distintas, oro), "Sextuple" (ganar una de 6+ partidos,
      oro) y "El más difícil todavía" (ganar una de 8+ partidos, platino,
      oculto). Nuevos campos en el contexto: `combinadaCreada`,
      `mejorCombinadaGanada` (máximo de partidos en una combinada
      ganada) y `numCombinadasGanadas`.
    - Especiales: +6 (de 4 a 10, todos ocultos como los 4 que ya había) —
      "Explorador" (10 casas distintas, oro), "Cazafreebets" (jugar 5
      freebets, plata), "Salida a tiempo" (10 Cash Out, plata), "Doble
      juego" (apostar en Apuestas Y Entretenimiento, bronce),
      "Todoterreno" (3 deportes distintos, plata) y "Red de seguridad"
      (una apuesta asegurada, bronce). Nuevos campos en el contexto:
      `deportesDistintos`, `bankrollsUsados`, `numCashouts`,
      `tieneSeguro`, `numFreebets`.
    `SalaTrofeos.jsx` no necesitó ningún cambio: ya recorre `CATEGORIAS` y
    filtra `TROFEOS` de forma dinámica, así que los nuevos trofeos se
    integran solos.

- **Aviso de cuota diaria agotada en el buscador de partidos** (bug real,
  detectado por el usuario al no aparecerle un partido de hoy que sí
  existía). Comprobado a mano el 2026-08-10 llamando a API-Football
  directamente: con la cuota gratuita agotada (100 peticiones/día), la API
  responde 200 con `errors.requests = "You have reached the request limit
  for the day..."` — un caso silencioso más, igual que ya pasaba con la
  key que falta o con el rango de fechas, indistinguible de "no hay
  partidos ese día" si no se detecta aparte. `api/partidos.js` ahora
  comprueba `datos.errors` en general (no solo `datos.errors.plan`) y
  devuelve `{ partidos: [], cuotaAgotada: true }` — distinto de
  `fueraDeRango` porque el aviso es distinto (no depende de la fecha
  elegida, se resuelve solo al día siguiente cuando la API resetea la
  cuota). `usePartidos.js` guarda también este campo en su caché, y
  `BuscadorEvento.jsx` avisa en rojo bajo el buscador cuando ocurre, sin
  bloquear: el evento se puede seguir escribiendo a mano mientras tanto.

- **Equipos apilados con resultado, y línea antes de la cuota** (petición
  directa, a partir de una captura de referencia de un ticket real de
  apuestas). Nuevo `esFormatoEquipos(evento)` en `utils/mercados.js`
  (hermano de `equiposDesdeEvento`, ya existente): dice si "evento" sigue
  el formato "Local - Visitante" de verdad, sin caer en los nombres
  genéricos de repuesto — solo entonces merece la pena partirlo en dos
  líneas.
  - `ApuestaItem.jsx`: `EtiquetaPartidoEnVivo` se sustituye por
    `CabeceraPartido`, que pinta cada equipo en su propia fila con el gol
    de ESE equipo alineado a la derecha (en vez de "Evento" en una línea
    con una píldora "1-2" aparte) — el resultado solo se rellena una vez
    terminado el partido (nunca en directo, mismo límite de siempre); la
    hora, mientras tanto, se enseña junto a país/competición en vez de
    repetida en cada fila. Si el evento no tiene el formato de dos
    equipos (escrito a mano, otro deporte), se enseña tal cual, como
    antes. Se añade además una línea separadora (`border-t`) justo
    después de la lista de picks, antes de la cuota.
  - `FormularioApuesta.jsx`: el mismo criterio en cada bloque de "Apuesta
    en construcción" — dos líneas de equipo en vez de "Evento" truncado
    con un icono de globo (que se queda solo para eventos sin ese
    formato), con la cuota en la misma esquina de siempre, y la lista de
    mercados separada por una línea en vez de pegada justo debajo.

- **Rediseño de cada pick y su cabecera, a partir de una maqueta HTML de
  referencia** (`scoreboard-crest-demo.html`, varias rondas de ajuste en
  la misma sesión). Cada pick pasa de una línea con una flecha dorada
  (`▸ texto`) a dos líneas: el mercado en negrita arriba, y debajo en gris
  su categoría del catálogo — nueva `etiquetaCategoriaDeTexto(texto,
  equipos)` en `utils/mercados.js` (combina `buscarMercadoPorTexto`, ya
  existente, con el `etiqueta` de `CATEGORIAS_MERCADO`); si el mercado no
  coincide con nada del catálogo ("Otro mercado", o de antes del
  desplegable), no se pinta subtítulo. El icono circular de cada pick
  (`ESTILOS_ICONO_PICK`) no cambia de comportamiento.
  - Cada partido gana una cabecera propia "Multi Apuesta"/"Pick simple"
    (según tenga varios mercados o uno) con su cuota al lado, en su propio
    recuadro verde felt para diferenciarla del título dorado — sustituye a
    la fecha/hora que antes vivía junto al nombre del partido (esa
    información se conserva más abajo, junto a país/competición). El
    mismo icono circular de los picks (verde con tic, rojo con cruz, gris
    con rayita en nula) se reutiliza aquí, a la izquierda del título, para
    que se lea como el mismo lenguaje visual en toda la tarjeta — sustituyó
    a un tic/cruz sueltos (sin círculo) de una ronda anterior, y antes de
    eso a un simple punto de color (`COLOR_PUNTO`, ya sin uso, se borró).
  - **El marcador final se probó con escudos reales** (`EscudoEquipo.jsx`,
    imagen de `media.api-sports.io/football/teams/{id}.png`, que no gasta
    cuota de la API — es un CDN de imágenes aparte del endpoint de datos
    con el límite de 100/día — con reserva a un círculo de color con
    iniciales si no hay `equipoId` guardado o la imagen falla) y se
    **descartó tras probarlo**: con muchos partidos escritos a mano o de
    competiciones no conectadas (p.ej. la Taça de Portugal), salía más una
    inicial de repuesto que un escudo de verdad, y quedaba peor que no
    tener nada. Se quitó `EscudoEquipo.jsx` del todo (sin uso ya); el
    marcador se quedó solo con el nombre de cada equipo apilado y su gol.
  - Un poco de aire (`mt-2`) entre el marcador de un partido y la línea
    que lo separa del siguiente, que antes quedaban pegados.
  - **Picks tocables directamente mientras el partido sigue pendiente**
    (petición directa, tras el usuario decir que no sabía que hacía falta
    el lápiz): el bug real que motivó el lápiz-antes-de-tocar (tocar el
    sello, `pointer-events-none`, cambiaba el resultado sin querer) solo
    puede pasar una vez el partido ya está resuelto — el sello no existe
    mientras está pendiente, así que exigir el lápiz ahí de más era
    fricción sin ningún riesgo real detrás. Ahora `puedeCiclar = enEdicion
    || colorResultado === "pendiente"`, y el lápiz deja de verse mientras
    está pendiente (ya no aporta nada) — solo aparece una vez resuelto el
    partido, que es cuando sí hace falta esa protección para corregirlo.
  - **Bug real corregido de paso**: al anular un pick se abre un aviso
    para ajustar la cuota del partido (`promptsCuota`); si después se
    volvía a ciclar ESE MISMO pick a Ganada/Perdida/Pendiente, el aviso se
    quedaba abierto (solo se cerraba a mano, con "Guardar" o la "X").
    `ciclarPick` (`ApuestaItem.jsx`) ahora cierra el aviso solo en cuanto
    el pick deja de estar anulado.
  - **"Mejor apuesta"/"Peor apuesta" (`RachasYExtremos.jsx`, en
    Estadísticas) se pueden tocar** para abrir el mismo modal de detalle
    que ya usa el listado normal (`EstadisticasDashboard.jsx` gana el
    mismo patrón de `ListaApuestas.jsx`: guardar el id, buscarlo en el
    array completo sin filtrar, y los mismos manejadores de marcar/editar/
    borrar recibidos ahora desde `App.jsx`). Nuevo prop `soloLectura` en
    `ApuestaItem.jsx`: sin sello, sin ojo/lápiz por partido — esta vista es
    para repasar una apuesta ya resuelta, no para gestionarla, así que se
    ve directo el tic/cruz de cada pick sin nada que revelar. Solo se
    activa en este modal; el resto de la app sigue con el sello de
    siempre.
  - **Bug real corregido de paso**: con una combinada, "Mejor apuesta"/
    "Peor apuesta" mostraba solo `selecciones[0].evento` — parecía una
    apuesta a un único partido. Ahora cuenta partidos (no mercados
    sueltos, mismo criterio que el badge "Combinada · N partidos" de
    `ApuestaItem.jsx`/`TarjetaApuestaResumen.jsx`) y muestra "Combinada ·
    N partidos" cuando aplica.

- **Reequilibrio de categorías de trofeos** (petición directa: "Especiales"
  se había quedado con 10 de los 32 trofeos, todos ocultos — casi la mitad
  de todos los ocultos de la app en una sola categoría). "El fénix"
  (remontada) y "Perfeccionista" (100% de acierto) se mueven de
  `categoria: "especiales"` a `categoria: "rachas"` en `utils/trofeos.js`
  — encajan igual de bien ahí (los dos son, en el fondo, un patrón de
  racha) y reparten mejor los ocultos entre categorías. Reparto final:
  Volumen 6, Rachas 7, Cuotas 5, Combinadas 6, Especiales 8 — antes
  Especiales tenía 10 y Rachas solo 5. `SalaTrofeos.jsx` no necesitó
  ningún cambio, ya agrupa por `categoria` de forma dinámica.

- **Plantillas de jugador solo se piden al tocar la pestaña "Jugador"**
  (bug real, detectado por el usuario con el panel "Today Requests" del
  dashboard de API-Football: 2 llamadas de sobra por cada partido en
  cuanto se abría el selector de mercado, sin haber tocado esa pestaña —
  en una combinada de 7 partidos, 14 llamadas de más). Causa:
  `SelectorMercado.jsx` llamaba a `usePlantilla(equipoLocalId)` y
  `usePlantilla(equipoVisitanteId)` sin condición, en cuanto se montaba el
  selector de mercado de un partido — daba igual qué pestaña estuviera
  activa. Ahora solo se les pasa el id real de cada equipo mientras la
  pestaña activa es "jugador" (`enTabJugador = tabActiva === "jugador"`);
  en cualquier otra pestaña se les pasa `null`, y `usePlantilla` ni
  siquiera llama a `api/jugadores.js`. Volver a la pestaña "Jugador" más
  tarde no repite la llamada — su caché por equipo (a nivel de módulo) ya
  la tiene guardada de la primera vez.

- **Marcado de pick con 3 botones directos, sin ciclar** (petición
  directa: para marcar "Perdida" había que pasar primero por "Ganada" —el
  ciclo era Pendiente → Ganada → Perdida → Nula—, y si te dabas cuenta
  tarde, el partido ya se consideraba resuelto y hacía falta el lápiz
  otra vez para corregirlo). `ciclarPick` se sustituye por `marcarPick(grupo,
  pick, resultado)`: marca directamente el resultado pulsado, sin pasar
  por los demás. Cada pick editable (`puedeCiclar`, sin cambios en cuándo
  se activa) muestra ahora tres botones pequeños (✓ verde / ✕ roja / –
  gris) en vez de un único círculo — tocar el que ya está marcado lo
  deja de nuevo en Pendiente (deshacer). Fuera de edición se sigue viendo
  el único icono de estado de siempre (`ESTILOS_ICONO_PICK`), sin
  cambios. Se quita `ORDEN_CICLO_PICK`, sin más uso.
  Ronda de ajuste, misma sesión: en un "multi" con varios mercados del
  mismo partido, marcar uno como Perdida ya deja todo el partido como
  "perdida" (basta con que falle uno) — pero si aún quedaban otros
  mercados de ESE partido sin decidir, el sello los tapaba y hacía falta
  tocar el lápiz otra vez para seguir marcándolos. `marcarPick` ahora
  entra en modo edición sola (sin que se toque el lápiz) mientras
  `grupo.selecciones` tenga otro pick distinto todavía pendiente, para
  poder marcarlos todos de un tirón sin que el sello interrumpa a medias
  — en un pick simple (sin hermanos pendientes) esto no cambia nada, el
  sello sigue apareciendo al instante como siempre.
  **Decisión de diseño confirmada con el usuario** (con `AskUserQuestion`,
  porque tocaba cuándo se aplican beneficio/freebet/racha/trofeos): en un
  "multi" o combinada, un solo mercado perdido ya deja matemáticamente
  perdida toda la apuesta (`derivarResultadoApuesta` así lo calcula, con
  razón — basta con que falle uno), pero el usuario prefiere NO sellar la
  derrota real hasta haber marcado también el resto de mercados
  pendientes. `manejarMarcarResultadoPick` (`App.jsx`) ahora comprueba
  `todosDecididos` (ningún pick con `resultado == null` en toda la
  apuesta) y, si el resultado derivado es "perdida" pero todavía no está
  todo decidido, no llama a `manejarMarcarResultado` — se queda como
  estaba (normalmente "pendiente") hasta que se complete. El sello de
  cada partido (`colorResultado`, en `ApuestaItem.jsx`, y el icono junto a
  "Multi Apuesta"/"Pick simple") sigue reaccionando al instante sin
  esperar a nada — solo se retrasa el resultado REAL guardado y sus
  efectos. "Ganada"/"Nula" no necesitan este freno: por cómo se derivan,
  solo se alcanzan cuando ya está todo decidido, nunca antes.
  **Bug real de esta misma ronda**, detectado por el usuario con capturas:
  el modo edición que entraba solo (más arriba) se quedaba "pegado" para
  siempre — aunque ya se marcara el último pick pendiente de ese partido,
  el sello nunca se aplicaba solo, hacía falta tocar el ojo a mano o
  cerrar y reabrir la tarjeta para verlo. `marcarPick` ahora también sale
  del modo edición sola en cuanto ese partido se queda sin ningún pick
  pendiente (incluido el que se acaba de marcar) — el sello se superpone
  al instante, sin pasos extra. Un pick simple no se ve afectado: nunca
  llega a entrar en modo edición para esto, el sello ya aparecía al
  instante desde antes.
  **Segundo bug real, detectado por el usuario**: en un partido de 2
  picks, marcar uno verde y otro rojo, y luego deshacer el verde (volver
  a Pendiente), seguía aplicando el sello rojo de PERDIDA aunque un
  mercado se hubiera quedado sin determinar. Causa doble:
  1. En `ApuestaItem.jsx`, la comprobación de "queda algo pendiente" solo
     miraba los OTROS picks del partido, no el propio que se acababa de
     tocar — al deshacerlo, ese pick es justo el que se queda pendiente,
     y no contaba. `marcarPick` ahora calcula el valor de CADA pick con su
     valor nuevo si es el que se acaba de tocar (`s.indice === pick.indice
     ? nuevo : ...`), no el guardado hasta ese momento.
  2. En `App.jsx`, `todosDecididos` comprobaba `resultado != null` — pero
     deshacer un pick lo guarda como el texto literal `"pendiente"`, no
     como `null`/`undefined`, así que lo contaba como "ya decidido" por
     error. Pasa a comprobar `(resultado ?? "pendiente") !== "pendiente"`,
     mismo patrón ya usado en el resto de la app para leer el resultado de
     un pick.

- **Rango de líneas de "Córners por equipo" ajustado tras probarlo con
  datos reales** (petición directa). Antes reutilizaba las mismas líneas
  que "Córners" (total del partido, 6.5-14.5) — con un solo equipo casi
  nunca se llega tan alto. Nueva constante propia `LINEAS_CORNERS_EQUIPO`
  en `utils/mercados.js`: 0.5 a 9.5, usada solo por `opcionesCornersEquipo`
  (el mercado "Córners" de partido completo se queda igual, con su propia
  `LINEAS_CORNERS`). "Córners por equipo por mitad" pasa de 1.5-5.5 a
  0.5-4.5 (`LINEAS_CORNERS_MEDIO`). Apuestas ya guardadas con las líneas
  antiguas simplemente dejan de coincidir con el catálogo (caen a "Otro
  mercado" al editarlas) — mismo comportamiento ya aceptado en cualquier
  otro cambio del catálogo.
  Ronda siguiente, misma sesión: "Córners" (total, sin equipo) se amplía
  de 6.5-14.5 a **4.5**-14.5 — añade las líneas 4.5 y 5.5 para cubrir
  también partidos con pocos córners, sin tocar el límite superior.

- **`SelectorMercado.jsx` gana navegación en 3 niveles** (petición
  directa, a partir de una maqueta HTML de referencia —
  `real-demo-v3.html`— construida con los 433 mercados reales del
  catálogo). Las 18 categorías planas de siempre se reagrupan en 9
  principales (Resultado, Jugador, Goles, Hándicap Asiático, Córners,
  Tarjetas, Equipo — Mayor número, Especiales, + "Otro mercado" fijo al
  final), cada una con subcategorías, y un tercer nivel Local/Visitante
  donde aplica (p.ej. Goles → Por equipo → Local/Visitante). Sin cambiar
  ningún id ni función `texto()` existente — verificado a mano con un
  script (433 = 433 opciones en las dos formas, sin duplicados, sin
  huérfanos en ninguna dirección, cada opción con ruta en el árbol nuevo).
  - `utils/mercados.js`: cada lista de opciones (`OPCIONES_1X2`,
    `OPCIONES_GOLES_OVER`, `opcionesCornersEquipo("local")`...) se calcula
    UNA sola vez y se reutiliza tanto en `CATEGORIAS_MERCADO` (18 planas,
    sin tocar — la sigue usando `buscarMercadoPorTexto`/
    `etiquetaCategoriaDeTexto`, y por tanto el desglose por mercado de
    Estadísticas, que no cambia) como en el nuevo `ARBOL_MERCADOS` (9
    principales). Nueva `rutaEnArbol(opcionId)`: busca en qué categoría →
    subcategoría → Local/Visitante vive una opción por su id — la usa
    `SelectorMercado.jsx` para abrir en las pestañas correctas al editar
    una selección ya guardada (`buscarMercadoPorTexto`, sin cambios, sigue
    diciendo QUÉ opción es; esto solo dice DÓNDE vive en el árbol nuevo).
  - `SelectorMercado.jsx`: el valor interno de "seleccion" pasa de
    `"categoriaId|opcionId"` a solo `opcionId` (más simple, ya que los ids
    son únicos en todo el catálogo) — `buscarOpcionPorId` sustituye a
    `buscarOpcion`. Pestañas de categoría principal → pestañas de
    subcategoría (las dos con `TabsDesplazables.jsx`, igual que antes) →
    una fila más pequeña y compacta de Local/Visitante cuando la
    subcategoría la tiene, sin scroll (solo 2 opciones). El buscador de
    texto libre recorre TODO el árbol a la vez (menos "Jugador"), con la
    ruta completa como cabecera de cada grupo de resultados (p.ej. "Goles
    · Por equipo · Local").
  - **Filtro Local/Visitante en "Jugador"** (petición directa, no es un
    mercado nuevo): antes de elegir el jugador, dos botones con el nombre
    de cada equipo acotan qué plantilla se pide — ya no se piden las de
    los dos equipos a la vez en cuanto se abre esta categoría, solo la del
    filtrado. Cambiar de equipo limpia el jugador ya escrito (pertenecía
    al otro equipo). Encaja con el arreglo de la sesión anterior (las
    plantillas ya solo se pedían al tocar "Jugador"): ahora, además, solo
    se pide la mitad.
  - Un mismo texto de mercado que coincide con dos opciones distintas del
    catálogo (p.ej. "Empate" en 1X2 y en Descanso; "Over 0.5 goles" en
    Goles total y en Goles 1ª mitad) ya era ambiguo antes de este cambio
    — `buscarMercadoPorTexto` siempre elegía la primera coincidencia por
    orden de `CATEGORIAS_MERCADO`, sin tocar ese orden. No es una
    regresión de esta ronda, pero queda anotado por si algún día se
    decide resolverlo (p.ej. guardando también la categoría elegida, no
    solo el texto).
  - **"Empate al descanso" arreglado** (bug real, detectado por el
    usuario al verificar la reorganización): "ht-x" (Resultado al
    descanso) decía solo "Empate" desde una petición anterior para
    acortarlo — con el mismo texto que el "Empate" de Resultado Final
    (que va antes en `CATEGORIAS_MERCADO`), `buscarMercadoPorTexto`
    siempre encontraba el de Resultado Final, así que una selección de
    "Empate al descanso" se abría en la pestaña equivocada al editarla y
    su subtítulo en el detalle decía "Resultado Final" — dos mercados
    con resultados que pueden no coincidir, confundidos entre sí. Vuelve
    a decir "Empate al descanso" (confirmado con el usuario, deshaciendo
    el acortamiento anterior a propósito). El resto de colisiones de
    texto detectadas (Goles total vs Goles 1ª/2ª mitad) se quedan sin
    tocar por ahora, mismo aviso de arriba.

- **Pestañas de categoría/subcategoría desbordaban en móvil** (bug real,
  detectado por el usuario con una captura). `TabsDesplazables.jsx`
  arrancaba pegado a los bordes de su contenedor, sin el mismo margen que
  el resto de la tarjeta (p.ej. el buscador de texto, con su propio
  `p-3`) — en pantallas donde no cabían todas las pestañas, se veían
  cortadas a media palabra justo en el borde, sin ningún indicio de que
  se podía deslizar. Arreglo con el patrón habitual para esto: `-mx-3` en
  el contenedor exterior (deja que todo el bloque —incluida la posición
  de las flechas y el desvanecido, hermanos del scroll— llegue hasta el
  borde real de la tarjeta) y `px-3` en el propio scroll (lo recupera por
  dentro, para que la primera/última pestaña arranquen alineadas con el
  resto del contenido en reposo, aunque el área deslizable en sí llegue
  hasta el borde). El desvanecido del borde derecho ya era siempre
  visible en móvil (no solo con ratón, a diferencia de las flechas ‹ ›) —
  no hizo falta tocar esa parte, solo quedaba mal posicionado por el
  mismo desbordamiento.
  **Segunda vuelta, tras verlo con una captura real**: el desbordamiento
  fuera de la tarjeta se corrigió, pero el desvanecido seguía sin notarse.
  Causa real: iba de transparente a `surface` (blanco) — las pestañas
  inactivas no tienen relleno propio (son casi blancas de por sí), así
  que ese degradado no generaba ningún contraste visible contra ellas,
  solo se notaba algo sobre la pestaña activa (dorada). Pasa a
  `from-transparent via-paperDim to-surface` (`paperDim`, el mismo gris
  cálido que ya usa el resto de la app para superficies "recogidas") —
  con esa parada intermedia sí se nota, contra cualquier pestaña, antes
  de volver al blanco justo en el borde real de la tarjeta.

- **Botón "+ Añadir mercado" baja debajo del selector, ya no al lado**
  (petición directa, detectado en el mismo repaso móvil de arriba). En
  "Crear multi de este partido" (`ConstructorPartido.jsx`), el botón que
  añade el mercado elegido a la lista del multi iba en una fila `flex`
  junto a `SelectorMercado.jsx`, compartiendo ancho con él — apretaba
  demasiado en móvil, sobre todo una vez el selector colapsaba a su
  píldora dorada tras elegir un mercado. Pasa a ir debajo, a todo el
  ancho, mismo estilo que "Añadir otro mercado" (el botón que aparece
  para los mercados siguientes) — solo cambia el texto, "Añadir mercado"
  a secas para el primero.
  **Ronda siguiente, tras probarlo**: el usuario describió el flujo como
  "dos ventanas" — elegir un mercado colapsaba `SelectorMercado.jsx` de
  golpe a su píldora resumen, un salto brusco justo cuando aquí SÍ hay un
  paso de confirmación aparte ("Añadir mercado", recién movido debajo).
  En el resto de sitios donde se usa este selector (pick simple, editar
  un mercado ya guardado) elegir SÍ es la acción final, así que colapsar
  ahí tiene sentido. Nuevo prop `colapsarAlElegir` (por defecto `true`,
  sin cambios en ningún otro sitio) — `elegir()` solo llama a
  `setExpandido(false)` si viene a `true`. `ConstructorPartido.jsx` lo
  pasa a `false` solo en el `SelectorMercado` de "Crear multi de este
  partido": ahora, al elegir, el panel se queda abierto (con la opción
  marcada con ✓ en su sitio, más la píldora resumen arriba) hasta que se
  pulsa "Añadir mercado" a propósito.

- **Botones de acción principal unificados en dorado** (petición directa:
  en modo claro seguían en verde fieltro apagado, que además no coincidía
  con el verde vivo de la cabecera; en modo oscuro ya eran dorados). Se
  confirmó el alcance con `AskUserQuestion` antes de tocar nada: solo los
  botones que EJECUTAN una acción (Guardar/Crear/Añadir/Exportar/
  Archivar...), no las pestañas ni filtros activos (Real/Freebet,
  Apuestas/Entretenimiento, país del buscador...), que se quedan en verde
  fieltro como marcador de selección — mantiene la distinción visual
  entre "acción" y "estado elegido". 10 botones cambian de
  `bg-felt text-paper ... hover:bg-feltDark` a `bg-gold text-feltDark
  ... hover:bg-goldDark` (mismo patrón que ya usaba "Confirmar →" en
  `FormularioApuesta.jsx`, reutilizado tal cual): "Guardar" (objetivo),
  login, "Subir mi historial a la nube", "Exportar copia (JSON)", las 3
  de `ConstructorPartido.jsx` ("Elegir este partido →", "Guardar
  selección", "Guardar grupo del partido"), "Añadir casa", "Añadir
  movimiento", "Archivar"/"Desarchivar", "Añadir" (Otro bono) y "Crear
  apuesta"/"Guardar cambios". Revisado también `bg-win` (verde) en toda
  la app: solo aparece en indicadores de resultado (insignias, calendario
  de actividad, barra de progreso de objetivo) y en los botones de marcar
  un pick como Ganada — estos últimos son ellos mismos el indicador de
  estado (verde=ganada, rojo=perdida, gris=nula), no un CTA genérico, así
  que se quedan igual. `--felt` sigue de fondo en cabecera/sidebar/barra
  inferior/bordes, sin ningún cambio ahí.

- **Subtítulo de categoría bajo cada mercado en "Apuesta en
  construcción"** (petición directa, mismo sesión): cada selección de la
  lista de un bloque pasa de "punto + texto" en gris a mercado en negrita
  con la categoría del catálogo en gris debajo — mismo patrón mercado/
  categoría que ya usa `ApuestaItem.jsx` con `etiquetaCategoriaDeTexto`,
  reutilizado tal cual (null si no coincide con nada del catálogo, sin
  pintar subtítulo en ese caso).

- **Selector de mercado: crecimiento progresivo, quitar el "+" suelto, y
  flujo multi-mercado con añadido directo** (petición directa, misma
  sesión, a partir de 3 maquetas HTML de referencia:
  `mobile-responsive-fix-demo.html`, `picker-visual-fix-demo.html`,
  `multi-market-collapsed-demo.html` — solo se recibió la descripción por
  texto de las tres, no su contenido real, así que no se pudieron
  contrastar visualmente pixel a pixel).
  - **Responsive en móvil**: ya solucionado en una ronda anterior de esta
    misma sesión (patrón "bleed-and-recover" `-mx-3`/`px-3` +
    desvanecido siempre visible en `TabsDesplazables.jsx`, con
    `via-paperDim` para que se note el degradado contra pestañas
    inactivas). No hizo falta ningún cambio nuevo para este punto.
  - **`SelectorMercado.jsx` empieza cerrado, crecimiento progresivo**:
    `topActiva`/`subActiva`/`nivel3Activa` pasan de auto-elegir el primer
    valor a arrancar en `null` sin selección previa — mismo principio que
    ya usa `BuscadorEvento.jsx` con país→competición: cada nivel (pestañas
    de subcategoría, tercer nivel Local/Visitante, lista de opciones) solo
    aparece una vez se ha tocado el nivel anterior a propósito, nunca por
    defecto. `elegirTop`/`elegirSub` ya no reservan ningún hijo por
    defecto al cambiar de nivel.
  - **Diferenciación visual nivel 1/nivel 2**: `TabsDesplazables.jsx` gana
    un prop `compacto` (pestañas más pequeñas, `px-2.5 py-1 text-[11px]`
    en vez de `px-3 py-1.5 text-xs`, sobre un fondo propio `bg-paperDim`
    — sólido, para que el desvanecido del borde termine en ese mismo
    color sin que se note la costura) usado solo en el nivel 2
    (subcategoría) de `SelectorMercado.jsx`, para que se note de un
    vistazo que es un nivel anidado dentro del nivel 1 (categoría), no
    una fila más al mismo nivel.
  - **Quitar el botón "+" suelto**: `SelectorMercado.jsx` ya añadía la
    opción directamente al elegir una fila de la lista (`elegir()` llama
    a `onCambiar` en el momento) — el "+" que hacía falta vivía en
    `ConstructorPartido.jsx`, ver el punto de flujo multi-mercado justo
    debajo.
  - **Flujo multi-mercado de "Crear multi de este partido" con añadido
    directo**: el paso "multi" de `ConstructorPartido.jsx` ya no tiene un
    botón "+ Añadir mercado" ni el estado intermedio
    `mostrandoSelectorMercado` de la ronda anterior — elegir una opción
    del selector la añade de inmediato a la lista acumulada (visible
    ahora ARRIBA del selector, con su ✕ para quitarla, en vez de debajo)
    y el propio selector se resetea del todo (sin categoría ni
    subcategoría elegidas, listo para el mercado siguiente, que puede ser
    de otra categoría). El campo "Cuota de este partido" pasa a estar
    deshabilitado (`disabled`) hasta que haya al menos un mercado en la
    lista — el botón "Guardar grupo del partido" ya lo estaba desde
    antes.
    - **`SelectorMercado.jsx` gana el prop `onFinalizar(texto)`**: se
      llama con el texto YA DEFINITIVO justo en el momento en que el
      panel colapsa de verdad — al elegir una fila de la lista (dentro
      de `elegir()`, junto a `setExpandido(false)`) o al pulsar "Listo"
      en el modo "Otro mercado" (texto libre). Se necesitó un prop
      aparte de `onCambiar` porque `onCambiar` se dispara en cada tecla
      mientras se escribe el texto libre de "Otro mercado" — si
      `ConstructorPartido.jsx` hubiera añadido a la lista directamente
      desde `onCambiar`, habría añadido fragmentos de texto a medio
      escribir. El texto se pasa como argumento a `onFinalizar` (no se
      lee de ningún estado del padre) para no depender de si React ya
      había aplicado o no el `onCambiar` de esa misma pulsación.
    - `ConstructorPartido.jsx` reutiliza el mismo `resetId` que ya movía
      `BuscadorEvento`/el `SelectorMercado` del paso "simple" (comparten
      la clave `key={resetId}` para forzar el remount con estado limpio)
      — se incrementa también dentro de `finalizarMercadoMulti`, y como
      cada paso ("partido"/"simple"/"multi") es una rama de renderizado
      condicional distinta, no hay colisión entre remontar el selector
      del paso "multi" varias veces seguidas y el resto de componentes
      que comparten el mismo contador, que en ese momento ni siquiera
      están montados.
  - **Pendiente**: seguir probando en el navegador de verdad — no hay
    herramienta de navegador en esta sesión, así que solo se pudo
    comprobar que `npx vite build` compila limpio.

- **"Guardar selección"/"Guardar grupo del partido" en verde, excepción a
  la unificación en dorado** (petición directa, con dos capturas de
  referencia claro/oscuro). Motivo: en la pantalla de `ConstructorPartido.jsx`
  ya hay dorado por todas partes (pestañas de categoría, la píldora del
  mercado elegido, el chip del partido...), así que el botón de guardar
  final se perdía entre el resto — el usuario pidió diferenciarlo con
  verde. Es una excepción puntual a la regla de la ronda anterior ("el
  verde `--win` queda reservado para indicadores de resultado, no como
  color interactivo") — aquí se reutiliza el mismo token `--win` (no un
  verde nuevo) porque estas dos acciones sí funcionan como una señal de
  "esto ya está listo/confirmado", cercana a un resultado positivo, y
  porque el contraste `bg-win text-paper` ya tenía precedente en los
  botones ✓ de marcar un pick como Ganada (`ApuestaItem.jsx`). Sin
  `winDark` como token (a diferencia de `gold`/`goldDark`), el hover usa
  `hover:brightness-90` en vez de un color distinto. El resto de botones
  de `ConstructorPartido.jsx` ("Elegir este partido →") se queda en
  dorado — no se mencionó en la petición, y ese botón es solo un paso
  intermedio de navegación, no una acción de guardado final.

- **Competiciones también deslizantes en `BuscadorEvento.jsx`** (petición
  directa, con captura de referencia en móvil). Las píldoras de
  competición (La Liga, Segunda División, Copa del Rey...) iban en
  `flex flex-wrap`, así que con varias competiciones en pantallas
  estrechas se partían en más de una fila. Pasan a usar
  `TabsDesplazables.jsx` — el mismo componente ya usado para el País, una
  fila justo encima — con scroll horizontal, flechas ‹ › en escritorio y
  desvanecido en el borde, `colorActivo="gold"` para que la competición
  elegida se distinga del país (en felt) por encima.

- **Equipos en dos líneas en la lista de partidos del buscador** (petición
  directa, con captura de referencia en móvil: nombres largos como "Kauno
  Žalgiris - Dinamo ..." se truncaban a media palabra en una sola línea).
  Nuevo `NombresEquipos` en `BuscadorEvento.jsx` (reutiliza
  `esFormatoEquipos`/`equiposDesdeEvento`, ya usadas para el mismo patrón
  en `ApuestaItem.jsx`/`FormularioApuesta.jsx`): pinta el equipo local y
  el visitante uno debajo del otro en vez de "evento" en una única línea,
  en las dos listas de partidos (resultados de búsqueda por texto y la
  cascada país→competición→partidos). La hora/resultado a la derecha ya
  quedaba centrada verticalmente sola, por el `items-center` que ya tenía
  el botón de cada fila — no hizo falta tocar eso.

- **Quitado el desvanecido del borde derecho de las pestañas deslizantes**
  (petición directa, con captura): en `TabsDesplazables.jsx`, cuando la
  pestaña ACTIVA caía justo en el borde derecho (p.ej. "Competición
  Europea" en el país, ya elegida), el degradado le tapaba parte del
  texto — se veía feo, y encima quitaba legibilidad justo a la opción ya
  seleccionada. Se quita del todo: en táctil, el propio deslizado con el
  dedo ya indica que hay más contenido; en escritorio, las flechas ‹ ›
  (solo con ratón, sin cambios) siguen ahí.

- **Cuota ajustada a mano también en apuestas simples, no solo
  combinadas** (bug real detectado por el usuario: una apuesta de 1 sola
  selección, cuota 2,62 y 5€, le pagó 8,13€ de beneficio en la casa —
  Hall of Bets calculaba 8,10€, porque la cuota real interna de la casa
  tenía más precisión que los 2 decimales que se ven y se guardan). El
  campo "Importe real que paga la casa" (`cuotaTotalManual`, ver "Cuota
  total ajustada a mano en combinadas" más arriba) estaba limitado a
  `bloques.length > 1` — solo combinadas — aunque `calcularCuotaTotal`
  (`utils/apuestas.js`) ya soportaba el override para cualquier número de
  selecciones, sin cambios. Se quita esa restricción tanto en
  `manejarEnvio` (guardar) como en el JSX del campo, así que ahora
  también aparece con un único partido. El texto de ayuda se separa en
  dos variantes según `bloques.length` (una habla de "multiplicar las
  cuotas", la otra de "la cuota está redondeada a 2 decimales"), y el
  título pasa de "si aciertas todo" a "si ganas" para que tenga sentido
  también con una sola selección.
  Como editar una apuesta ya resuelta ya era posible desde antes (el
  lápiz de `ApuestaItem.jsx` no depende del resultado), esto ya cubre el
  caso de ajustar la cuota real a toro pasado, con el resumen final de la
  apuesta liquidada delante — no hizo falta ningún cambio para permitir
  editar después de resolver, ya funcionaba así.

- **Bankroll/ROI de Estadísticas ya respeta el filtro Apuestas/
  Entretenimiento/Todas** (bug real detectado por el usuario: con la
  pastilla "Apuestas" elegida y 0€ de actividad ahí, el KPI "Bankroll"
  seguía mostrando 10€ — el dinero de un ingreso hecho solo en
  Entretenimiento). Causa: `EstadisticasDashboard.jsx` filtraba
  `apuestasDelBankroll` por `categoria`, pero `movimientosFiltrados` nunca
  se filtraba por bankroll — el comentario que había ahí ("los
  movimientos no tienen categoria") ya no era cierto desde la fase
  "Bankroll separado de verdad por Apuestas/Entretenimiento", que le
  añadió esa columna a `movimientos`, pero nadie volvió a tocar este
  archivo para aprovecharla. `calcularBankrollPorCasa` (`utils/
  movimientos.js`) ya soportaba un tercer parámetro `categoria` desde esa
  misma fase, sin usar aquí. Se añade `movimientosDelBankroll` (mismo
  patrón que `apuestasDelBankroll`, filtra por `filtroBankroll` salvo
  "todas") y `movimientosFiltrados` se calcula a partir de ahí en vez de
  `movimientos` sin filtrar — así "Bankroll"/"ROI" del panel de KPIs y
  "ROI por casa" ya reflejan la pastilla elegida, igual que el resto del
  dashboard.

- **Gráfico de Evolución: un punto por día, no por apuesta** (petición
  directa: con varias apuestas el mismo día, el eje X repetía la misma
  fecha varias veces seguidas). `calcularSerieAcumulada` (`utils/
  apuestas.js`, usada tanto por `GraficoEvolucion.jsx` como por
  `GraficoBeneficio.jsx`) agrupa primero el beneficio de todas las
  apuestas de un mismo día (`Map` por fecha, aprovechando que
  `ordenarCronologicamente` ya deja las apuestas en orden ascendente) y
  solo entonces calcula el acumulado — un punto por día con el total ya
  sumado, en vez de un punto por cada apuesta suelta.

- **Dos categorías nuevas de "Clasificación" (eliminatorias)** (petición
  directa). `utils/mercados.js` gana "Equipo que clasifica" (2 opciones:
  quién pasa a la siguiente ronda) y "Método de clasificación" (2
  subcategorías Local/Visitante, cada una con "en 90 minutos" / "en la
  prórroga" / "en los penaltis") — las dos justo después de "Resultado" y
  antes de "Jugador", tanto en `CATEGORIAS_MERCADO` (lista plana) como en
  `ARBOL_MERCADOS` (con las mismas listas de opciones compartidas entre
  las dos, igual que el resto del catálogo). "Equipo que clasifica" tiene
  una única subcategoría ("Clasifica") en el árbol — sin opciones sueltas
  directamente bajo una categoría principal, todas pasan por al menos un
  nivel de subcategoría, igual que el resto de `ARBOL_MERCADOS`.
  **Decisión tomada sin confirmar**: el texto final usa el nombre real del
  equipo ("Real Madrid clasificará", "Real Madrid clasificará en la
  prórroga") en vez del literal "Local clasificará" tal cual se pidió —
  mismo criterio que casi todos los mercados de un solo equipo del
  catálogo (Gana X, X gana al descanso, Primera tarjeta: X...); solo
  "Favor/Contra" y "Resultado descanso/final" se quedan con la notación
  Local/Visitante sin nombre, y en los dos casos porque se pidió así de
  forma explícita en su momento. Si aquí se quería el texto literal
  "Local"/"Visitante" sin sustituir, es un cambio de una línea en
  `OPCIONES_EQUIPO_CLASIFICA`/`opcionesMetodoClasificacion`.
  Ronda de ajuste (petición directa): con solo 2 mercados, la subcategoría
  "Clasifica" de en medio no aportaba nada — obligaba a un clic extra sin
  ninguna alternativa real que elegir ahí. `SelectorMercado.jsx` gana un
  caso general para esto: cuando una categoría principal tiene una única
  subcategoría, `elegirTop` la auto-selecciona sola (sin esperar a que se
  toque, a diferencia del resto del árbol) y la fila de pestañas de
  subcategoría no se pinta — la categoría muestra sus opciones directas en
  cuanto se elige. La subcategoría "Clasifica" se queda en los datos (el
  código sigue esperando que toda categoría tenga `subcategorias`), pero
  ya no se ve ni hace falta tocarla.

- **Ampliación grande del catálogo de mercados: Ganador del trofeo,
  jugador (remates separados, faltas/entradas con línea, paradas de
  portero...), tarjetas de equipo, penaltis, y Remates/Remates a puerta
  del equipo** (petición directa, de 435 a 594 mercados — verificado con
  un script de un solo uso, igual que en la reorganización del árbol:
  mismo total en la lista plana y en el árbol, sin duplicados ni
  huérfanos en ninguna dirección).
  - **Ganador del trofeo** (junto a Método de clasificación, mismo grupo
    de "Clasificación"): "{equipo} gana el trofeo" — con el nombre real
    del equipo, confirmado por el propio ejemplo del usuario ("PSG gana
    el trofeo"). Al tener una única subcategoría, se beneficia solo del
    ajuste de "Equipo que clasifica" (más arriba): sin clic de más.
  - **Jugador**: "Remates" y "Remates a puerta" pasan de una única
    categoría mezclada a dos separadas, y sus líneas (antes 0.5/1.5/2.5)
    se amplían a 0.5-4.5. Nueva "Anotará o Asistirá" (junto a
    Asistencias): `{jugador} anota o asiste`, un único mercado sin línea.
    "Faltas" pasa de un único mercado plano ("comete una falta"/"recibe
    una falta") a líneas 0.5-4.5 en las dos direcciones — al cambiar el
    texto, las apuestas antiguas con el mercado plano ya no coinciden con
    el catálogo y caen a "Otro mercado" al editarlas, mismo criterio ya
    aceptado en cualquier otro cambio de texto del catálogo. Nueva
    "Entradas" (junto a Faltas): mismas líneas 0.5-4.5, pero solo
    "comete" (sin "recibe", pedido así explícitamente). Nueva "Paradas
    del portero": 1+ a 7+ paradas, sin línea "under" (números enteros,
    "1+, 2+, 3+..."). "Tarjetas" del jugador cambia su texto de "recibe
    tarjeta" a "será amonestado" (mismo motivo de caída a "Otro mercado"
    en apuestas ya guardadas con el texto viejo).
    **Decisión sin confirmar**: "Paradas del portero" reutiliza el mismo
    desplegable de jugador de siempre (toda la plantilla del equipo, sin
    filtrar solo porteros) — el pedido decía "al seleccionar el
    portero", pero filtrar el desplegable por posición necesitaría datos
    que `api/jugadores.js` no expone todavía (la API sí podría traer la
    posición de cada jugador, no se ha comprobado). Si se quiere ese
    filtro de verdad, es una fase aparte.
    Internamente, `PLANTILLAS_JUGADOR` (la lista de sufijos que se pegan
    al nombre del jugador) gana un generador `plantillasLinea(prefijoId,
    generarSufijo)` para no repetir las 5 líneas a mano en Remates/
    Faltas/Entradas — comparten `LINEAS_JUGADOR` (0.5 a 4.5).
  - **Tarjetas (equipo)**: dos subcategorías nuevas junto a "Ambos reciben
    tarjeta" — "Ambos reciben 2 tarjetas" (Sí/No) y "Expulsión" ("Tarjeta
    roja: Sí/No").
  - **Especiales**: dos subcategorías nuevas — "Anotará un penalti"
    ({equipo} anotará un penalti) y "Penalti en el encuentro" (Sí/No).
  - **Remates y Remates a puerta (equipo)**, junto a "Goles": dos
    categorías principales nuevas, cada una con Totales/Local/Visitante
    y, dentro de cada una, Over/Under como tercer nivel (pedido así
    explícitamente — a diferencia de Córners/Tarjetas por equipo, que
    usan notación "+X/-X", aquí el texto también dice "Over"/"Under").
    Líneas: Remates Totales 16.5-34.5 de 2 en 2; Remates Local/Visitante
    5.5-23.5 de 2 en 2; Remates a puerta Totales 4.5-12.5 de 1 en 1;
    Remates a puerta Local/Visitante 0.5-9.5 de 1 en 1 (sin salto de 2 en
    2 pedido explícitamente para estas dos, a diferencia de las de
    Remates). Nueva función `lineasDesde(desde, hasta, paso)` (junto a
    las demás constantes `LINEAS_*` de arriba) para generar estos rangos
    más largos sin escribirlos a mano.
    Los ids de estas dos categorías llevan el sufijo `-equipo` (p.ej.
    `remates-equipo-local-over-5.5`) para no chocar con los ids ya
    existentes de "Remates"/"Remates a puerta" del JUGADOR (p.ej.
    `remates-totales-1.5`), que usan un formato de id totalmente distinto
    — comprobado con el mismo script de verificación, sin colisiones.
  - **Nota del propio usuario**: "no sé si todos los mercados estarán
    disponibles [en las casas de apuestas reales]" — el catálogo no
    pretende ser 1:1 con ninguna casa concreta, es una lista de mercados
    habituales para poder registrar la apuesta que sea; si alguno no
    encaja nunca, siempre queda "Otro mercado" como vía de escape.

- **Etiquetas "Anotará"/"Asistirá", y filtro de porteros en el desplegable
  de jugador** (petición directa, misma sesión). "Goles"/"Asistencias"
  (subcategorías de Jugador) pasan a llamarse "Anotará"/"Asistirá" —
  solo la etiqueta visible, los ids (`goles`/`asistencias`) no cambian,
  así que no afecta a nada guardado. El texto de "Jugador da una
  asistencia" pasa a "Jugador asistirá".
  - **Filtro por posición**: "Paradas del portero" ahora solo lista
    porteros; "Remates", "Remates a puerta", "Faltas", "Entradas",
    "Anotará", "Asistirá" y "Anotará o Asistirá" excluyen a los porteros
    (pedido así explícitamente — rara vez rematan, faltan, o marcan).
    "Tarjetas" se queda sin filtrar a propósito, un portero sí puede ver
    tarjeta. `api/jugadores.js` expone un campo nuevo `posicion` (el
    `position` que ya devuelve `/players/squads` de API-Football, sin
    ninguna llamada de más — solo se estaba descartando ese dato de la
    misma respuesta) y `SelectorMercado.jsx` filtra `gruposJugadores`
    según la subcategoría activa (`filtrarPorPosicion`, con dos listas
    fijas — `SUBCATS_JUGADOR_SOLO_PORTEROS`/`SUBCATS_JUGADOR_SIN_PORTEROS`).
    **Sin verificar a mano todavía**: se asume que API-Football devuelve
    `"Goalkeeper"` (en inglés) como valor de `position` para los
    porteros, siguiendo su convención documentada — no se ha comprobado
    contra la cuenta real con `vercel dev`. Si el valor real es distinto
    (o viene vacío para algún jugador), el filtro de esa entrada
    concreta no funcionaría bien; conviene probarlo con un partido real
    antes de darlo por bueno.
  - **Llamadas a la API**: este cambio añade CERO llamadas nuevas. El
    filtro es puro cálculo en el navegador sobre la plantilla que ya se
    pedía antes — `posicion` viaja en la misma respuesta de
    `/players/squads` que ya se consulta para el desplegable de jugador,
    solo que antes se descartaba ese campo. El número de llamadas reales
    a API-Football sigue exactamente igual que antes de esta fase: como
    mucho 1 por equipo cada ~24h (`Cache-Control: s-maxage=86400` en
    `api/jugadores.js`, compartida entre TODOS los visitantes de la web,
    no por dispositivo), y solo si alguien llega a abrir la pestaña
    "Jugador" de verdad — la mayoría de partidos no llegan a gastar
    ninguna. Con una combinada de varios partidos que repite un mismo
    equipo, tampoco se duplica: la caché de `usePlantilla.js` es por
    equipo a nivel de módulo, compartida entre todas las instancias del
    selector abiertas en esa visita. No hay forma de bajar más de ahí sin
    una respuesta que 1 llamada por equipo — API-Football no ofrece un
    endpoint que traiga varias plantillas a la vez en el plan gratuito.

- **Orden "Equipo: ..." consistente en todo el catálogo, Faltas del
  jugador dividida en Comete/Recibe** (petición directa, con "revisa que
  todos sigan el mismo orden" como cierre — se interpretó como pedir
  auditar TODO el catálogo de mercados "por equipo", no solo los 2/3
  mencionados explícitamente). El nombre del equipo pasa a ir siempre
  primero, seguido de ":", con el nombre del mercado (goles/córners/
  tarjetas/remates/remates a puerta) al FINAL de la frase en vez de
  delante — se corrigieron 6 funciones generadoras: `opcionesGolesEquipo`,
  `opcionesGolesEquipoMedioTiempo`, `opcionesCornersEquipo`,
  `opcionesCornersEquipoMedioTiempo`, `opcionesTarjetasEquipo` y
  `opcionesOverUnderLadoEquipo` (Remates/Remates a puerta del equipo,
  fase de esta misma sesión). Ejemplo: "Córners Real Madrid: +5.5
  córners" → "Real Madrid: +5.5 córners". Como cambia el texto exacto de
  mercados que ya existían, cualquier apuesta guardada con la redacción
  vieja deja de coincidir con el catálogo y cae a "Otro mercado" al
  editarla — mismo criterio ya aceptado en otros cambios de texto
  anteriores.
  "Faltas" (Jugador) gana una subcategoría Comete/Recibe (antes las 10
  líneas —5 comete + 5 recibe— iban mezcladas en una sola lista) —
  `OPCIONES_JUGADOR_FALTAS` se divide en `OPCIONES_JUGADOR_FALTAS_COMETE`/
  `_RECIBE`. No hizo falta tocar `SelectorMercado.jsx`: el árbol de 3
  niveles (categoría → subcategoría → Local/Visitante) ya es genérico —
  "Faltas" simplemente empieza a usar ese tercer nivel con Comete/Recibe
  en vez de Local/Visitante, sin ningún caso especial para "Jugador".
  **"Córners por equipo y mitad" — resuelto tras preguntar**: pedía
  añadir 1ª mitad/2ª mitad "antes de Local y Visitante", que habría
  significado un cuarto nivel de navegación (`SelectorMercado.jsx` solo
  soporta 3 fijos, a propósito). Preguntado con `AskUserQuestion`, el
  motivo real era otro: agrupado por equipo, cada pestaña Local/Visitante
  mezclaba a la vez el over/under de 1ª Y 2ª mitad — una lista demasiado
  larga. La solución no necesitaba un cuarto nivel: el tercer nivel pasa
  de Local/Visitante a 1ª mitad/2ª mitad (`OPCIONES_CORNERS_EQUIPO_1T`/
  `_2T`, sustituyen a `..._MITAD_LOCAL`/`_VISITANTE`) — cada pestaña de
  mitad ahora solo tiene el over/under de los DOS equipos en esa mitad,
  la mitad de opciones que antes. El nombre del equipo se queda dentro
  del texto de cada opción ("Real Madrid 1ª mitad: Over 1.5 córners"),
  igual que ya hacía "Goles por equipo por mitad" — que comparte
  exactamente esta misma estructura (equipo como pestaña, mezclando las
  dos mitades) y por tanto el mismo problema potencial, sin tocar todavía
  a la espera de que el usuario confirme si también quiere el mismo
  cambio ahí.
  - **Ronda siguiente — 4º nivel de navegación** (petición directa,
    confirmando "Goles por equipo por mitad" con el mismo cambio, y
    pidiendo ADEMÁS un nivel más: Over/Under). Motivo real (aclarado por
    el usuario tras la pregunta anterior): separar solo por mitad no
    bajaba tanto el número de mercados por pestaña como parecía — cada
    mitad seguía mezclando de golpe el Over Y el Under de los dos
    equipos (16-20 opciones). `SelectorMercado.jsx` gana un 4º nivel de
    navegación (antes tope fijo en 3): nuevo estado `nivel4Activa`,
    `tieneNivel4`/`nivel4Node` (mismo patrón que `tieneNivel3`, un
    escalón más abajo), y una fila de pestañas más (fondo `bg-paperDim/70`,
    texto aún más pequeño que el nivel3, para notar la profundidad).
    `elegirTop`/`elegirSub` resetean también `nivel4Activa`; nueva
    `elegirNivel3` (sustituye el `setNivel3Activa` suelto) para
    resetearlo también al cambiar de nivel3. `rutaEnArbol` (`utils/
    mercados.js`) se amplía para devolver `nivel4Id`, así que editar una
    apuesta con uno de estos mercados sigue abriendo el árbol en el sitio
    exacto. Se aplica a las dos categorías con este problema: "Goles por
    equipo y mitades" y "Córners por equipo y mitad" — ambas pasan de
    mitad → [Local, Visitante] a mitad → [Over, Under] (con los dos
    equipos ya combinados dentro de cada Over/Under, en vez de por
    separado). Las funciones generadoras (`opcionesGolesEquipoMedioTiempo`/
    `opcionesCornersEquipoMedioTiempo`) cambian de devolver una lista
    plana a `{ over, under }`, para poder combinar los dos equipos por
    separado — mismos ids y mismos textos que ya tenían (solo cambia
    cómo se agrupan para navegar), así que no afecta a nada ya guardado.
    Se decidió NO generalizar el árbol a profundidad arbitraria (una
    versión "recursiva" habría servido para cualquier nivel futuro sin
    tocar código) — de momento solo dos categorías necesitan un 4º
    nivel, así que se optó por el mismo patrón fijo ya usado para los
    tres primeros niveles, más simple y consistente con el resto del
    archivo, en vez de una abstracción a la que aún no le tocaba el
    turno.
  - Ajuste final: la etiqueta de esta subcategoría de Goles pasa de "Por
    equipo y mitades" (plural) a "Por equipo y mitad" (singular), a
    juego con la de Córners, que ya se llamaba así.

- **Filtro de posición (Defensas/Centrocampistas/Delanteros) en el
  desplegable de jugador** (petición directa, tras confirmar que era
  posible sin gastar llamadas de más — la posición ya viaja en la misma
  respuesta de `/players/squads` que se usaba para excluir porteros).
  `SelectorMercado.jsx` gana un segundo filtro, `posicionFiltro`
  (independiente del de Equipo, no se resetea al cambiar de equipo ni de
  subcategoría), con botones Todas/Defensas/Centrocampistas/Delanteros
  junto al toggle de Local/Visitante — solo visible en las mismas
  categorías que ya excluían porteros (`SUBCATS_JUGADOR_SIN_PORTEROS`):
  en "Paradas del portero" no aporta nada (ya son todo porteros) y en
  "Tarjetas" puede salir cualquiera, sin distinción. `filtrarPorPosicion`
  gana un tercer parámetro y, para esas categorías, aplica el filtro de
  posición después de quitar los porteros. **Sin verificar a mano
  todavía** (mismo aviso que con "Goalkeeper"): se asume que API-Football
  devuelve `"Defender"`/`"Midfielder"`/`"Attacker"` en inglés — su
  convención de 4 posiciones documentada, pero no comprobada contra la
  cuenta real.

- **El desplegable de jugador se cortaba según el scroll (bug real, con
  captura)**: `SelectorDesplegable.jsx` (el desplegable de jugador dentro
  de `SelectorMercado.jsx`, y el de `CampoCasa.jsx`) posicionaba su panel
  en `position: absolute`. `usePosicionDesplegable.js` calculaba bien el
  hueco libre respecto a la VENTANA, pero el panel en sí seguía viviendo
  dentro del flujo normal del documento — si el campo estaba dentro de un
  contenedor con su propio scroll y alto limitado (el modal de detalle de
  una apuesta, `ListaApuestas.jsx`, que es donde se edita una apuesta ya
  guardada), ese contenedor recortaba el panel por su propio borde, sin
  relación con "el hueco de la ventana" — el recorte real dependía de por
  dónde estuviera scrolleado ESE modal, no la página. `usePosicionDesplegable.js`
  ahora expone también las coordenadas en píxeles de ventana (`left`/
  `width`/`top`/`bottom`) y el panel pasa a `position: fixed` con esas
  coordenadas — eso escapa de cualquier contenedor con scroll propio, ya
  no depende de dónde esté recortado ningún padre. Contrapartida: en
  "fixed" el panel ya no se mueve solo si se hace scroll mientras está
  abierto (antes sí, al ir en "absolute" dentro del flujo) — en vez de
  perseguir la posición en cada scroll, `SelectorDesplegable.jsx` cierra
  el panel si detecta cualquier scroll mientras está abierto (listener en
  `window` con `capture: true`, para pillar también el scroll de
  contenedores internos como el del modal, no solo el de la ventana).

- **Nivel3/nivel4 y "Posición" pasan a `TabsDesplazables` (deslizantes)**
  (petición directa: "todo lo que pueda que falte poner deslizantes en
  mercados"). Las pestañas de nivel3 (mitad, Comete/Recibe...), nivel4
  (Over/Under) y el nuevo filtro "Posición" eran filas de botones a mano
  sin `flex-wrap` ni scroll — con etiquetas largas o más opciones se
  salían del panel en vez de deslizar. Las tres pasan a usar
  `TabsDesplazables` (`compacto`, `colorActivo="gold"`), igual que ya
  hacía el nivel2 — con eso ya vienen resueltos el scroll horizontal, las
  flechas en escritorio y el desvanecido del borde. Efecto secundario
  aceptado: nivel3 y nivel4 (antes con su propio tamaño decreciente, cada
  uno un pelín más pequeño que el anterior) ahora se ven del mismo tamaño
  que el nivel2 y entre sí, al compartir la misma variante `compacto` —
  se pierde ese matiz de "cuanto más adentro, más pequeño", a cambio de
  que ninguno se corte ni se salga del panel.
  De paso, corregido un bug real en `SelectorDesplegable.jsx` (el
  desplegable de jugador, arreglado en la fase anterior con
  `position: fixed`): el cierre-al-hacer-scroll cerraba el panel también
  cuando el scroll era DENTRO de su propia lista (con el ratón encima),
  impidiendo desplazarla — aunque el panel esté en `position: fixed`,
  sigue siendo hijo del DOM de `contenedorRef` (fixed no lo saca del
  árbol), así que ahora se ignora el scroll cuando su objetivo está
  dentro de `contenedorRef` (el propio botón o panel) — mismo criterio
  que ya usaba `manejarClickFuera` para reconocer "esto es del propio
  desplegable", solo que aplicado también al listener de scroll.

- **"Tarjetas" (jugador) también excluye porteros y gana el filtro de
  posición** (petición directa, olvidada en la ronda anterior — las
  casas rara vez dejan apostar a que el portero vea tarjeta, así que
  deja de ser la excepción). Solo hizo falta añadir `"tarjetas"` a
  `SUBCATS_JUGADOR_SIN_PORTEROS` en `SelectorMercado.jsx` — los dos
  efectos (excluir porteros del desplegable, y ofrecer el filtro
  Defensas/Centrocampistas/Delanteros) ya dependían de ese mismo
  conjunto, así que salen solos, sin tocar nada más. El scroll deslizante
  y el arreglo del desplegable cortado (fases anteriores) también se
  heredan solos, al ser el mismo componente compartido.

- **Documentación separada en `CLAUDE.md` (estado actual) + `CHANGELOG.md`
  (historial)** (petición directa). `CLAUDE.md` había crecido a más de
  3000 líneas — se carga entero como instrucciones de proyecto al
  empezar cada sesión, así que todo ese historial narrativo pesaba en
  cada arranque aunque casi nunca hiciera falta releerlo. Corte y pega
  sin resumir: todo el contenido bajo "Fases futuras (22)" en adelante
  (peticiones directas, bugs y su causa, cosas probadas y descartadas)
  pasa tal cual a este archivo nuevo, `CHANGELOG.md`, en el mismo orden
  cronológico. `CLAUDE.md` se queda con Stack, Identidad visual,
  Funcionalidades objetivo, Fases de construcción, Backlog pendiente y
  Convenciones de código — nada más — más una nota corta señalando que el
  porqué de cada cosa vive aquí. A partir de ahora, las entradas nuevas de
  historial (como esta) se añaden directamente a este archivo, no a
  `CLAUDE.md`.

- **Filtrar a países/competiciones con partidos hoy, y auto-expiración de
  torneos de un solo partido (Supercopa de Europa)** (petición directa,
  dos cambios relacionados en el buscador de partidos).
  - **Solo países/competiciones con partidos ese día**: con 19 países
    conectados, la mayoría de días la mayoría no tenía ningún partido —
    el desplegable de País los enseñaba todos igual, y había que probar
    uno a uno para encontrar cuál tenía algo. Nueva
    `paisesConPartidosHoy(partidos)` en `BuscadorEvento.jsx`: filtra
    `PAISES_CONECTADOS` usando los partidos que `usePartidos(fecha)` ya
    había traído para esa fecha (sin ninguna llamada nueva a la API) —
    un país solo se enseña si al menos una de sus competiciones tiene
    partidos ese día, y dentro de un país visible, el desplegable de
    Competición hace lo mismo a su nivel. "Otras ligas" no depende de
    esto, se queda siempre visible. `TABS_PAIS` deja de ser una constante
    de módulo (ya no puede serlo, depende de "partidos") y pasa a
    calcularse en cada render como `tabsPais`.
  - **Competiciones "temporales" (torneos de un solo partido)**: nuevo
    campo `temporal: true` en la lista curada de `api/partidos.js`
    (`LIGAS`), pensado para poder marcar en el futuro también la
    Supercopa de España o la Nations League sin repetir esta lógica —
    ninguna de las dos añadida todavía, solo la Supercopa de Europa. Para
    las competiciones marcadas así, además del filtro de arriba (que ya
    las oculta cualquier día sin partidos), `competicionTienePartidosActivos`
    (`BuscadorEvento.jsx`) las oculta también EL MISMO día en cuanto
    todos sus partidos de esa edición están en un estado terminado
    (`ESTADOS_FINALIZADOS`: FT/AET/PEN — no solo "FT" literal como se
    pidió al principio, para cubrir también el caso de que se decida en
    prórroga o penaltis, que sí le pasó a esta competición en 2023) — así
    no se queda "fantasma" en el desplegable el resto de la temporada. El
    flag viaja en cada partido de la respuesta de `api/partidos.js`
    (`temporal: !!LIGAS[p.league.id].temporal`), no hace falta guardarlo
    aparte en `utils/ligasConectadas.js`.
  - **Supercopa de Europa añadida a `LIGAS`** (id 531, "UEFA Super Cup" en
    API-Football, país "World"): verificada por curl directo contra la
    API el 2026-08-12, mismo patrón que las 10 ligas anteriores —
    `GET /fixtures?league=531&season=2025` respondió con
    `errors.plan` (el plan gratuito de consultas por liga+temporada solo
    cubre 2022-2024, restricción aparte y no representativa de cómo
    consulta esta app), así que se confirmó con `season=2023` (dentro del
    rango permitido): partido real, Manchester City 🆚 Sevilla, decidido
    por penaltis. Y con el método que sí usa la app de verdad,
    `GET /fixtures?date=2026-08-12` devolvió el partido real de HOY sin
    ningún error de plan: **Paris Saint-Germain - Aston Villa, 21:00,
    estado "NS"** — la Supercopa de Europa 2026 se juega justo hoy,
    confirmando el id a la vez que se probaba el filtro con datos reales
    (comprobado con `vercel dev` contra `/api/partidos?fecha=2026-08-12`:
    solo Argentina y Competición Europea tenían partidos, y dentro de
    Competición Europea solo Conference League y Supercopa de Europa —
    Champions/Europa League no tenían nada ese día, correctamente
    ocultas).
  - **Bug real, detectado por el usuario al probarlo**: la Supercopa de
    Europa se añadió en `api/partidos.js` (de donde vienen los partidos)
    pero se quedó fuera de `utils/ligasConectadas.js` (la lista que
    decide qué mostrar en el desplegable de Competición) — el partido se
    traía bien, pero la competición nunca llegaba a aparecer como opción.
    Corregido añadiéndola también ahí. El comentario de cabecera de
    `ligasConectadas.js` se amplía para dejar constancia de este fallo
    concreto, como aviso para la próxima liga que se añada.

- **Reagrupación del desplegable de País: Grandes ligas / Competición
  Europea / Europa / América, y "Reino Unido" → "Inglaterra"** (petición
  directa). `utils/ligasConectadas.js` pasa de una lista plana de países
  (`PAISES_CONECTADOS`) a `GRUPOS_LIGAS`, con un nivel nuevo por encima
  del país: "Grandes ligas" (España, Inglaterra, Alemania, Francia,
  Italia — en ese orden fijo, no alfabético), "Competición Europea"
  (grupo propio ahora, ya no anidado dentro de "Europa" — mismas 4
  competiciones de siempre: Champions/Europa/Conference/Supercopa),
  "Europa" (Austria, Bélgica, Dinamarca, Holanda, Noruega, Portugal,
  Suecia, Suiza, Turquía) y "América" (fusión de las antiguas Sudamérica/
  Norteamérica: Argentina, Brasil, Estados Unidos, México). "Otras ligas"
  sigue fija al final, sin cambios. `api/partidos.js` cambia sus 4 ligas
  inglesas de `pais: "Reino Unido"` a `pais: "Inglaterra"` para que el
  nombre siga coincidiendo exactamente entre los dos archivos (regla ya
  existente, documentada en la cabecera de `api/partidos.js`).
  - **"Competición Europea" es un tipo de grupo distinto**: en vez de
    `paises`, lleva `competiciones` directamente (sus 4 entradas no están
    organizadas por país) — mismo patrón que ya usa `ARBOL_MERCADOS` en
    `utils/mercados.js` para distinguir un nodo hoja de uno con más
    niveles debajo (nunca los dos campos a la vez). `BuscadorEvento.jsx`
    distingue los dos tipos con `esGrupoDirecto(grupo)` (`!!grupo.competiciones`).
  - **Cascada de navegación ampliada a un nivel más** (antes país →
    competición → partido; ahora grupo → país → competición → partido, o
    grupo → competición → partido en el caso directo): `grupoFiltro`
    nuevo, `paisFiltro`/`competicionFiltro` se reutilizan tal cual.
    `elegirGrupo` resetea país y competición; `elegirPaisDeGrupo` resetea
    competición Y de paso decide si hace falta preguntarla: si el país
    elegido solo tiene una competición con partidos hoy (tras aplicar el
    filtro de la fase anterior), la auto-selecciona sola y el paso de
    competición no llega a mostrarse — mismo patrón ya usado en
    `SelectorMercado.jsx` (`elegirTop`) para categorías con una única
    subcategoría. España/Inglaterra/Alemania/Francia/Italia sí tienen más
    de una (liga, segunda división, copa) y necesitan el paso; el resto
    de países conectados solo tienen una competición cada uno, así que en
    la práctica siempre saltan directos a partidos.
  - **El filtro de "solo con partidos hoy" (fase anterior) se aplica
    ahora también al nivel de grupo**: un grupo entero se oculta si
    ninguno de sus países (o, en Competición Europea, ninguna de sus
    competiciones) tiene partidos ese día — extensión directa del mismo
    criterio que ya ocultaba países/competiciones sueltas, no pedida de
    forma explícita en este mensaje pero coherente con el ejemplo ya
    dado en la fase anterior ("si hoy solo hay partidos de Conference
    League, el desplegable de País debe mostrar únicamente 'Competición
    Europea'" — con grupos, el equivalente es que el resto de grupos
    tampoco aparezcan si están vacíos ese día).
  - **Bandera de "Inglaterra"**: reutiliza la emoji del Reino Unido
    (🇬🇧) a propósito, no la bandera real de Inglaterra — esa es un
    emoji "de subdivisión" (secuencia con tags, más compuesta todavía
    que las banderas normales de país), con más riesgo de no
    renderizarse bien en Windows, el mismo problema ya documentado para
    banderas compuestas en general.
  - **Verificado con datos reales** (`vercel dev`, mismo día): con las
    ligas de hoy (Argentina y Competición Europea con partidos, el resto
    sin nada), "Grandes ligas" y "Europa" no aparecen como pestaña de
    grupo, "Competición Europea" muestra directo sus 2 competiciones
    activas (Conference League, Supercopa), y "América" muestra solo
    Argentina como país (única con partidos), que al elegirla salta
    directa a sus partidos sin pedir competición (solo tiene una).
  - **Pendiente, anotado en el backlog de `CLAUDE.md`, no implementado
    todavía**: futuro grupo "Competición Internacional" (UEFA Nations
    League, Eurocopa —clasificación y torneo—, Mundial —clasificación
    Europa y torneo—), a la espera de valorar cobertura en el plan
    gratuito de API-Football cuando se retome.

- **Campo "Competición" opcional en "Otras ligas"** (petición directa,
  para que un evento escrito a mano también pueda mostrar la liga en el
  detalle de la apuesta, igual que ya hace un partido elegido del
  buscador conectado). Solo un campo, sin país: pedir también un país
  para una liga que por definición no está en la lista curada habría sido
  más fricción de la que aporta, en un modo pensado como la vía de
  escape más simple posible.
  - `BuscadorEvento.jsx` gana un input opcional "Competición" (solo en
    modo manual, junto al botón "Listo"), con sus props `competicion`/
    `onCambiarCompeticion`. `ConstructorPartido.jsx` ya tenía
    `partido.competicion` en su estado (hasta ahora solo se rellenaba al
    elegir un partido real) — solo hizo falta conectar el campo nuevo a
    ese mismo campo, sin tocar nada del resto de la cadena
    (`FormularioApuesta.jsx`, `useApuestas.js`) porque ya sabían leer y
    guardar `competicion` desde que existen los partidos conectados.
  - `ApuestaItem.jsx`: la línea "Competición · País" que solo se pintaba
    con `grupo.pais` pasa a `etiquetaLiga` (nueva constante local, en los
    dos sitios del archivo que la mostraban) — "Competición · País" si
    hay los dos, solo "Competición" si solo hay eso (el caso de Otras
    ligas), `null` si no hay nada, igual que antes.

- **Marcador final escrito a mano, solo en "Otras ligas"** (petición
  directa, tras confirmar que un partido de Otras ligas nunca puede tener
  el marcador automático — sin `partidoId` no hay nada que consultar en
  `usePartidoInfo.js`). Dos campos nuevos por selección (jsonb, sin
  migración de esquema, mismo patrón que `pais`/`competicion`/`hora`):
  `golesLocalManual`/`golesVisitanteManual`, guardados en la selección
  líder del partido — mismo sitio que ya usa `cuota`.
  - Nueva `actualizarMarcadorManual(id, indice, golesLocal, golesVisitante)`
    en `useApuestas.js`, mismo patrón que `actualizarCuotaSeleccion`
    (reescribe el array `selecciones` completo, no hay columna propia).
    Enhebrado como prop (`onActualizarMarcadorManual`) por la misma
    cadena que ya llevaba `onActualizarCuotaSeleccion`: `App.jsx` →
    `PantallaInicio.jsx`/`ListaApuestas.jsx`/`EstadisticasDashboard.jsx`
    → `ApuestaItem.jsx`.
  - `agruparSeleccionesPorPartido` (`utils/apuestas.js`) expone los dos
    campos en cada grupo; `bloquesDesdeApuesta` y `manejarEnvio`
    (`FormularioApuesta.jsx`) los preservan al editar una apuesta por el
    formulario completo — mismo motivo que ya llevó a preservar
    `resultado` ahí: sin esto, "Editar todo" habría borrado en silencio
    un marcador ya anotado.
  - `ApuestaItem.jsx`: el bloque del marcador (equipo + gol a la derecha,
    ya existente para partidos conectados) pasa a mostrarse también con
    `hayMarcadorManual`, no solo con `terminado` — mismo diseño, los
    números salen de `grupo.golesLocalManual`/`golesVisitanteManual` en
    vez de `info.golesLocal`/`golesVisitante`. Debajo, un enlace "✎ Añadir
    marcador"/"✎ Editar marcador" (solo si el partido es de Otras ligas —
    `!grupo.partidoId` — y no está en `soloLectura`) abre dos campos
    numéricos + Guardar/Cancelar, mismo patrón que el aviso de "Ajustar
    cuota" tras anular un pick.

- **Bot de Telegram para resolver apuestas pendientes** (petición directa,
  con una maqueta HTML de referencia adjunta). Antes de implementar se dio
  primero una opinión técnica (pedida explícitamente: "Antes de nada, dame
  una opinión"), tras revisar cómo funciona hoy `marcarResultado`/
  `marcarResultadoSeleccion` (`useApuestas.js`), el saldo de freebet
  (`useCasas.js`) y los trofeos (`trofeos.js`) — y se plantearon tres
  decisiones de diseño antes de tocar código, las tres resueltas con la
  opción recomendada:
  - **Autenticación con Supabase**: un webhook no tiene sesión de
    navegador (RLS), así que no puede usar la clave anónima de siempre.
    Se descartó guardar la contraseña real de la cuenta como variable de
    entorno; en su lugar, `api/_lib/supabaseAdmin.js` crea un cliente con
    la *service role key* de Supabase (salta el RLS, patrón estándar para
    procesos de confianza), filtrando igualmente cada consulta por
    `SUPABASE_USER_ID` como defensa extra aunque no sea estrictamente
    necesario con esa clave.
  - **Guardado al toque, sin botón "Guardar"**: la maqueta HTML pedía un
    botón que aplicase todo junto al final, pero `ApuestaItem.jsx` ya no
    funciona así de verdad — cada pick se escribe al instante al tocarlo
    (`marcarPick` en el componente). Un botón "Guardar" habría sido en
    realidad un comportamiento *nuevo*, no "el mismo que la app", y encima
    habría exigido guardar un estado temporal en el servidor (los
    webhooks de Telegram no tienen memoria entre mensajes). Se implementó
    igual que la app: cada V/X/- escribe de inmediato.
  - **Caso "Nula" en partidos con varios mercados**: en la app, anular un
    pick de un partido con más de un mercado abre un aviso pidiendo la
    nueva cuota ajustada por la casa (paso que no estaba en el pedido
    original). Se dejó fuera de esta primera versión del bot — ese ajuste
    concreto se sigue haciendo desde la app.
  - Reutilización real de lógica, no solo "mismo efecto": beneficio,
    yield, racha y trofeos no se guardan en ningún sitio (se recalculan
    siempre a partir del array de apuestas), así que no hacía falta
    replicar nada de eso. Lo único que había que escribir es exactamente
    lo que ya escriben `marcarResultado`/`marcarResultadoSeleccion` — así
    que `api/_lib/apuestasResueltas.js` **importa directamente**
    `agruparSeleccionesPorPartido`/`derivarResultadoApuesta` de
    `src/utils/apuestas.js` (son funciones puras, sin nada de React, así
    que una Serverless Function las puede usar igual que un componente) en
    vez de reescribir esa lógica de cero. Se portó también el efecto
    colateral de freebet que sí existe en `App.jsx`
    (`manejarMarcarResultado`): seguro perdido devuelve freebet al perder,
    nula con fondos freebet devuelve el stake — mismo cálculo que
    `ajustarSaldoFreebet` en `useCasas.js`, reimplementado ahí porque un
    hook de React no se puede llamar fuera de un componente.
  - Antes de darlo por bueno, se probó la lógica portada con un script
    suelto (fuera del repo) que simula los tres casos exactos de la
    maqueta — pick simple, multi de un mismo partido con varios mercados,
    combinada de dos partidos — más un caso de freebet anulada, contra la
    función real `marcarPick`/`marcarResultadoApuesta` con un Supabase de
    mentira: los 9 casos (incluido el de deshacer un pick tocando el
    mismo botón otra vez, y el de "perdida matemática pero con mercados
    del mismo multi aún sin decidir, que no debe sellarse todavía")
    salieron todos correctos.
  - Limitaciones reales de Telegram frente a la maqueta (no es un recorte
    de alcance, es que la plataforma no lo permite): los mensajes de
    Telegram no admiten texto de color personalizado, así que el estado
    de cada pick se muestra con emoji + negrita/tachado (`parse_mode:
    "HTML"`) en vez de cambiar de color; y el teclado de botones de un
    mensaje siempre aparece junto debajo de todo el texto, nunca pegado a
    cada línea — por eso cada pick sale numerado y su fila de botones
    lleva el mismo número, para que la relación quede clara aun sin estar
    una al lado de la otra.
  - Seguridad del webhook: además de comprobar `TELEGRAM_OWNER_ID` (tu ID
    de Telegram, que en realidad no es un dato secreto — cualquiera podría
    intentar adivinarlo o verlo en un grupo compartido), se añadió el
    `secret_token` que permite fijar `setWebhook` de Telegram: sin ese
    valor exacto en la cabecera `X-Telegram-Bot-Api-Secret-Token`, la
    petición se descarta antes de leer o tocar nada de Supabase — sin
    esto, cualquiera que descubriera la URL del webhook podría intentar
    mandar peticiones falsas suplantando tu ID.
  - Cash Out: como Telegram no guarda estado entre mensajes, al pulsar
    "💰 Cash Out" el bot pide el importe con `force_reply` y mete el id de
    la apuesta como texto legible dentro del propio mensaje de la
    pregunta ("Ref: &lt;uuid&gt;") — al llegar la respuesta, se recupera
    de ahí con una expresión regular en vez de con una tabla nueva de
    "sesiones pendientes".
  - `/pendientes` manda un mensaje por apuesta pendiente (igual que la
    maqueta), con un teclado con una fila de tres botones (V/X/-) por
    cada mercado y, si la apuesta sigue pendiente, una fila final con
    "💰 Cash Out".
  - No se puede registrar ni probar el webhook en local (`vercel dev`
    sirve para no exponer la key de API-Football, pero Telegram necesita
    una URL pública de verdad para poder mandar los mensajes) — instrucciones
    de registro y variables de entorno nuevas anotadas en `CLAUDE.md` y
    `.env.example`. Pendiente de que el usuario cree el bot con
    @BotFather, rellene las variables en Vercel y registre el webhook tras
    desplegar, antes de poder usarlo de verdad.

- **Puesta en marcha real del bot** (con el usuario, paso a paso): token de
  @BotFather pegado en el chat — guardado en `.env.local` (gitignored, solo
  referencia local) y avisado explícitamente de que eso NO lo sube a
  Vercel, hay que pegarlo también a mano en su panel. `TELEGRAM_WEBHOOK_SECRET`
  generado con `openssl rand -hex 24` para no obligar al usuario a
  inventar uno. Guiado paso a paso a por `SUPABASE_SERVICE_ROLE_KEY`
  (detectado que el proyecto ya usa el sistema de claves nuevo de
  Supabase, `sb_publishable_.../sb_secret_...`, no las clásicas
  `anon`/`service_role`), `SUPABASE_USER_ID` (Authentication > Users) y
  `TELEGRAM_OWNER_ID` (con `@userinfobot`, que resultó no responder a
  `/start` como se esperaba — hacía falta reenviarle un mensaje propio; al
  fallar eso por privacidad de reenvíos, se cambió a `@RawDataBot`, que sí
  responde el ID directo con `/start`).
  - **Bug real**: la primera vez que se pegó `SUPABASE_SERVICE_ROLE_KEY` en
    Vercel se coló un salto de línea en medio del valor (típico de copiar
    seleccionando texto a mano en vez de con el botón de copiar) — el
    cliente de Supabase fallaba con `TypeError: Headers.set: ... is an
    invalid header value`. Para poder diagnosticarlo se corrigió antes un
    fallo del propio bot: si la consulta a Supabase fallaba, `/pendientes`
    enseñaba el mismo mensaje que "no tienes pendientes", sin forma de
    distinguir un error real de que de verdad no hubiera ninguna — se
    separaron los dos casos (mensaje de error explícito + log en Vercel),
    y de paso se mostró temporalmente el `user_id` usado en el mensaje de
    "sin pendientes", para comparar contra el UID real mientras se
    depuraba. Ambos ayudaron a encontrar el salto de línea; el aviso de
    `user_id` se quitó en cuanto se resolvió.
  - Ajustes visuales tras probarlo de verdad: los botones V/X/- pasaron a
    los mismos emoji que ya usaba el texto de estado (✅/❌/➖, lo más
    parecido a los círculos de color de `ApuestaItem.jsx` que admite un
    botón de Telegram) y se les quitó el número delante. Una combinada de
    varios partidos con muchos mercados (petición directa: "si son 5
    partidos con 10-12 selecciones, van a salir muchas filas") se dividió
    en un mensaje por partido en vez de uno solo con todos los botones
    apilados; el primer intento mandaba además una "cabecera" suelta (solo
    estado + Cash Out, sin ningún partido) que quedaba rara en el chat
    ("se ve raro" — confirmado con `AskUserQuestion` que era justo eso), así
    que ese estado/Cash Out se fundió dentro del mensaje del primer
    partido en vez de un mensaje aparte casi vacío.

- **Mini App de Telegram para resolver apuestas con diseño de ticket**
  (petición directa, con `betslip-demo.html` como maqueta de referencia).
  Antes de tocar código se dio opinión técnica igual que con el bot,
  porque dos partes del pedido chocaban con cómo está montada la app:
  - **El resultado final (marcador) no tenía ningún conflicto real**: es
    un endpoint público sin sesión (`api/partido.js`), así que el hook
    `usePartidoInfo.js` se podía llamar tal cual desde la Mini App. Donde
    SÍ había un problema de verdad era en las ESCRITURAS (marcar un pick,
    Cash Out): `useApuestas.js` escribe con la clave anónima protegida por
    RLS, que exige una sesión de Supabase real — y una Mini App abierta
    dentro de Telegram arranca sin ninguna. Verificar el `initData` que
    manda el SDK demuestra quién eres ante Telegram, no ante Supabase.
  - Se plantearon dos decisiones con `AskUserQuestion`, las dos resueltas
    con la opción recomendada: (1) escrituras vía service role — mismo
    patrón que ya usa el bot, reutilizando literalmente
    `api/_lib/apuestasResueltas.js`, en vez de emitir sesiones de Supabase
    reales (enlace mágico) desde el servidor, mecanismo bastante más
    delicado para lo que se ganaba; (2) ruta `/telegram/apuesta/:id`
    resuelta a mano por `window.location.pathname` en `src/main.jsx` (el
    proyecto no tiene `react-router-dom` ni ningún router hasta ahora), en
    vez de añadir esa dependencia nueva solo para esta pantalla.
  - Para que la Mini App pudiera reutilizar el hook `usePartidoInfo.js`
    exactamente igual que `ApuestaItem.jsx` (petición explícita: "si se
    detecta que se está escribiendo una llamada a `api/partido.js` o
    similar específica para esta ruta, es una señal de que se está
    duplicando lógica — corrígelo"), se exportaron de `ApuestaItem.jsx`
    las piezas que ya existían para esto (`InfoPartido`, envoltorio
    "render prop" que llama al hook una vez por partido;
    `horaInicioPartido`; `ESTADOS_TERMINADOS_API`) en vez de reimplementar
    ese wrapper. La caché compartida en Supabase (`resultados_partidos`)
    sigue con su misma política de RLS (`auth.role() = 'authenticated'`),
    así que dentro de la Mini App (sin sesión) esa lectura/escritura de
    caché concreta no tiene efecto — se degrada solo a pedir siempre a
    `api/partido.js` (que tiene su propia caché de borde de Vercel de 5
    minutos, independiente de Supabase), nunca rompe nada; se aceptó esa
    pérdida menor de eficiencia en vez de tocar un hook central y ya
    probado de la app por una ganancia pequeña.
  - **Refactor sin lógica nueva**: `desdeFila` (fila de Supabase →
    objeto camelCase) vivía dentro de `useApuestas.js`, que importa el
    cliente de Supabase del navegador (`import.meta.env.VITE_...`) — al
    intentar reutilizarla en `api/telegram-apuesta.js` (Node, no
    navegador) esa importación habría reventado el arranque de la función
    entera (`import.meta.env` no existe fuera de Vite). Se movió a
    `src/utils/apuestas.js` (sin dependencias de navegador, ya se
    reutilizaba en servidor) y `useApuestas.js` pasó a importarla de ahí
    — mismo comportamiento, cero lógica duplicada, sin el riesgo de
    reventar el import.
  - Nuevo `api/_lib/telegramInitData.js`: verifica la firma HMAC del
    `initData` (algoritmo oficial de Telegram) contra `TELEGRAM_BOT_TOKEN`
    y comprueba el `auth_date` (caduca a las 24h, para que una URL vieja
    filtrada en algún sitio no sirva para siempre). Probado con un script
    suelto (fuera del repo) con 5 casos: firma válida se acepta, dato
    manipulado tras firmar se rechaza, firmado con otro token se rechaza,
    caducado se rechaza, sin hash se rechaza — los 5 correctos.
  - `api/telegram-apuesta.js`: GET trae una apuesta (con `desdeFila`,
    misma forma que usa toda la app), POST aplica un pick o un Cash Out —
    ambos casos llaman a `marcarPick`/`marcarResultadoApuesta` de
    `api/_lib/apuestasResueltas.js`, ya usadas por el bot: nada de lógica
    de negocio nueva, solo el verificado de `initData` alrededor.
  - `src/components/TicketApuesta.jsx` (presentacional, muescas + sello
    rotado + divisor punteado de la maqueta, tipografías cambiadas a
    Fraunces/IBM Plex Mono para encajar con el resto de la app) +
    `src/components/TelegramMiniApp.jsx` (orquesta el SDK de Telegram,
    `initData`, fetch a `api/telegram-apuesta.js`, y el `MainButton` nativo
    para el flujo de Cash Out: un primer toque abre un campo de importe en
    la propia página —Telegram no tiene un `prompt` de texto nativo—, el
    segundo confirma).
  - Como resolver ahora pasa por la Mini App, `/pendientes` del bot se
    simplificó bastante: ya no manda botones V/X/-/Cash Out por chat
    (habría sido una segunda vía de resolución en paralelo, sin lógica
    duplicada de verdad pero sí interfaz duplicada) — manda un resumen de
    texto por apuesta y un único botón "📱 Abrir apuesta" que abre el
    ticket. Decisión tomada por el asistente sin preguntar (el usuario
    había dejado "en vez de (o además de)" a su criterio), avisada al
    informar del trabajo por si se prefiere recuperar los botones planos
    también.
  - No hacen falta variables de entorno nuevas: reutiliza las cinco que ya
    tenía el bot. Probado por el usuario dentro de Telegram de verdad tras
    desplegar: "GUAU! Funciona! Queda super bien." — confirmado el flujo
    completo (abrir el ticket, marcar picks, Cash Out).

- **Aviso de "partido terminado" por Telegram** (petición directa, tras
  varias rondas de preguntas del usuario sobre coste y viabilidad — ver
  abajo). La idea: en cuanto un partido con apuestas pendientes termina,
  llega un mensaje "⚽ X ha terminado. Ya puedes confirmar tu apuesta." con
  botón directo a la Mini App, en vez de tener que acordarse de mirar.
  - **Primer obstáculo, resuelto consultando la documentación de Vercel en
    vivo** (`vercel.com/docs/cron-jobs/usage-and-pricing`, no de memoria):
    el plan Hobby (el del usuario) limita sus cron jobs propios a una vez
    al día, con hora imprecisa (±59 min) — insuficiente para avisar poco
    después de que termine un partido. Solución: nada impide que un
    servicio EXTERNO gratuito llame al endpoint con más frecuencia (el
    límite de Vercel es solo para SU propio programador de crons, no para
    peticiones normales de fuera) — se recomendó
    [cron-job.org](https://cron-job.org), gratis, cada 15 minutos.
  - El usuario pidió el desglose exacto de llamadas para un caso extremo
    antes de decidirse: 15 apuestas (8 combinadas de 4 a 7 partidos + 7
    picks simples) con partidos repetidos entre combinadas. Se explicó
    el principio central del diseño: el coste va por **partido distinto**,
    no por apuesta ni por pick, porque la caché (`resultados_partidos`) es
    compartida por `partido_id` — un partido en 3 combinadas a la vez
    sigue costando 1 sola llamada. Con los números del usuario: 43
    partidos-slot en combinadas + 7 en simples = 50 como máximo (si no se
    repitiera ninguno); el número real baja según cuántos se repitan de
    verdad. Muy lejos del límite de 100/día en cualquier caso.
  - Aclarado también, tras una pregunta del usuario, que los 15 minutos
    son la frecuencia con la que el sistema MIRA en silencio por detrás
    (sin mandar nada si no hay nada nuevo), no la frecuencia de los
    avisos que recibe — cada partido genera como mucho 1 mensaje, el día
    que de verdad termina.
  - **Refactor sin lógica nueva, para poder construirlo sin duplicar**:
    `ESTADOS_TERMINADOS`/`MARGEN_MS` vivían duplicados (una copia en
    `usePartidoInfo.js`, otra en `ApuestaItem.jsx` con otro nombre) y
    `horaInicioPartido` vivía dentro de `ApuestaItem.jsx` (un `.jsx`, que
    una Serverless Function de Node no puede importar sin arrastrar JSX/
    React innecesariamente). Las tres piezas se movieron a
    `src/utils/apuestas.js` (`ESTADOS_TERMINADOS_PARTIDO`,
    `MARGEN_RESULTADO_MS`, `horaInicioPartido`), y tanto `usePartidoInfo.js`
    como `ApuestaItem.jsx` pasaron a importarlas de ahí — mismo
    comportamiento exacto, una sola copia de cada una, y ya sin nada de
    JSX en el camino de import de la nueva función de servidor.
  - Nueva columna `notificado` en `resultados_partidos` (migración en
    `supabase-setup.sql`, pendiente de que el usuario la ejecute): sin
    esto, cada revisión del cron habría vuelto a avisar del mismo partido
    una y otra vez tras detectarlo terminado la primera vez.
  - `api/telegram-avisos.js`: agrupa las apuestas pendientes por
    `partidoId` (un partido puede estar en varias apuestas a la vez —
    ver el caso de las 15 apuestas de arriba), consulta como mucho 1 vez
    por partido distinto (reutilizando `api/partido.js`, la misma caché
    de Vercel de siempre), y manda un único mensaje por partido con un
    botón por cada apuesta afectada — no un aviso repetido por apuesta.
    Protegido con `AVISOS_CRON_SECRET` (variable nueva, distinta del
    `secret_token` del webhook: aquí quien llama es cron-job.org, no
    Telegram, así que no puede demostrar la misma firma).
  - Probado con un script suelto (fuera del repo) el agrupado por
    partidoId con un caso parecido al de las 15 apuestas del usuario
    (varias apuestas compartiendo partido, uno sin pasar aún el margen,
    uno de Otras ligas sin `partidoId`) — los 8 casos salieron correctos
    antes de dar el trabajo por bueno.
  - Pendiente de que el usuario: ejecute la migración SQL en Supabase,
    rellene `AVISOS_CRON_SECRET` en Vercel, y configure el cron en
    cron-job.org apuntando a `.../api/telegram-avisos?secret=...` cada 15
    minutos — ninguno de esos tres pasos se puede hacer desde aquí (son
    cuentas/paneles del propio usuario).
  - **Puesto en marcha y probado de verdad por el usuario, con dudas
    resueltas sobre la marcha**: al reutilizar el mismo partido de prueba
    para una segunda "Ejecución de prueba" en cron-job.org, no llegó
    aviso — no era un fallo, era el propio `notificado` haciendo su
    trabajo (ya se había avisado de ese partido en la primera prueba); se
    explicó y se resolvió probando con un partido distinto. Confirmado
    también que borrar el historial del chat en Telegram (móvil) no corta
    los avisos — solo borra lo que ves tú, no bloquea al bot. Prueba final
    con un partido real de un día anterior: "Funciona. Llega notificación
    al móvil, genial."
  - Se planteó (y se descartó, con acuerdo del usuario) la idea de que
    SOLO se pudiera confirmar el resultado de una apuesta desde Telegram,
    quitándole esa función a la app web: la app sigue siendo la vía fiable
    sin depender de terceros (Telegram/cron-job.org/Vercel a la vez, ni de
    tener el móvil a mano) — Telegram es un atajo cómodo, no un sustituto.
    Ninguna ganancia real tampoco: la lógica ya era 100% compartida antes
    de esta decisión, quitar los botones de la web no habría reducido
    duplicación ninguna, solo una vía de resolver que ya funcionaba bien.

- **Número de apuesta por categoría en los mensajes de `/pendientes`**
  (petición directa: identificar de un vistazo cuál es cuál cuando hay
  varias pendientes a la vez del mismo bankroll). "Apuesta nº8 ·
  Entretenimiento" = la octava apuesta de Entretenimiento creada, por
  orden de `creado_en` — se calcula al vuelo en cada `/pendientes`
  (`calcularNumerosPorCategoria` en `api/telegram-webhook.js`), sin
  guardar ningún número en Supabase; si algún día se borra una apuesta
  antigua de esa categoría, los números posteriores se recolocan solos
  (aceptado como detalle cosmético menor, no afecta a nada más). Se
  enseñó primero una maqueta en texto del mensaje resultante antes de
  tocar código, para confirmar el formato exacto.

- **Ampliación: aviso al registrar + rediseño del aviso de "partido
  terminado" por apuesta** (petición directa, varias rondas de maquetas en
  texto antes de tocar código, como ya venía siendo la norma en esta
  sesión). El pedido original era más amplio de lo que parecía a primera
  vista — quedó en tres piezas:
  - `calcularNumerosPorCategoria` se sacó de `api/telegram-webhook.js` a
    un archivo nuevo, `api/_lib/numeracion.js`, para poder reutilizarlo
    también en los dos archivos siguientes — el mismo número de apuesta
    sale igual en los tres sitios.
  - **Aviso al registrar** (`api/telegram-registro.js`, disparador nuevo
    que no existía): la app web no puede avisar a Telegram ella sola (el
    token del bot es secreto, no puede vivir en el navegador) — en vez de
    una llamada extra desde el frontend, se usa un **Database Webhook de
    Supabase** (Database > Webhooks, configurado a mano por el usuario;
    evento `INSERT` en `apuestas`), que dispara siempre pase lo que pase
    cómo se haya creado la apuesta. Protegido con `REGISTRO_WEBHOOK_SECRET`
    (variable nueva) vía una cabecera HTTP personalizada, configurada al
    crear el webhook en el panel de Supabase.
  - **Rediseño del aviso de partido terminado**: petición directa de que,
    si el mismo partido está en una apuesta de Entretenimiento y otra de
    Apuestas, sean dos mensajes separados en vez de uno combinado con dos
    botones (como se había construido inicialmente) — el mensaje pasa a
    estar centrado en LA APUESTA (con su número, categoría y la lista
    completa de sus partidos), no en el partido. Tras una pregunta directa
    ("¿cómo lo harías?"), se combinó nombrar el partido que dispara ESE
    aviso en el título ("⚽ X ha terminado") con marcarlo en la lista de
    abajo — usando 🏁, no ✅, porque el ✅ ya significa "pick marcado como
    Ganada" en el resto del bot y hubiera confundido los dos significados.
    Segunda pregunta directa (con el ejemplo de una combinada de 3
    partidos, uno ya terminado y otro terminando ahora) aclaró que la
    lista debía mostrar el estado ACUMULADO (los ya sabidos de antes
    siguen marcados 🏁, no solo el nuevo), no solo el del aviso actual.
  - Como un mismo partido ahora puede tener que avisar por separado a
    varias apuestas, "ya avisado" dejó de poder vivir en la caché
    compartida `resultados_partidos` (es por partido, no por apuesta) —
    pasa a guardarse en la propia selección líder de cada grupo
    (`avisoEnviado`, jsonb, mismo patrón que `golesLocalManual`, sin
    migración de esquema). Añadido a las listas blancas de
    `useApuestas.js`/`FormularioApuesta.jsx` y expuesto en
    `agruparSeleccionesPorPartido` (`utils/apuestas.js`) para que editar
    una apuesta por el formulario completo no lo borre en silencio —
    mismo motivo que ya llevó a proteger `resultado`/`golesLocalManual`
    antes: sin esto, un partido ya avisado podría volver a avisarse tras
    editar esa apuesta (fallo menor, no de dinero, pero evitable con el
    mismo cuidado de siempre).
  - Probado con un script suelto (fuera del repo) el caso completo de la
    combinada de 3 partidos que se van resolviendo uno a uno en distintos
    "ticks" del cron (primer partido termina → 1 aviso con la lista
    parcial; segundo termina más tarde → 1 aviso nuevo con la lista ya
    acumulada, sin repetir el primero; nada nuevo → 0 avisos), más el caso
    de un partido compartido por una apuesta de cada categoría (2 mensajes
    separados, no 1) — los 11 casos salieron correctos.
  - Pendiente de que el usuario configure el Database Webhook en Supabase
    y rellene `REGISTRO_WEBHOOK_SECRET` en Vercel — ninguno de los dos
    pasos se puede hacer desde aquí.
  - **Puesto en marcha por el usuario**: el Database Webhook de Supabase
    no aparecía como "Webhooks" en el menú de Database de este panel en
    concreto — tras un par de intentos fallidos (primero "Triggers", que
    resultó ser el sistema de triggers puro de Postgres, no esto), se
    encontró en **Integrations > Database Webhooks** (función oficial de
    Supabase, con su propio formulario de "HTTP Request": tabla, evento,
    URL, cabeceras). Configurado con éxito.
  - **Bug real detectado por el usuario en producción, con una apuesta del
    PSG que no recibió el aviso**: no fue un fallo del código — el
    partido empezó más tarde de lo que el usuario asumía al principio, y
    las revisiones automáticas de las 23:30/23:45 cayeron justo antes de
    que el margen de 2,5h terminara de cumplirse; la siguiente revisión
    (la manual, minutos después) sí lo cogió. Pero la pregunta del propio
    usuario ("¿el aviso siempre va a llegar mucho más tarde de que acabe
    el partido?") destapó un problema de diseño real, no un bug: las 2,5h
    son el margen pensado para la app (dar igual cuándo se abra el
    detalle a mano), pero para un aviso que se quiere rápido, sobran unos
    40-55 minutos en un partido sin prórroga. Se creó `MARGEN_AVISO_MS`,
    propio de `api/telegram-avisos.js` (no toca el margen de 2,5h que
    sigue usando el resto de la app) — el usuario aportó el cálculo
    exacto (90' + 1-2' de añadido en la 1ª parte + 5-6' en la 2ª + 15-17'
    de descanso ≈ 111-115' reales desde el inicio) y se fijó en **115
    minutos (1h55)**, justo ese cálculo, sin margen de sobra. Si a esa
    hora el partido aún no ha terminado (prórroga), se sigue revisando
    cada tick del cron hasta que sí lo esté, como ya pasaba — solo que
    empezando antes.
  - Subido después a **2h (120 min)**, a petición del usuario: 1h55
    quedaba demasiado ajustado a la duración real, disparando una
    segunda llamada de más en varios partidos — 2h deja 5-9' de aire sin
    llegar a costar esa llamada extra en la mayoría de los casos.

- **Investigación de un aviso que no llegó solo (apuesta real del PSG /
  Supercopa de Europa) — sin causa raíz confirmada, pero con un fallo real
  encontrado y corregido de paso.** El usuario reportó que, con casi 3h
  pasadas desde el inicio del partido, no había llegado ningún aviso
  automático — solo saltó al forzar una "Ejecución de prueba" en
  cron-job.org. Investigado juntos paso a paso: primero se descartó que el
  cron estuviera deshabilitado (reloj verde, próximas ejecuciones
  correctas); después, mirando los Logs de Vercel, se confirmó que las
  peticiones automáticas SÍ llegaban (200 OK, user-agent de cron-job.org)
  y que una de ellas, a las 23:33, sí había guardado el partido en
  `resultados_partidos` como terminado (confirmado con una consulta SQL
  directa) — pero el campo `avisoEnviado` de esa selección seguía en
  `false` hasta la prueba manual. Es decir: el partido se detectó
  terminado bastante antes de lo que parecía, pero el aviso de Telegram no
  se entregó en los intentos automáticos de en medio, sin ningún error
  visible en los logs.
  - No se pudo confirmar la causa exacta (se descartó timeout de Vercel:
    con Fluid Compute, Hobby da 300s por función, de sobra) — pero se
    encontró un fallo real de todas formas: `tg()` nunca comprobaba si
    Telegram había aceptado el mensaje de verdad. Si el envío fallaba por
    cualquier motivo, el código lo marcaba igualmente como "enviado" (o,
    en el peor caso, ni siquiera eso, dejando el estado a medias sin
    ningún registro de qué había pasado) — nunca se habría reintentado, y
    tampoco quedaba ningún rastro en los logs para saberlo después.
  - Corregido: `tg()` ahora revisa `ok` en la respuesta de Telegram y deja
    un `console.error` claro si algo falla; el envío de cada aviso va
    en su propio `try/catch` (un fallo de red o un rechazo de Telegram NO
    marca `avisoEnviado`, así que se reintenta solo en el siguiente tick
    del cron en vez de perderse para siempre); y el guardado final de
    `avisoEnviado` en Supabase también registra un error claro si falla,
    en vez de fallar en silencio. Con esto, si vuelve a pasar algo
    parecido, los logs de Vercel deberían dejar claro el motivo exacto en
    vez de tener que investigarlo a ciegas como esta vez.

- **Bug real: primera/última pestaña recortada en las filas deslizantes
  de `TabsDesplazables.jsx` en móvil** (detectado por el usuario en el
  selector de mercado, con capturas). Causa: el `div` del scroll tenía DOS
  reglas de padding lateral compitiendo por la misma propiedad — la clase
  `px-3` de Tailwind (pensada para compensar el `-mx-3` del contenedor
  exterior y que la primera/última pestaña no quedaran recortadas por el
  `overflow-hidden` de la tarjeta) y la clase propia `.mq-tabs-scroll`
  (pensada para dejar hueco a las flechas ‹ › solo con ratón). Con la
  misma especificidad, ganaba `.mq-tabs-scroll` por ir detrás en la hoja
  de estilos compilada — en escritorio (34px) sobraba de sobra y no se
  notaba, pero en táctil (8px) faltaban 4px de los 12px que hacían falta
  para compensar el `-mx-3`, así que la primera y la última pestaña se
  recortaban justo esos 4px. Corregido subiendo el valor táctil de
  `.mq-tabs-scroll` a 12px y quitando el `px-3` ya redundante del JSX —
  una sola regla, sin competencia. No se pudo verificar visualmente en un
  navegador de verdad (sin herramienta de captura en este entorno);
  pendiente de que el usuario lo confirme en el móvil tras desplegar.
  Probado en local con `vercel dev` (arrancado y parado durante la sesión;
  arrancar con `vite` a secas no sirve porque no sirve las funciones de
  `/api`, así que el buscador de partidos no encuentra nada — no es un bug,
  detalle aclarado en la sesión) mientras se comprobaba este mismo arreglo.

- **Marcador real en el aviso de partido terminado + nuevo aviso de
  "apuesta resuelta" + botones que cambian solos** (petición directa, a
  partir de un mockup hecho con ChatGPT). Antes de tocar código se aclaró
  qué parte del mockup era realista en Telegram (negrita/cursiva/tachado/
  emoji, nada de insignias de colores ni tarjetas — eso ya lo tiene la
  Mini App) y qué parte implicaba algo que la app nunca ha hecho a
  propósito: decidir sola si un pick ha acertado (la mayoría de mercados
  no se pueden derivar del marcador final, por eso siempre lo marcas tú a
  mano). Se resolvió con `AskUserQuestion`: el aviso "todo acertado" solo
  puede salir DESPUÉS de que el usuario termine de marcar el último pick a
  mano, no en cuanto el partido termina.
  - `api/telegram-avisos.js`: la lista de partidos de cada aviso pasa a
    enseñar el marcador real de los terminados (🏁 X — 2-1) y la hora de
    los que faltan por jugar (· Y — 21:00), en vez de solo el icono suelto.
  - Nuevo `api/telegram-resuelta.js`: segundo Database Webhook de
    Supabase, evento `UPDATE` en `apuestas` con el mismo
    `REGISTRO_WEBHOOK_SECRET` que ya usaba el de registro — dispara solo
    en la transición exacta `pendiente` → cualquier otra cosa (no en
    cualquier UPDATE: editar una apuesta ya resuelta, o cualquier otro
    cambio, no manda nada). Manda el marcador de cada partido (de
    `resultados_partidos`, o el marcador manual en partidos de Otras
    ligas) y el beneficio (`calcularBeneficio`, reutilizada tal cual, no
    reimplementada).
  - Nueva tabla `telegram_mensajes` (migración en `supabase-setup.sql`,
    pendiente de que el usuario la ejecute): guarda qué mensaje de
    Telegram (chat + id) lleva el botón "Ver apuesta"/"Abrir apuesta" de
    cada apuesta — puede haber varios (uno de `/pendientes`, uno por cada
    partido que va terminando en una combinada). `api/telegram-resuelta.js`
    usa esa lista para EDITAR esos botones cuando la apuesta se resuelve
    (✅ Ganada / ❌ Perdida / ➖ Nula / 💰 Cash Out en vez de "Ver
    apuesta" siempre igual) y borra las filas una vez editados.
  - **Refactor de paso**: `tg()`/`escapeHtml`/`URL_APP`, duplicados en los
    tres archivos de Telegram (`api/telegram-webhook.js`,
    `api/telegram-registro.js`, `api/telegram-avisos.js`, cada uno con su
    propia copia), se sacaron a `api/_lib/telegram.js` compartido — de
    paso corrige que `telegram-webhook.js` y `telegram-registro.js`
    tampoco comprobaban si Telegram aceptaba el mensaje (mismo fallo que
    ya se había corregido solo en `telegram-avisos.js` el día anterior),
    ahora la protección es la misma en los cuatro archivos.
  - Probado con un script suelto (fuera del repo) la condición exacta de
    disparo del aviso de "resuelta" (pendiente→ganada dispara,
    ganada→ganada por una edición NO vuelve a disparar, deshacer un
    resultado NO dispara) y que `calcularBeneficio`/`desdeFila` se
    reutilizan bien para una apuesta ganada y un cash out — los 10 casos
    salieron correctos.
  - Pendiente de que el usuario: ejecute la migración SQL de
    `telegram_mensajes`, y configure el segundo Database Webhook en
    Supabase (Integrations > Database Webhooks, evento `UPDATE`, misma
    URL base con `/api/telegram-resuelta`, misma cabecera
    `X-Registro-Secret`) — ninguno de los dos pasos se puede hacer desde
    aquí.
  - **Puesto en marcha por el usuario**: SQL ejecutado y segundo webhook
    configurado sin problema (no recordaba el valor del secreto del
    primero — se le recordó el que se había generado con `openssl rand`).
  - **Ajustes de formato tras probarlo de verdad, con mockups exactos del
    usuario para los tres mensajes**: más aire entre bloques (salto de
    línea entre el estado y la línea de fecha/casa/tipo, y entre esa línea
    y cada partido con sus mercados) en `/pendientes`
    (`api/telegram-webhook.js`) y en el aviso de "apuesta resuelta"
    (`api/telegram-resuelta.js`); e icono según el deporte de la apuesta
    (`api/_lib/telegram.js`, nuevo `iconoDeporte()` — ⚽ Fútbol, 🏀
    Baloncesto, 🎾 Tenis, 🎮 eSports, 🎲 Otro) junto a cada partido, en vez
    de un ⚽ fijo sin mirar el deporte real. En `api/telegram-resuelta.js`
    se detectó además que un partido sin marcador guardado (raro: solo si
    nunca se llegó a consultar/cachear) mostraba el reloj 🕐 de "pendiente"
    aunque la apuesta ya estuviera resuelta — no tenía sentido ahí, se
    cambió por el icono del deporte también en ese caso.
  - Añadido después, a petición directa, un salto de línea más entre el
    título ("Apuesta nºX · Categoría") y la línea de estado, en los tres
    mensajes — mismo criterio de "más aire" que el resto de bloques.

- **Bug real: el formulario de "Nueva apuesta" se quedaba colapsado tras
  registrar una apuesta** (detectado por el usuario, con captura). Al
  guardar, el resto de campos se reseteaban para la siguiente apuesta
  (fecha, casa, stake, bloques...), pero el bloque superior (que se
  colapsa solo al confirmarlo, para no tener que hacer scroll mientras se
  añaden varios partidos a una combinada) se quedaba tal cual lo había
  dejado la apuesta recién guardada — colapsado. El formulario aparecía
  con una tira resumen medio vacía (0,00€, sin casa) en vez de volver a
  abrirse entero para la siguiente. Corregido añadiendo `setConfirmado(false)`
  y `setBloqueSuperiorAbierto(true)` al final del reseteo, junto al resto
  de campos — mismo sitio, mismo motivo. No se pudo probar en un
  navegador de verdad en este entorno (sin esa herramienta); pendiente de
  que el usuario lo confirme.

- **Filtro por categoría en `/pendientes`, con teclado personalizado**
  (petición directa: "categorías debajo del nombre del canal, tipo Todas/
  Apuestas/Entretenimiento"). Aclarado antes de tocar código que Telegram
  no deja a los bots poner nada debajo del nombre del chat — esa zona es
  fija, de la propia app. Se ofrecieron dos alternativas reales
  (comandos nuevos `/apuestas`/`/entretenimiento`, o un teclado
  personalizado con botones fijos siempre visibles junto al cuadro de
  texto) y se eligió la segunda, "a probar": tres botones ("📋 Todas" /
  "💼 Apuestas" / "🎮 Entretenimiento" — mismos iconos que ya usa
  `SidebarNavegacion.jsx` en la app, Wallet→💼 y Gamepad2→🎮) que hacen lo
  mismo que `/pendientes` pero filtrado a un bankroll. El teclado se activa
  mandando `/start` (Telegram lo deja fijado en el chat desde ese momento,
  no hace falta reenviarlo en cada respuesta; convive sin problema con el
  botón "Abrir apuesta" de cada mensaje, que es un teclado en línea
  aparte). `enviarPendientes()` ganó un parámetro `categoria` opcional
  (null = todas) que añade `.eq("categoria", ...)` a la consulta solo
  cuando se filtra.

- **Aviso de "partido terminado" rediseñado a "apuesta lista para
  confirmar"** (petición directa, tras probar en real una combinada de
  hoy con 3 partidos a horas distintas): la primera versión mandaba un
  mensaje por CADA partido que iba terminando dentro de una misma
  apuesta — con varias apuestas pendientes a la vez llegaron unos 12
  avisos de golpe, "es mucho aviso". Se cambió a un único mensaje por
  apuesta, esperando a que TODOS sus partidos hayan terminado (en vez de
  avisar de "X ha terminado", el título pasa a ser genérico: "📝 Ya puedes
  confirmarla — todos sus partidos han terminado"), con el marcador real
  de cada partido debajo. El usuario confirmó que el retraso de 15-20 min
  tras el pitido final (lo que tarda en pasar el margen + el siguiente
  tick del cron) no le importa, lo importante es que llegue uno solo.
  También, en el mismo mensaje: la bandera de cuadros 🏁 se sustituyó por
  el icono del deporte de la apuesta (mismo `iconoDeporte()` que ya usan
  `/pendientes` y el aviso de resuelta), y el margen `MARGEN_AVISO_MS` se
  bajó de 2h05 a 2h (petición directa, sin la holgura extra para la
  certificación de la API que se había añadido en la ronda anterior).
  En el código (`api/telegram-avisos.js`), `avisoEnviado` sigue viviendo
  en la selección líder de cada grupo (mismo campo, sin migración), pero
  ahora se marca en TODAS las líderes de la apuesta a la vez, en el mismo
  envío, en vez de una a una según iba terminando cada partido.

- **Rediseño de escritorio ancho, primera fase: Inicio** (petición
  directa, tras comparar con otra app de referencia — "Bet Analytix" —
  que aprovecha todo el ancho con un sidebar fijo, filas de apuesta
  densas tipo tabla, y un panel lateral en vez de un modal centrado para
  el detalle). Decidido con el usuario antes de tocar código: ir pantalla
  a pantalla en vez de todo de golpe, empezando por **Inicio** (no por
  Apuestas/Entretenimiento), y solo escritorio por ahora — en móvil
  ninguna pantalla cambia todavía, el usuario compartirá capturas de
  referencia para esa parte más adelante, como fase aparte.
  - `App.jsx`: el contenedor que envuelve el contenido (antes
    `max-w-3xl mx-auto` para TODAS las secciones) pasa a `max-w-6xl` solo
    cuando `seccionActiva === "inicio"`; el resto de secciones se quedan
    exactamente igual que antes.
  - `TarjetaApuestaResumen.jsx`/`ListaApuestas.jsx`: nueva prop opcional
    `denso` (por defecto `false`, sin cambiar nada de lo que ya existía)
    en vez de un componente nuevo separado, para poder activarla en
    Apuestas/Entretenimiento (u otra pantalla) en una fase futura sin
    duplicar código. Con `denso`, aparece desde `md:` una fila tipo tabla
    (deporte, Simple/Combinada, fecha, casa con su color de firma —
    mismo `useColorCasa` que `ApuestaItem.jsx` —, evento, cuota total,
    importe, beneficio y una pastilla de estado horizontal) en vez de la
    tarjeta con la franja vertical girada; y al hacer clic se abre un
    panel anclado a la derecha (con transición de entrada) en vez del
    modal centrado — mismo `ApuestaItem.jsx` por dentro en los dos casos,
    sin tocarlo. Por ahora solo `PantallaInicio.jsx` activa `denso`; el
    resto de usos de estos dos componentes (Apuestas, Entretenimiento) se
    comportan exactamente igual que antes, sin ninguna bifurcación
    visible.
  - No se pudo probar en un navegador de verdad en este entorno (sin esa
    herramienta); pendiente de que el usuario lo pruebe en local o en el
    propio despliegue y confirme antes de plantear la siguiente pantalla.
  - **Ajustes tras probarlo en local** (`vite --host`, arrancado por falta
    de servidor): la fila densa pasó de una sola línea con columnas de
    ancho fijo (se veía "en zigzag" con flex+gap, la pastilla Simple/
    Combinada empujaba el resto según su longitud) a dos líneas —
    fecha+logo+tipo arriba, deporte+evento abajo — con Cuota/Importe/
    Ganancia/Beneficio como bloque aparte, centrado verticalmente
    respecto a TODA la tarjeta (no solo la línea del evento). El nombre
    de la casa en texto se quitó (el logo ya identifica la casa), el logo
    pasó de 32×32 a un rectángulo más ancho (56×32) para que se lea el
    texto de logos tipo "bet365", con una `title` con el nombre para no
    perder esa información del todo; sin logo sale un círculo con la
    inicial en el color de firma de la casa. "Ganancia" se definió como
    `beneficio + stake` (el retorno total, ya que al lado se ve el
    Beneficio neto) — con una excepción real: en freebet NO se suma el
    stake (nunca fue dinero real que "recuperar"), si no una freebet
    perdida saldría con Ganancia > 0 sin haber ganado nada. Etiquetas
    Cuota/Importe/Ganancia/Beneficio con mayúscula inicial (se probó todo
    en minúscula, no convenció). El panel lateral de detalle pasó de
    `max-w-md` a `max-w-xl` (mismo ancho que el modal centrado que
    sustituye) porque con menos ancho las tarjetas de resultado por
    partido de `ApuestaItem.jsx` se veían desproporcionadamente grandes
    — decisión tomada tras usar `AskUserQuestion` para confirmar que el
    problema era solo de ese panel nuevo (no tocar `ApuestaItem.jsx`,
    compartido con el resto de la app).

- **Rediseño del marcado de resultado: de "por pick" a "un resultado por
  apuesta"** (petición directa, tras ver el panel de detalle nuevo y
  compararlo con Bet Analytix). Cambio de fondo, no solo visual —
  revierte un rediseño anterior deliberado (ver la entrada "Marcado de
  resultado por pick, universal" más arriba: aquel cambio también fue una
  petición directa, confirmada entonces igual que esta con
  `AskUserQuestion`). Confirmado en dos rondas: primero "un solo
  resultado por apuesta" en vez de solo repintar el marcado por pick;
  después, que el mismo cambio se aplicara TAMBIÉN a la Mini App de
  Telegram (`TicketApuesta.jsx`), que tenía su propio marcado por pick
  independiente — si solo cambiaba la web, una misma apuesta se resolvía
  de dos formas distintas según por dónde se tocara, y los picks se
  quedaban sin marcar para siempre si se resolvía desde la web.
  - **`ApuestaItem.jsx`**: fuera el "sello" de color con blur por
    partido, el ojo (revelar), el lápiz de re-editar un partido resuelto,
    los 3 botones ✓/✕/– por pick, y el aviso "Ajustar cuota" tras anular
    un pick (ya no hay forma de anular un pick suelto — si hace falta
    corregir la cuota total a mano, ya existe "Editar" →
    `cuotaTotalManual`). La pastilla de estado (antes solo decorativa)
    pasa a ser un botón que abre "Modificar": un diálogo con las 4
    opciones (Pendiente/Ganada/Perdida/Nula, mismo icono/color que ya
    usaba cada pick) que llama directo a `onMarcarResultado` — la MISMA
    prop que ya usaba Cash Out, sin derivar nada de picks. Los picks de
    la lista de selecciones pasan a texto+cuota de solo lectura. Se
    mantiene sin cambios: marcador manual de "Otras ligas", Cash Out,
    cabecera (Editar/Eliminar/Cerrar).
  - **`TicketApuesta.jsx`/`TelegramMiniApp.jsx`**: mismo cambio — fuera
    los 3 botones por pick (`hob-pick-btn`, ya sin uso, borrado de
    `TicketApuesta.css`), dentro 4 pastillas grandes (Pendiente/Ganada/
    Perdida/Nula) cerca del sello. `marcarPick(indice, resultado)` pasa a
    `marcarResultado(resultado)`, con una llamada nueva `{ accion:
    "resultado", resultado }` en vez de `{ accion: "pick", indice,
    resultado }`.
  - **`api/telegram-apuesta.js`**: nueva rama `accion === "resultado"`
    que llama directo a `marcarResultadoApuesta` (ya existía, ya se
    usaba para `"cashout"`); se quita la rama `accion === "pick"`.
  - **`api/_lib/apuestasResueltas.js`**: se borra `marcarPick` (sin
    llamadores tras el cambio de arriba) — solo queda
    `marcarResultadoApuesta`.
  - **`App.jsx`/`useApuestas.js`/`ListaApuestas.jsx`/`EstadisticasDashboard.jsx`/`PantallaInicio.jsx`**:
    limpieza en cadena de todo lo que quedó sin usar —
    `manejarMarcarResultadoPick` (App.jsx), `marcarResultadoSeleccion`/
    `actualizarCuotaSeleccion` (useApuestas.js) y el hilo de props
    `onMarcarResultadoSeleccion`/`onActualizarCuotaSeleccion` en cada
    componente que lo reenviaba.
  - **`utils/apuestas.js`**: se borra `derivarResultadoApuesta` (sin
    llamadores). `derivarResultadoGrupo`/`agruparSeleccionesPorPartido`
    se quedan (`calcularCuotaTotal` sigue leyendo `grupo.resultado` para
    excluir un partido "nula" del producto) — en la práctica siempre
    darán "pendiente" para apuestas nuevas, ya que nada vuelve a marcar
    un pick, salvo en datos antiguos de antes de este cambio.
  - **Efecto secundario real, no pedido pero necesario**:
    `utils/trofeos.js` tenía `esGanadaDeVerdad()`, que para un Cash Out
    miraba si los picks derivados "habrían ganado igual" para dar por
    buenos dos trofeos (Cazador de cuotas, Combinada ganadora) aunque se
    cobrara antes de tiempo. Sin marcado por pick ya no hay con qué
    calcular eso — se simplificó a `apuesta.resultado === "ganada"`: un
    Cash Out ya NO cuenta para esos dos trofeos, aunque hubiera acabado
    ganando. Pérdida real pero menor (solo afecta a cash outs que además
    habrían ganado), documentada en el propio código.
  - No se pudo probar en un navegador de verdad en este entorno; pendiente
    de que el usuario lo pruebe en local (los 4 casos: Pendiente/Ganada/
    Perdida/Nula, con y sin freebet/seguro) y en el propio despliegue de
    Telegram, antes de subirlo.

- **Segunda vuelta: de "un resultado por apuesta" a "un resultado por
  partido"** (petición directa, tras ver el diseño anterior en real —
  todavía sin subir — y comparar otra vez con Bet Analytix, con más
  detalle esta vez). Solo en `ApuestaItem.jsx` (web) por ahora — la Mini
  App de Telegram (`TicketApuesta.jsx`) se queda sin tocar en esta
  ronda, así que de momento vuelve a estar desincronizada con la web
  (ella sigue con "un resultado por apuesta" de la vuelta anterior);
  pendiente de alinearla en cuanto el diseño de la web se asiente — el
  usuario avisó explícitamente de que "queda mucho" por diseñar todavía
  y no hay prisa por subir nada.
  - **Cabecera**: la pastilla de estado se mueve de una franja centrada
    aparte a la esquina superior derecha de la fila de Simple/Combinada
    (junto a Freebet/Asegurada/etc.) — y deja de ser un botón: el
    resultado general ya no se pone a mano en ningún sitio, se DERIVA
    solo de los partidos (vuelve `derivarResultadoApuesta`, borrada en la
    vuelta anterior de este mismo rediseño).
  - **Cada partido, en una línea**: icono del deporte + evento + cuota +
    una pastilla de estado que abre "Modificar" PARA ESE PARTIDO (las
    mismas 4 opciones de antes, ahora por partido en vez de por apuesta
    entera). Se quita la cabecera "Multi Apuesta"/"Pick simple" +
    competición/país + la lista de picks con su mercado — juicio propio,
    no pedido explícitamente: con un resultado por partido ya no hace
    falta desglosar mercado a mercado en esta vista (en un bet builder
    de varios mercados del mismo partido, se pierde ver CUÁL mercado se
    jugó; el marcador del partido si sigue disponible).
  - **Marcar un partido marca TODOS sus picks a la vez** (no mercado a
    mercado): `marcarResultadoGrupo` (nuevo en `useApuestas.js`) escribe
    el mismo resultado en todos los índices de ese grupo en una sola
    llamada — de ahí "una llamada menos" que pedía el usuario, ya no
    hace falta una acción aparte para sellar el resultado real de la
    apuesta, se deriva sola con `manejarMarcarResultadoPartido` (nuevo en
    `App.jsx`, mismo patrón que el `manejarMarcarResultadoPick` que se
    había borrado, pero a nivel de partido).
  - **`utils/trofeos.js`**: `esGanadaDeVerdad()` recupera su lógica
    original (mirar si un Cash Out habría ganado igual, vía
    `derivarResultadoApuesta`) — vuelve a ser calculable ahora que los
    partidos sí se marcan, así que el "efecto secundario" de la vuelta
    anterior (Cash Out ya no contaba para "Cazador de cuotas"/"Combinada
    ganadora") queda resuelto sin que hiciera falta pedirlo.
  - Se mantiene sin cambios: Stake/Cuota/Beneficio, la nota de cuota
    manual, marcador manual de "Otras ligas", Cash Out, cabecera
    (Editar/Eliminar/Cerrar).
  - Tampoco se pudo probar en navegador en este entorno; el usuario ya
    avisó de que de momento sigue usando la versión anterior en su
    propio entorno local y avisará cuando el diseño esté listo para
    subir.

- **Tercera vuelta: tarjetas por partido, ciclo de estado en un toque, y
  "Ajustar cuota" de vuelta** (petición directa, con una maqueta HTML
  funcional de referencia — ya con los colores de Hall of Bets, felt/
  gold/paper — más una explicación punto por punto). Solo
  `ApuestaItem.jsx` (web); la Mini App de Telegram sigue sin tocar,
  ahora una vuelta más desincronizada — el usuario mantiene que no hay
  prisa por alinearla.
  - **Cabecera**: título ("Combinada N partidos"/"Apuesta simple") + X;
    debajo, fila con píldora de fecha (icono calendario), tipo, Freebet/
    Asegurada/aumento/Archivada si aplican, y el estado general a la
    derecha (`ml-auto`) — informativo, ya no clicable en absoluto.
  - **4 columnas fijas**: Cuota · Importe · Ganancia · Beneficio, las
    dos últimas siempre visibles a la vez (antes "Ganancia" y
    "Beneficio" se turnaban en el mismo hueco según pendiente/resuelta).
  - **"Selecciones"**: encabezado propio + logo de la casa (o su nombre
    en su color de firma si no tiene logo) alineado a la derecha —
    donde antes vivía el logo, en la cabecera general.
  - **Cada partido, tarjeta propia** (borde + fondo, no fila suelta):
    icono del deporte, evento, cuota en su recuadro, y una pastilla de
    estado que ahora CICLA al tocarla (Pendiente → Ganada → Perdida →
    Nula → Pendiente) — sin diálogo, un toque por paso (vuelve
    `onMarcarResultadoPartido`/`marcarResultadoGrupo` de la vuelta
    anterior, solo cambia el disparador). Con Cash Out ya hecho, el
    ciclo se bloquea (`disabled`, mismo criterio que la maqueta).
  - **"Ajustar cuota (mercado anulado)" vuelve** — pero ya no depende de
    marcar un pick suelto (eso no existe): es un enlace SIEMPRE visible
    en cada tarjeta, para cuando la casa recalcula la cuota de un
    partido tras anular uno de sus mercados (ej. un jugador no
    titular). Mecanismo totalmente independiente del ciclo de
    estado — un partido puede estar Ganada y tener la cuota ajustada a
    la vez. Restaurado `actualizarCuotaSeleccion` en `useApuestas.js`
    (se había borrado en la primera vuelta) y su hilo de props
    (`onActualizarCuotaSeleccion`).
  - **Se quita el marcador del partido** (petición directa) — ni el
    automático (API-Football) ni el escrito a mano para "Otras ligas".
    Como no queda ningún sitio que escriba
    `golesLocalManual`/`golesVisitanteManual`, se borra también
    `actualizarMarcadorManual` de `useApuestas.js` (sin llamadores) — la
    Mini App de Telegram sigue LEYENDO ese campo para partidos con
    datos antiguos, solo se quitó la forma de escribirlo. `InfoPartido`
    se queda exportado (lo sigue usando `TicketApuesta.jsx`), pero
    `ApuestaItem.jsx` ya no lo usa por dentro.
  - **Dos botones nuevos en el pie** (Cash Out · Modificar · Compartir ·
    Copiar · Eliminar — Modificar/Eliminar son el lápiz/papelera que
    antes vivían sueltos en la cabecera, ahora aquí):
    - **Copiar**: duplica la apuesta como una nueva Pendiente con la
      fecha de hoy (mismos datos, sin arrastrar resultado/marcador/aviso
      ya enviado) — `copiarApuesta`, nuevo en `useApuestas.js`,
      reutiliza `agregarApuesta` tal cual.
    - **Compartir**: copia al portapapeles (`navigator.clipboard`) un
      resumen en texto plano (partidos, cuota total, importe,
      resultado/beneficio) — sin diálogo, el propio botón cambia a
      "¡Copiado!" un momento y vuelve solo.
  - No se pudo probar en navegador en este entorno; sigue pendiente de
    que el usuario lo pruebe en su local, como en las vueltas
    anteriores.
  - **Bug real, detectado por el usuario con una combinada de prueba**:
    en una apuesta con la cuota total ajustada a mano
    (`cuotaTotalManual`), anular un partido no la recalculaba — se
    quedaba en el valor manual antiguo, calculado para la combinada
    completa, en vez de reflejar que un partido ya no cuenta. Corregido
    en `marcarResultadoGrupo` (`useApuestas.js`): si el partido ENTRA o
    SALE de "Nula", se limpia `cuotaTotalManual` en la misma escritura
    — la cuota total vuelve a calcularse sola con el producto de los
    partidos activos (`calcularCuotaTotal`), como si nunca se hubiera
    ajustado a mano.

- **Panel lateral: "+ Añadir apuesta", modo oscuro/cerrar sesión, e
  Historial** (petición directa, quinta fase del rediseño de escritorio
  de esta sesión). Decidido con el usuario (`AskUserQuestion`): esta
  vuelta SOLO AÑADE — "Apuestas"/"Entretenimiento" se quedan igual en el
  menú, no se quita nada todavía (depende de que Estadísticas gane antes
  3 recuadros que le faltan: En juego, Media apostada, Total apostado —
  fase aparte, sin hacer).
  - **Modo oscuro/cerrar sesión** se mueven de la cabecera al panel
    lateral (`SidebarNavegacion.jsx`), al final del todo (`mt-auto`),
    solo icono sin etiqueta (mismo lenguaje visual que ya tenían en la
    cabecera) — reutilizando `SelectorModoOscuro.jsx` tal cual. El móvil
    no cambia (ya los tenía aparte en `MenuSecundario.jsx`).
  - **Botón dorado "+ Añadir apuesta"** debajo de la lista de secciones
    del panel — abre un diálogo pequeño (mismo patrón que
    `ConfirmDialog.jsx`) para elegir Apuestas/Entretenimiento, y al
    elegir abre el formulario en un panel lateral nuevo (deslizado desde
    la derecha). Solo escritorio — el móvil sigue con su "+" de siempre
    en `BarraInferiorMovil.jsx`, sin tocar. `manejarAgregar` (`App.jsx`)
    gana un segundo parámetro opcional `categoria` (por defecto
    `seccionActiva`, como antes) para poder guardar con el bankroll
    elegido en el diálogo en vez de con la sección que se esté viendo.
  - **`PanelLateral.jsx`** (nuevo): el mecanismo de panel lateral
    (backdrop + `translate-x` animado) que ya existía a mano dentro de
    `ListaApuestas.jsx` para el detalle de una apuesta se extrae a un
    componente reutilizable — ahora lo usan tanto el detalle como el
    panel nuevo de "Añadir apuesta", sin duplicar la animación una
    segunda vez.
  - **`Historial.jsx`** (nuevo, sección nueva en el panel lateral):
    pastillas Todas/Apuestas/Entretenimiento (misma etiqueta "Todas" que
    ya usa el teclado del bot de Telegram, para el mismo criterio en
    toda la app) + el listado agrupado por mes/día de siempre
    (`ListaApuestas` con `agrupada` y `denso`, igual que Inicio) — sin
    ningún cálculo nuevo, solo filtra el array por categoría antes de
    pasarlo. Contenedor ancho (`max-w-6xl`) igual que Inicio.
  - No se pudo probar en navegador en este entorno; pendiente de que el
    usuario lo pruebe en local y confirme antes de subir.
  - **Ajustes tras probarlo en local**:
    - El botón "+ Añadir apuesta" se movió del panel lateral a la
      cabecera (petición directa) — el hueco donde antes vivían modo
      oscuro/cerrar sesión, alineado con "Hall of Bets", en vez de
      debajo de la lista de secciones del panel.
    - **Bug real, detectado por el usuario**: dentro del panel de
      "Añadir apuesta", el desplegable de "Casa de apuestas"
      (`SelectorDesplegable.jsx`, reutilizado también por el desplegable
      de jugador de `SelectorMercado.jsx`) no se abría, y el formulario
      se veía cortado por arriba al abrir el panel. Causa: el panel
      lateral nuevo anima con `transform` (`translate-x`), y CUALQUIER
      antecesor con `transform` convierte a sus descendientes
      `position: fixed` en relativos A ESE ANTECESOR en vez de a la
      ventana — el desplegable (que sí es `fixed`, a propósito, ver su
      propio historial en `usePosicionDesplegable.js`) se posicionaba
      con coordenadas de ventana pero dentro del sistema de coordenadas
      del panel, así que aparecía en cualquier sitio menos el
      correcto. Corregido sacando el panel de opciones a un portal
      (`createPortal` a `document.body`) en `SelectorDesplegable.jsx` —
      arregla este desplegable en CUALQUIER panel con `transform`
      (incluido "Editar" dentro del panel de detalle de una apuesta,
      mismo riesgo aunque no se hubiera notado todavía). Al sacarlo del
      DOM del propio componente con el portal, el "click fuera"/"scroll
      dentro cierra" tenían que aprender a reconocer también el panel
      portado (antes solo miraban el contenedor del botón) — se añadió
      un segundo ref para eso. De paso, `PanelLateral.jsx` fuerza
      `scrollTop = 0` al abrirse, por si el corte de arriba también
      tenía algo de scroll inicial de por medio.
  - **Dos bugs reales más, detectados por el usuario tras probar la
    corrección anterior**:
    - **Modo oscuro/cerrar sesión invisibles sin hacer scroll**: el
      `<aside>` se estira tanto como la columna de contenido de al lado
      (a propósito, para que el verde cubra toda la altura) — con
      "Últimas apuestas" larga, el `mt-auto` que empuja estos dos
      iconos "al final" los dejaba al final de una columna mucho más
      alta que la pantalla, invisibles sin bajar del todo. Añadido
      `md:sticky md:bottom-4` (mismo patrón que ya usa el `<nav>` de
      arriba con `md:sticky md:top-20`) para que se queden a la vista
      del viewport de verdad, con fondo propio (`bg-felt`) porque el
      menú puede seguir desplazándose por debajo. De paso, la letra del
      menú baja de `text-base` a `text-sm` (petición directa).
    - **El desplegable se abría, pero la cabecera tapaba la parte de
      arriba del formulario**: la cabecera (`z-[60]`) va por encima de
      los diálogos normales (`z-50`) a propósito, para poder seguir
      usando modo oscuro/cerrar sesión con un modal CENTRADO abierto
      detrás — pero un panel a pantalla completa como
      `PanelLateral.jsx` necesita justo lo contrario: taparla entera
      mientras está abierto. Solución del propio usuario: subir el
      z-index del panel por encima de la cabecera (`z-[70]`). Efecto
      secundario que había que corregir a la vez: el desplegable de
      "Casa de apuestas" vive DENTRO de ese panel y usa un portal
      (`document.body`) con `z-50` — con el panel ya en `z-[70]`, el
      propio panel le tapaba el desplegable a él. Subido también a
      `z-[80]`, por encima de cualquier otra cosa con z-index en la
      app.
  - **Últimos retoques, con "Inicio" ya dado por terminado en
    escritorio**: el botón "+ Añadir apuesta" de la cabecera pasa de
    `bg-gold` (cambia de tono según el tema) a un dorado fijo — el mismo
    rgb que usa `--color-gold` en modo oscuro (`index.css`), también en
    modo claro (petición directa). Las dos pastillas Apuestas/
    Entretenimiento del diálogo de elegir bankroll ganan un hover más
    visible (`hover:border-gold/40` casi no se notaba — pasa a
    `border-2` + `hover:border-gold` + `hover:bg-gold/5`).
  - Fila densa de `TarjetaApuestaResumen.jsx`: el nombre del evento baja
    de `text-base` (16px) a `text-sm` (14px) — petición directa, se veía
    grande comparado con el resto de columnas.

- **Se oculta "Apuestas"/"Entretenimiento" del menú de escritorio**
  (petición directa: con "+ Añadir apuesta" cubriendo el alta e
  "Historial" el listado de los dos bankrolls, ya no aportaban como
  destino de navegación aparte). Antes de esto, `KpisEstadisticas.jsx`
  (los KPI combinados de Estadísticas) ganó los 3 recuadros que le
  faltaban respecto al panel que tenía cada bankroll por separado —
  Media apostada, Total apostado, En juego — reutilizando
  `stats.stakeMedio`/`stats.stakeTotalReal`/`stats.stakePendienteReal`,
  que `calcularEstadisticas()` ya calculaba (no hizo falta ningún
  cálculo nuevo), más la misma nota de stake en freebets que ya tenía
  `EstadisticasApuestas.jsx`. Solo se quitaron los dos items de
  `SidebarNavegacion.jsx` (`ITEMS`) — ni el código de esas pantallas ni
  la navegación del móvil (que sigue siendo la suya propia, aparte) se
  han tocado, así que es reversible con una sola línea si hiciera
  falta.

- **Tarjeta de Bankroll propia en Estadísticas, y reorganización del
  panel de KPIs** (petición directa, comparando con el mismo recuadro
  que ya existía arriba de Apuestas/Entretenimiento en móvil). El
  recuadro "Bankroll" sale del grid de KPIs (`KpisEstadisticas.jsx`) y
  pasa a su propia tarjeta (reutiliza `TarjetaBankroll.jsx`, la misma
  que ya usaban Apuestas/Entretenimiento y Casas de apuestas — nada
  nuevo que construir), justo debajo del selector Apuestas/
  Entretenimiento/Todas: con "Todas" suma el bankroll de los dos
  bankrolls (dinero real + los dos saldos de freebet de cada casa); con
  uno concreto, solo el suyo. A propósito calculada sobre
  `apuestasDelBankroll`/`movimientosDelBankroll` (solo filtrados por
  bankroll), no sobre las versiones ya filtradas por casa/rango/
  archivado que usa el resto del dashboard — mismo criterio que "Casas
  de apuestas": el dinero real no cambia solo por estar mirando una
  casa o un periodo concreto.
  - El grid de KPIs que queda (`KpisEstadisticas.jsx`) se reorganiza en
    tres filas: ROI/Yield/% Acierto/Cuota media; Nº apuestas/Media
    apostada/Total apostado/En juego; y Beneficio/Beneficio (mes) en su
    propia fila centrada aparte, para que destaquen del resto en vez de
    ser una pastilla más de la cuadrícula.
  - **Reorden del panel lateral**: Inicio, Estadísticas, Informe,
    Historial, Casas de apuestas, Trofeos, Academia, Ajustes.

- **Estadísticas a todo el ancho en escritorio** (petición directa: "como
  seguimos el orden visual haciendo que ocupe todo el ancho"). Se añade
  a la lista de secciones con `max-w-6xl` (`App.jsx`, junto a Inicio y
  Historial). Como esta pantalla tiene muchas más piezas apiladas que
  esas dos (una tarjeta, un grid de KPIs, media docena de gráficos, dos
  tablas), ensanchar el contenedor solo no bastaba — se emparejan en
  columnas las piezas que tenían sentido lado a lado, dejando los
  gráficos de línea/área grandes (Evolución, Distribución, Beneficio
  mensual) a ancho completo, que son los que de verdad se benefician de
  todo el ancho ellos solos:
  - Bankroll + el grid de KPIs, lado a lado desde `lg:` (1 columna para
    Bankroll, más compacto, y 2 de 3 para KPIs).
  - Los 4 `GraficoBarraDivergente` (ROI por deporte/casa/mercado,
    Beneficio por rango de cuota), de dos en dos en el mismo grid — como
    alguno se oculta según el filtro activo, el grid simplemente se
    reacomoda con los que haya, sin lógica nueva.
  - De paso, los filtros de casa/rango de fechas/"ver también archivado"
    se movieron antes de la tarjeta de Bankroll+KPIs (antes iban
    después) — así lo que los afecta se ve siempre encima de sus
    controles, no debajo.
  - **Bug real, detectado por el usuario al probarlo con pocos datos de
    prueba**: los gráficos de barras (`GraficoBarraDivergente.jsx`, ROI
    por deporte/casa/mercado y Beneficio mensual/por rango de cuota) no
    tenían un ancho máximo por barra — con una sola categoría (un único
    deporte, una única casa, como en los datos de prueba) la barra se
    estiraba para llenar todo el ancho disponible, mucho mayor ahora con
    el contenedor ensanchado, viéndose como un bloque gigante en vez de
    una barra normal. Corregido con `maxBarSize={56}` en el `<Bar>` — con
    muchas categorías no cambia nada (ya eran más estrechas que ese
    máximo), solo evita que una única barra se infle sin límite.
  - **Calendario de actividad, dentro de la rejilla de gráficos de
    barras** (petición directa, mismo motivo): sus celdas son cuadradas
    y crecen con el ancho disponible (`aspect-square`) — sueltas a todo
    el ancho de Estadísticas se veían enormes. Movido dentro del mismo
    grid de 2 columnas que ya tenían los `GraficoBarraDivergente`
    (llenando el hueco que dejaba un número impar de ellos), sin tocar
    nada de `CalendarioActividad.jsx` — sus celdas se reducen solas a la
    mitad del ancho.

- **Panel "Estadísticas" en la cabecera, estilo Bet Analytix (experimento
  añadido, no sustituye nada)**: tras ver capturas de esa app de
  referencia, se prueba un segundo punto de entrada a las estadísticas,
  más rápido que ir a la sección del menú — un botón "Estadísticas"
  nuevo en la cabecera de escritorio, a la izquierda de "+ Añadir
  apuesta" (estilo contorno, `border-gold/40`, para no competir con el
  dorado relleno de ese botón), que abre `PanelEstadisticas.jsx` dentro
  de un `PanelLateral` (mismo mecanismo deslizante que ya usa "+ Añadir
  apuesta"). Decidido con el usuario (`AskUserQuestion`): el selector de
  casa dentro del panel es un desplegable (`SelectorDesplegable.jsx`, el
  mismo que ya usa el formulario de apuesta), no pastillas ni flechas —
  más compacto para un panel estrecho. Contenido, especificado por el
  usuario: 3 pastillas Todas/Apuestas/Entretenimiento ("Todas" primero y
  por defecto, al revés que en `EstadisticasDashboard.jsx`), el
  desplegable de casa, y una sola tarjeta densa con el Bankroll grande
  centrado arriba y 6 filas de cifras en 2 columnas debajo (Dinero
  real/Freebets, ROI/Yield, Nº apuestas/Cuota media, Media apostada/%
  Acierto, En juego/Total apostado, Beneficio (mes)/Beneficio), y un
  botón "Más estadísticas" que despliega los gráficos (Evolución,
  Distribución de resultados, Beneficio mensual, Rachas + Mejor/Peor
  apuesta, ROI por deporte, ROI por casa, Beneficio por rango de cuota,
  Calendario de actividad, Mercados más usados, Insights) — todos
  reutilizados sin cambios de `EstadisticasDashboard.jsx`, mismas
  funciones de cálculo (`calcularEstadisticas`, `calcularBankrollPorCasa`,
  `calcularDesglosePorDeporte`, `calcularBeneficioPorRangoCuota`,
  `calcularFrecuenciaMercados`), nada nuevo. Sin "Rango de fechas" ni
  "Ver también archivado" en este panel (el usuario no los pidió) — las
  archivadas se excluyen siempre por defecto, igual que el resto de la
  app. Dentro del panel los gráficos van siempre en una sola columna,
  sin la rejilla `lg:grid-cols-2` de la página ancha — esa clase se
  activa por el ancho de la VENTANA, no del panel (que tiene un ancho
  fijo, `max-w-xl`), así que en escritorio habría apretado 2 columnas en
  un hueco estrecho.
  - **Bug evitado antes de que apareciera**: "Mejor apuesta"/"Peor
    apuesta" (dentro de `RachasYExtremos`) abren el detalle de la
    apuesta en un modal `position: fixed` — y el panel donde vive
    (`PanelLateral.jsx`) anima con `transform`, que convierte a ese
    antecesor en el "contenedor" de cualquier descendiente fijo (mismo
    problema ya resuelto una vez en `SelectorDesplegable.jsx` para el
    panel de "+ Añadir apuesta"). Se aplicó la misma solución de
    entrada: el modal se renderiza con `createPortal` a
    `document.body`. Se detectó que `BotonInfoConcepto.jsx` (los iconos
    ℹ️ junto a ROI/Yield/etc., reutilizados aquí) tenía exactamente el
    mismo problema en potencia — se le aplicó el mismo arreglo, así que
    de paso queda corregido en cualquier otro sitio donde se use dentro
    de un panel lateral en el futuro.
  - Todas las filas de cifras del panel (2 y 3 en adelante, no solo la
    del Bankroll) pasan a centradas (petición directa, "quedará mejor")
    — `Fila` (dentro de `PanelEstadisticas.jsx`) gana `text-center`.
  - **"Estadísticas" se oculta del menú de escritorio** (petición
    directa, mismo criterio que Apuestas/Entretenimiento: "no elimino
    por si en el futuro sirve esa sección para algo") — ahora que este
    panel cubre el acceso rápido, ya no hace falta el ítem del menú.
    Solo se quita de `ITEMS` en `SidebarNavegacion.jsx`; la ruta sigue
    intacta en `App.jsx` (`seccionActiva === "estadisticas"` sigue
    renderizando `EstadisticasDashboard.jsx` si se llegara a activar
    por algún otro medio), nada de su código se ha tocado ni borrado.

- **Casas de apuestas: rediseño de escritorio ancho (fila + panel
  lateral)**. Siguiente pantalla del rediseño (después de Inicio/
  Historial/Estadísticas — backlog en `CLAUDE.md`, punto 6), tras
  preguntar "cómo se pueden implementar Informe/Casas/Trofeos/Academia/
  Ajustes para que toda la página tenga la misma sintonía" — Casas de
  apuestas se eligió primero por ser ya una lista (encaja directo en el
  patrón "fila + panel lateral" de Historial/Inicio). `ListadoCasas.jsx`
  era un acordeón: tocar una casa desplegaba su detalle DEBAJO de su
  propia fila, empujando el resto hacia abajo. La cabecera de cada fila
  (logo, nombre, yield, bankroll Apuestas/Entretenimiento, chevron) ya
  era bastante densa — no se ha tocado; solo cambia adónde va el
  detalle en escritorio.
  - Detalle extraído a `DetalleCasa.jsx` (nuevo, mismo criterio que
    `ApuestaItem.jsx`): las dos `FilaBankroll`, `FormularioMovimiento`,
    "Otro bono" + `FormularioBono`, `ListaMovimientos` y "Borrar esta
    casa", reutilizados tanto en el acordeón de móvil (sin cambios,
    `md:hidden`) como en un `PanelLateral` nuevo de escritorio. Cuando
    recibe `onCerrar` (solo desde el panel) pinta su propia cabecera con
    logo/nombre + X, porque el panel tapa la fila que se tocó; en móvil
    no hace falta, la fila de arriba ya cumple ese papel.
  - Guard de seguridad: si se borra la casa abierta en el panel (vive
    fuera del `.map()` de filas, no desaparece solo como en móvil, donde
    toda la fila se quita del array), un `useEffect` cierra el panel en
    vez de dejarlo mostrando una casa fantasma — mismo patrón defensivo
    que ya usa `ListaApuestas.jsx` para el detalle de apuesta.
  - `App.jsx`: `"casas"` se añade a las secciones con `max-w-6xl`.
  - "Bankroll total" + "Nueva casa de apuestas" (`FormularioCasa`) pasan
    a un `grid lg:grid-cols-3` (Bankroll 1 columna, formulario 2) en vez
    de apilados a todo el ancho — sueltos, el formulario (solo 2 campos)
    se habría visto estirado sin sentido y el total quedaría solo,
    descompensado. Mismo patrón que Bankroll+KPIs en Estadísticas.

- **Informe: rediseño de escritorio ancho**. Siguiente pantalla elegida
  tras preguntar al usuario cuál seguía ("Informe (Recomendado)"). A
  diferencia de Casas de apuestas, `InformeProfesional.jsx` es un
  documento de una sola pieza (no una lista), así que no lleva panel
  lateral — solo se ensancha el contenedor (`App.jsx`, `"informe"` se
  añade a `max-w-6xl`) y se reorganiza el contenido DENTRO de su única
  tarjeta: los 4 tiles (Nº apuestas/Beneficio/Yield/% Acierto) y el
  bloque de Conclusiones, antes uno debajo del otro a todo el ancho,
  pasan a un `grid lg:grid-cols-2` (tiles a la izquierda en 2×2,
  Conclusiones a la derecha con un borde separador vertical) — sueltos a
  todo el ancho, los tiles se habrían visto muy separados entre sí y las
  frases de Conclusiones se habrían leído en líneas de texto larguísimas.
  En móvil y al exportar a PDF (`window.print()`, ancho de página menor
  que el punto de corte `lg:`) se quedan apiladas como siempre.
  - **"Exportar a PDF" con recuadro propio** (petición directa, "se ve
    poquito ahí"): antes era solo texto suelto con un icono, junto a las
    pastillas de bankroll — ahora lleva borde, fondo (`bg-surface`, con
    un toque dorado al pasar el ratón) y algo más de padding, al mismo
    nivel visual que el resto de controles de esa fila.

- **Trofeos: rediseño de escritorio ancho**. `App.jsx` añade `"trofeos"`
  a `max-w-6xl`. Cada trofeo ya se compone bien en fila a cualquier
  ancho (icono + nombre/descripción/progreso + pastilla de nivel), así
  que no hizo falta rediseñar `FilaTrofeo` — el cambio fue solo agrupar
  las filas de cada categoría en `grid lg:grid-cols-2` en vez de una
  columna suelta: sin esto, cada fila se estiraba a todo el ancho de la
  página con mucho hueco vacío entre el texto y la pastilla de la
  derecha. En móvil, sigue en una sola columna.

- **Academia: rediseño de escritorio ancho (fila + panel lateral)**.
  Tras preguntar "¿qué harías en Academia?", se detectó que en realidad
  encaja en el mismo patrón "fila + panel lateral" ya usado en Historial/
  Casas de apuestas — es una lista de conceptos que al tocarlos
  despliega su desarrollo completo (definición, "en cristiano", fórmula,
  ejemplo, interpretación, errores frecuentes), antes empujando el resto
  del acordeón hacia abajo, igual que hacía `ListadoCasas.jsx` antes de
  su rediseño.
  - Desarrollo extraído a `DetalleConcepto.jsx` (nuevo, mismo criterio
    que `DetalleCasa.jsx`): reutilizado tanto en el acordeón de móvil
    (sin cambios, `md:hidden`) como en un `PanelLateral` nuevo de
    escritorio. Con `onCerrar` (solo desde el panel) pinta su propia
    cabecera con el nombre del concepto + X; sin él (móvil) no hace
    falta, la fila de arriba ya cumple ese papel.
  - `Academia.jsx`: las filas de cada categoría pasan a `grid
    lg:grid-cols-2` (mismo motivo que Trofeos — cada fila es solo un
    título, sueltas dejaban mucho hueco vacío). `App.jsx` añade
    `"academia"` a `max-w-6xl`.
  - Sin guard de borrado (a diferencia de Casas de apuestas): los
    conceptos son datos fijos de `utils/academia.js`, no algo que el
    usuario pueda borrar, así que no hace falta cerrar el panel solo por
    eso. El buscador y las categorías de arriba no se han tocado.

- **Ajustes: rediseño de escritorio ancho**. Última pantalla del
  backlog (punto 6 de `CLAUDE.md` completo con esta). `Ajustes.jsx` son
  dos tarjetas independientes ("Copia de seguridad" y "Archivar datos"),
  cada una con su párrafo explicativo — se ponen lado a lado en
  `grid lg:grid-cols-2` en vez de apiladas a todo el ancho de la página
  (mismo motivo que Informe/tiles+Conclusiones: esos párrafos se habrían
  leído en líneas de texto larguísimas). `App.jsx` añade `"ajustes"` a
  `max-w-6xl`. En móvil, apiladas como siempre. Ninguna de las dos
  tarjetas se ha tocado por dentro.

- **Ticket de apuesta: se quitan "Compartir" y "Copiar"** (petición
  directa: "Compartir ahora mismo no funciona, solo se copia... y copiar
  ¿para qué sirve?"). "Compartir" solo copiaba un resumen de texto al
  portapapeles (`navigator.clipboard.writeText`) — no compartía de
  verdad nada; queda como idea para el futuro generar una imagen real de
  la apuesta y compartir esa, pero no se implementa ahora. El pie de
  `ApuestaItem.jsx` se queda con Cash Out (si pendiente)/Modificar/
  Eliminar. Al quitar el botón "Copiar" (duplicar una apuesta ya
  existente como una nueva Pendiente), `onCopiar`/`copiarApuesta` se
  quedaban sin ningún otro punto de llamada — en vez de dejar la
  fontanería suelta y sin usar, se ha quitado por completo: la función
  `copiarApuesta` de `useApuestas.js` y el prop `onCopiar`, hasta ahora
  encadenado por `App.jsx` → `PantallaInicio.jsx`/`Historial.jsx`/
  `EstadisticasDashboard.jsx`/`ListaApuestas.jsx` → `ApuestaItem.jsx`.

- **Bug real: el aviso de Telegram "ya puedes confirmarla" tardaba hasta
  el doble del margen previsto (o directamente no llegaba en la ventana
  que el usuario esperaba)**. Reportado como "esperé 2h30 y no llegó
  nada" y "en una apuesta en directo, esperé 10-15 minutos tras el
  pitido final y tampoco". La causa: `horaInicioPartido`
  (`src/utils/apuestas.js`) combinaba la fecha y hora del partido (que
  siempre vienen en hora de España, `api/partidos.js` pide con
  `timezone=Europe/Madrid`) con `new Date('YYYY-MM-DDTHH:mm:00')` — sin
  indicar zona horaria, esa cadena se interpreta en la zona horaria de
  donde CORRA el código. En el navegador del usuario (España) eso daba
  la hora correcta por pura coincidencia; en `api/telegram-avisos.js`
  (Vercel, que corre en UTC) el resultado quedaba desplazado 1h
  (invierno, CET) o 2h (verano, CEST) respecto a la hora real de inicio.
  Con el margen de 2h del aviso, en verano hacían falta 4h reales desde
  el saque inicial para que se disparara, no 2h — el comentario que ya
  existía en la función avisaba de esto pero lo daba por un "caso raro
  de cambio de hora a mitad de consulta", subestimando que en realidad
  es el desfase de todos los días del año, no un caso puntual.
  Corregido calculando el desfase real Madrid↔UTC en cada instante con
  `Intl.DateTimeFormat` (sin librería nueva, disponible en cualquier
  entorno JS) y restándolo — el resultado ya no depende de la zona
  horaria de quien ejecute el código, mismo comportamiento en el
  navegador y en el servidor.

- **Bug real: el teclado personalizado de Telegram (📋 Todas/💼 Apuestas/
  🎮 Entretenimiento) desaparecía al volver de la Mini App o de otra
  pantalla**, obligando a mandar `/start` de nuevo para que volviera a
  salir — reportado como "no son botones fijados". Le faltaba
  `is_persistent: true` en el `reply_markup` (Bot API 6.7+, api/telegram-
  webhook.js): sin ese flag, Telegram puede colapsar un teclado
  personalizado al navegar fuera del chat y volver, y sin él algunos
  clientes lo dan por cerrado del todo en vez de solo minimizado al
  icono pequeño. Con el flag, el cliente lo mantiene siempre visible.

- **Limpieza diaria del chat de Telegram, cada mañana entre las 8 y las
  9 (hora de España)** (petición directa: "quiero que el chat se
  elimine"). Aclarado con el usuario en dos pasos (`AskUserQuestion`),
  tras detectar él mismo que Todas/Apuestas/Entretenimiento solo listan
  lo PENDIENTE (no "todas las apuestas"):
  - Las apuestas ya resueltas (aviso de ganada/perdida/nula y el listado
    antiguo con el marcador puesto) también se borran cada mañana — el
    chat queda realmente limpio, solo con lo pendiente. No afecta a los
    datos reales (siguen intactos en la app/Supabase), Telegram es solo
    el canal de avisos.
  - Cron nuevo y propio, `api/telegram-limpieza.js` (mismo esqueleto que
    `api/telegram-avisos.js`, un segundo trabajo en cron-job.org cada 15
    min, con su propio `LIMPIEZA_CRON_SECRET`) — mismo patrón de "un
    archivo por función" que ya sigue el resto del bot, en vez de
    mezclarlo dentro de `telegram-avisos.js`.
  - Un bot solo puede borrar SUS PROPIOS mensajes (nunca lo que escribe
    el usuario ni los toques a los botones del teclado) — así que
    "eliminar el chat" es en la práctica "eliminar todo lo que manda el
    bot", excepto lo que sigue haciendo falta: la confirmación de
    `/start` (borrarla colapsaría el teclado personalizado — mismo bug
    de `is_persistent` corregido antes) y los mensajes con botón "Ver
    apuesta" de apuestas que SIGUEN pendientes (para que los botones del
    teclado se refieran a algo real).
  - Cada mensaje que manda el bot se guarda ahora con un `tipo`
    (`start`/`listado`/`aviso`/`registro`/`resuelta`) en la tabla ya
    existente `telegram_mensajes` (columna nueva; antes solo guardaba
    los mensajes con botón "Ver apuesta", para poder editarlo al
    resolverse). `actualizarBotonesApuesta` (`api/_lib/telegramMensajes.js`)
    dejó de BORRAR esas filas al resolver una apuesta — ahora las marca
    con una columna nueva `resuelta_en`, para que la limpieza sepa que
    ya puede llevárselas de verdad en vez de perder el rastro de a qué
    mensaje de Telegram habría que ir a borrar. `api/telegram-registro.js`
    y `api/telegram-resuelta.js` empiezan a guardar su propio mensaje
    (antes ninguno de los dos se guardaba, no hacía falta hasta ahora).
  - La franja horaria se calcula con `Intl.DateTimeFormat` (mismo truco
    ya usado en el arreglo del desfase horario del aviso de partido
    terminado) — el cron corre cada 15 min todo el día, pero solo actúa
    si la hora en Madrid es la 8; no hace falta guardar "ya se limpió
    hoy", tras la primera pasada no queda nada elegible para las 3
    pasadas siguientes de esa misma hora.
  - **Manual, fuera del código** (no se puede hacer desde aquí): añadir
    la columna `tipo`/`resuelta_en` a `telegram_mensajes` en Supabase
    (SQL Editor), la variable de entorno `LIMPIEZA_CRON_SECRET` en
    Vercel, y un segundo trabajo en cron-job.org contra
    `/api/telegram-limpieza?secret=<LIMPIEZA_CRON_SECRET>`.

- **Bug real: el aviso de "apuesta resuelta" avisaba con el resultado
  equivocado**. Reportado como "clico en la píldora de pendiente, como
  lo primero que sale es Ganada, se envía el aviso de que es ganadora
  cuando a lo mejor es perdida". Causa: cada pastilla de partido cicla
  Pendiente→Ganada→Perdida→Nula y escribe en Supabase en cada clic; el
  aviso solo miraba la transición pendiente→resuelto (la primera), así
  que el primer clic (aunque la intención final fuera Perdida/Nula) ya
  disparaba el aviso con "Ganada", y los clics siguientes para
  corregirlo ya no volvían a avisar (la app quedaba bien, el aviso de
  Telegram se quedaba mal). Corregido en `api/telegram-resuelta.js`:
  ahora dispara en cualquier cambio de resultado (mientras no sea
  "pendiente"), y en vez de mandar un mensaje nuevo cada vez (que
  habría espameado mensajes contradictorios mientras se corrige), EDITA
  el mismo mensaje si ya existe uno para esa apuesta — decidido con el
  usuario (`AskUserQuestion`). Si la edición falla (mensaje ya borrado,
  p.ej. por la limpieza diaria), se manda uno nuevo y se sustituye el
  rastro guardado.
- **Aviso "📝 Ya puedes confirmarla" sin botón** (petición directa, tras
  confirmar con el usuario que ahora resuelve desde la app, no desde la
  Mini App): `api/telegram-avisos.js` deja de mandar el botón "📱 Ver
  apuesta", queda en texto plano igual que el de registro. Como ya no
  tiene nada que editar ni un estado "pendiente" que respetar, pasa a
  borrarse siempre en la limpieza diaria (`api/telegram-limpieza.js`),
  junto con registro/resuelta, en vez de esperar a que la apuesta se
  resuelva. `actualizarBotonesApuesta` (`api/_lib/telegramMensajes.js`)
  se limita ahora a tipo `listado` — es el único que sigue llevando un
  botón editable (antes también tocaba `aviso`, que ya no tiene botón
  que editar).

- **Limpieza diaria movida a las 9:00 en punto** (petición directa —
  antes actuaba en toda la franja 8:00-8:59): `api/telegram-limpieza.js`
  ahora solo actúa si la hora en Madrid es la 9.
- **Verificación de punta a punta de todo el sistema de Telegram**, tras
  varias rondas de pruebas en real: registro, aviso de partido terminado,
  aviso de resuelta (con la edición en el mismo mensaje) y la limpieza
  diaria funcionan correctamente y de forma automática, sin intervención
  manual. La confusión inicial ("el aviso no llega") se debía a probar
  antes de que le tocara el siguiente tic del cron (hasta 15 min de
  espera desde que se crea/actualiza una apuesta) — no había ningún bug
  de fondo; confirmado comparando el histórico de ejecuciones de
  cron-job.org (200 OK cada 15 min) contra la hora real de creación de
  las apuestas de prueba.

- **Selector de fecha nuevo en "Nueva apuesta"** (petición directa, tras
  preguntar si buscar partidos de una fecha lejana como el 7 de agosto
  traería resultados — no, el plan gratuito de API-Football solo cubre
  aproximadamente ayer/hoy/mañana, ver `api/partidos.js`). El campo
  "Fecha" del formulario (`SelectorFecha.jsx`, nuevo) sustituye al
  `<input type="date">` nativo, que dejaba elegir cualquier día aunque
  estuviera garantizado que el buscador de partidos no iba a encontrar
  nada. Muestra 7 días (3 antes de hoy, hoy, 3 después): solo
  ayer/hoy/mañana son seleccionables, el resto se ven pero no se pueden
  tocar, para que la razón sea visible en vez de parecer un fallo.
  Escritorio: flechas compactas (mismo patrón que el navegador de
  periodo de Informe); móvil: tira de 7 casillas
  (DO/LU/MA/HOY/JU/VI/SA + fecha), según capturas de referencia
  compartidas por el usuario. Al ser el único campo de fecha de la
  apuesta (decidido con el usuario, `AskUserQuestion`: no queda un
  enlace aparte para fechas libres), se acepta perder la posibilidad de
  registrar una apuesta con fecha antigua a mano — no se usaba para
  apuestas atrasadas. Si se edita una apuesta con fecha fuera de estos 7
  días, no se resalta ningún día mientras no se toque el selector (no
  se fuerza ningún cambio de fecha solo por abrir el formulario).

- **Bug real: el formulario de nueva apuesta (y el de movimientos de Casas
  de apuestas) abría con la fecha de AYER durante la 1-2h siguientes a la
  medianoche.** Reportado justo al probar el nuevo `SelectorFecha.jsx`:
  "son las 12 [de la noche], sale correctamente el HOY en el día 20, pero
  al abrir el formulario sale primero el día 19". Causa: el helper
  `hoy()` de `FormularioApuesta.jsx`/`FormularioMovimiento.jsx` usaba
  `new Date().toISOString().slice(0, 10)` — `toISOString()` convierte a
  UTC, así que justo después de medianoche en España (UTC+1/+2) seguía
  siendo "ayer" en UTC durante 1-2h. `SelectorFecha.jsx` no tenía este
  fallo (ya calculaba con piezas de fecha en hora local, no con
  `toISOString()`), por eso navegar con las flechas sí llegaba bien al
  día 20 — el problema era solo el valor con el que arrancaba el
  formulario. Corregido con el mismo criterio que ya se usó para el
  desfase horario del aviso de Telegram: construir la fecha con
  `getFullYear()/getMonth()/getDate()` (hora local) en vez de
  `toISOString()` (UTC).

- **Tipo de fondos "Mixta" (dinero real + freebet en la misma apuesta)**
  (petición directa, tras un caso real: apuesta con 5€ de freebet + 0,33€
  de dinero real, imposible de registrar bien con el modelo binario de
  antes). Decisión clave que simplifica casi todo: `stake` sigue
  significando "dinero real" (igual que en el modo "real" de siempre) y
  se añade un campo nuevo, `stakeFreebet`, solo para la parte freebet —
  con eso, las ramas "perdida"/"cashout" de `calcularBeneficio`
  (`utils/apuestas.js`) y la fórmula de "Ganancia" de
  `ApuestaItem.jsx`/`TarjetaApuestaResumen.jsx` ya daban el resultado
  correcto sin tocarlas (restan/devuelven solo la parte real, que es
  justo lo que corresponde). Solo hizo falta:
  - `calcularBeneficio`, rama "ganada": suma la parte freebet a la real
    antes de multiplicar por la cuota (se gana sobre todo lo apostado).
  - `calcularEstadisticas`: "dinero real apostado" pasa de filtrar
    `tipoFondos === "real"` a `!== "freebet"` (incluye "mixta", cuyo
    `.stake` ya es la parte real); "freebet apostado" suma `.stake` en
    freebet pura o `.stakeFreebet` en mixta.
  - `App.jsx`, los tres sitios que ajustan el saldo de freebet de la
    casa (crear/nula/borrar pendiente) ganan una rama para "mixta" que
    descuenta/devuelve `stakeFreebet` en vez de `stake`.
  - `FormularioApuesta.jsx`: tercera pastilla "Mixta"; con ella
    elegida, el campo único "Cantidad apostada" se sustituye por dos
    ("Dinero real (€)" + "Freebet (€)"), y los avisos de bankroll/saldo
    de freebet disponible se activan a la vez comparando cada uno
    contra su importe correspondiente. Exige los dos importes > 0 (con
    uno a 0 no tiene sentido "mixta").
  - Pastilla "Mixta" en `ApuestaItem.jsx` (decidido con el usuario,
    `AskUserQuestion`: sin importes en la pastilla, solo el texto —
    el desglose ya se ve al editar la apuesta) y opción nueva en el
    filtro de tipo de fondos (`FiltrosApuestas.jsx`) — una apuesta mixta
    solo aparece bajo "Mixta", no bajo "Real" ni "Freebet".
  - `api/telegram-resuelta.js`: el resumen que llega a Telegram también
    dice "Mixta" en vez de caer por defecto en "Real".
  - Fuera de alcance a propósito: los trofeos de freebet
    (`utils/trofeos.js`) siguen contando solo apuestas 100% freebet, no
    mixtas; la Mini App de Telegram no crea apuestas nuevas (solo
    resuelve/cashea), así que no necesita selector de tipo de fondos.
  - **Manual, en Supabase (SQL Editor)**: `alter table apuestas add
    column if not exists stake_freebet numeric;` (nullable, como
    `seguro_freebet_importe`/`aumento_pct`).

- **Título opcional de la apuesta** (petición directa: identificar
  apuestas de una promoción concreta de la casa, ej. la "Winiela" de
  Winamax — no como un "titular libre" cualquiera, sino pensado para
  ese caso). Se valoró primero revivir algo parecido a la sección
  "Promociones" ya eliminada (ver más arriba, "Promociones, eliminada
  por completo"), pero el usuario solo quería un campo suelto al elegir
  la casa, no una sección aparte — mismo espíritu que ya quedó anotado
  entonces ("una promoción se registra ahora como una apuesta normal").
  Campo nuevo `titulo` (columna `text`, nullable, sin migración de
  datos) en `FormularioApuesta.jsx`, justo debajo del selector de casa;
  se guarda tal cual (recortado, o `null` si se deja vacío) desde
  `useApuestas.js` (`agregarApuesta`/`editarApuesta`) y se lee en
  `desdeFila` (`utils/apuestas.js`). No participa en ningún cálculo
  (beneficio, estadísticas, filtros) — solo se muestra: en gold encima
  del nombre de la combinada/simple en `ApuestaItem.jsx`, como línea (o
  prefijo, en la fila densa de escritorio) junto al evento en
  `TarjetaApuestaResumen.jsx`, en la tira resumen colapsada del propio
  formulario, en el ticket de la Mini App de Telegram
  (`TicketApuesta.jsx`) y con el emoji 🏷 en los cuatro mensajes de
  Telegram que citan el nº de apuesta (`api/telegram-registro.js`,
  `api/telegram-resuelta.js`, `api/telegram-avisos.js`,
  `api/telegram-webhook.js`).
  - **Manual, en Supabase (SQL Editor)**: `alter table apuestas add
    column if not exists titulo text;`.

- **Aviso de "apuestas pendientes" de Inicio, arreglado y simplificado**
  (petición directa: el botón del aviso solo llevaba a UN bankroll —
  Apuestas o Entretenimiento, mezclado además con el resto de apuestas de
  esa sección — así que si había pendientes vencidas en los dos
  bankrolls a la vez, uno se quedaba sin visibilidad). Primer intento
  descartado a medio camino: reusar el criterio de "partido ya terminado"
  del aviso de Telegram (`horaInicioPartido` + margen de 2h,
  `api/telegram-avisos.js`) para distinguir pendientes "vencidas" de las
  demás — el propio usuario lo frenó ("no tiene sentido lo de 'ya
  deberían haber terminado'"): una combinada puede incluir un partido
  dentro de varios días que la API de fútbol (plan gratuito) todavía no
  puede confirmar como jugado, así que ese cálculo podía dar por hecho
  algo que no era cierto. Se simplificó a "sigue pendiente", sin
  intentar adivinar si el partido ya se jugó (confirmado con el usuario,
  `AskUserQuestion`: contar TODAS las pendientes, no solo las de fecha ya
  pasada).
  - `utils/apuestas.js`: `pendientesAntiguas` (exigía fecha del partido <
    hoy) sustituida por `todasPendientes` (solo `resultado ===
    "pendiente"`, sin mirar fecha).
  - `AvisoPendientes.jsx`: texto simplificado a "Tienes X apuesta(s)
    pendiente(s)." (sin afirmar que el partido "ya debería haber
    terminado"); un solo botón "Ver pendientes" en vez de un botón por
    bankroll.
  - `Historial.jsx`: nueva 4ª pastilla "Pendientes" (oculta si no hay
    ninguna) que combina Apuestas + Entretenimiento — mismo criterio
    `todasPendientes`; si se resuelven todas mientras se está viendo ese
    filtro, vuelve solo a "Todas" en vez de quedarse con un listado vacío.
    Nuevo prop `filtroInicial` para poder abrir la sección con esa
    pastilla ya puesta.
  - `PantallaInicio.jsx`: usa `todasPendientes`; el aviso navega con
    `onVerPendientes` en vez de `onIrASeccion` (bankroll).
  - `App.jsx`: nuevo estado `filtroHistorialInicial` +
    `irAPendientesEnHistorial()` — al pulsar el botón del aviso, va a
    Historial con "Pendientes" ya seleccionado; se limpia solo al salir
    de Historial, para no interferir si luego se entra ahí desde el menú
    normal (arranca en "Todas", como siempre).
  - Fuera de alcance a propósito: `api/telegram-avisos.js` no se toca —
    su propio criterio de "partido terminado" (con caché real de
    resultados de la API, no solo tiempo transcurrido) sigue igual, es
    independiente de este aviso de Inicio.

- **Editar logo y nombre de una casa de apuestas, sin borrarla** (petición
  directa: el usuario había hecho un lienzo nuevo para que todos los
  logos midieran igual, pero corregir uno significaba borrar la casa y
  volver a añadirla — el nombre de la casa es solo texto en apuestas y
  movimientos, no una clave foránea, así que no se habrían perdido, pero
  el saldo de freebet sí, al vivir en la propia fila de "casas"). En
  `DetalleCasa.jsx`, debajo del nombre y antes de la línea divisoria
  (primer sitio propuesto: más abajo, después de la línea — cambiado por
  petición directa), un enlace "✎ Cambiar logo"/"Añadir logo" y otro "✎
  Cambiar nombre" (abre un campo de texto en línea con Guardar/Cancelar),
  en el mismo sitio tanto en móvil (aquí no hay cabecera propia — la fila
  de `ListadoCasas.jsx` ya muestra el nombre, así que este bloque va justo
  debajo) como en el panel de escritorio (dentro de su propia cabecera).
  - `useCasas.js`: `editarLogoCasa(nombre, logo)` (solo actualiza esa
    fila) y `editarNombreCasa(nombreAnterior, nombreNuevo)` (bloquea el
    cambio, igual que `agregarCasa`, si ya existe otra casa con ese
    nombre — fundir dos casas en una no es el caso de uso; devuelve
    `true`/`false` para que la UI pueda avisar si no se hizo).
  - Renombrar (no el logo) tiene que tocar también las apuestas y
    movimientos ya guardados, que referencian la casa por su nombre en
    texto: `renombrarCasaEnApuestas` (`useApuestas.js`) y
    `renombrarCasaEnMovimientos` (`useMovimientos.js`), disparadas juntas
    desde `App.jsx` (`manejarRenombrarCasa`) solo si `editarNombreCasa`
    confirma que el cambio se hizo — si no, esos dos no se disparan, para
    no desincronizar nombres.
  - `ListadoCasas.jsx`: si la casa renombrada es la que está abierta
    (fila expandida en móvil, o panel de escritorio), `casaExpandida` seguía
    el nombre viejo — sin actualizarla, el guard que cierra el panel al
    borrar una casa ("ya no existe con ese nombre") lo habría cerrado
    justo al terminar de renombrarla, como si se hubiera borrado.

- **Dos fallos de Bankroll, detectados juntos** (petición directa, con un
  caso real: 2€ pendientes en Winamax y 1€ pendientes en Betfair — el
  Bankroll de Estadísticas mostraba 2,00€ con CUALQUIER casa elegida en
  el desplegable, y el 1€ de Betfair no afectaba a nada en ningún sitio).
  Confirmados los dos con el usuario (`AskUserQuestion`) antes de tocar
  nada, porque cambian cálculos usados en toda la app.
  - **Bug real**: en `EstadisticasDashboard.jsx` y `PanelEstadisticas.jsx`,
    el recuadro "Bankroll" se calculaba siempre sobre TODAS las casas
    (`apuestasDelBankroll`/`movimientosDelBankroll`, solo filtrados por
    Apuestas/Entretenimiento), ignorando qué casa concreta estuviera
    elegida en el desplegable — a propósito en su día ("mismo criterio
    que 'Bankroll total' en Casas de apuestas"), pero confuso en la
    práctica: elegir una casa cualquiera enseñaba siempre el mismo
    número. Ahora, si hay una casa elegida (`hayFiltro`), el Bankroll (y
    los freebets) se acotan a esa casa; sin ninguna elegida, sigue siendo
    el total de todas, como antes.
  - **Cambio de criterio**: `calcularBankrollPorCasa` (`src/utils/
    movimientos.js`) pasa de `ingresos − retiradas + beneficio` a
    `ingresos − retiradas + beneficio − dinero real ya comprometido en
    apuestas pendientes de esa casa` (nuevo campo `stakePendienteReal` en
    lo que devuelve, por si hace falta mostrarlo aparte más adelante). El
    dinero de una apuesta ya jugada pero sin resolver dejó de contar como
    "disponible" — antes se contaba dos veces en la práctica (seguía en
    el bankroll Y estaba jugado en la apuesta). Freebet puro no resta
    nada (esa parte nunca fue dinero real, ya se descontó del saldo de
    freebet al crear la apuesta); en mixta solo la parte real (`stake`).
    Como esta función la usan Inicio, Casas de apuestas, Estadísticas y
    el aviso de bankroll superado en `FormularioApuesta.jsx`, el cambio
    se propaga solo a los cuatro sitios sin tocar cada uno.

- **Tarjeta "En juego" en Inicio** (petición directa, junto al Bankroll):
  reutiliza `stats.stakePendienteReal` (`calcularEstadisticas`,
  `utils/apuestas.js` — mismo dato que ya mostraba el panel de
  Estadísticas), sin ningún cálculo nuevo. `PantallaInicio.jsx` pasa de 4
  a 5 tarjetas (`grid-cols-2 sm:grid-cols-5`); "Racha actual" (la última)
  gana `col-span-2 sm:col-span-1` para no quedar sola y descentrada en la
  última fila de móvil.

- **"Ganancia"/"Beneficio" de una apuesta pendiente en la fila densa de
  listados** (`TarjetaApuestaResumen.jsx`, la fila con Cuota/Importe/
  Ganancia/Beneficio de Inicio/Historial en escritorio) — petición
  directa tras ver una combinada de cuota alta (27.55, "Winiela")
  mostrando "Beneficio 0,00€ / Ganancia 2,00€" (el propio stake) como si
  fuera una apuesta nula, en vez de lo que se ganaría si acierta. Mismo
  fallo que ya se había corregido antes en el ticket completo
  (`ApuestaItem.jsx`, ver más arriba en este historial): `calcularBeneficio`
  siempre da 0 mientras está "pendiente" (aún no ha pasado nada), y
  pendiente/nula acababan mostrando el mismo número aunque signifiquen
  cosas muy distintas. Se aplica aquí el mismo criterio que ya usa
  `ApuestaItem.jsx`: si está pendiente, se muestra el potencial (stake ×
  (cuota−1), con el aumento de cuota si lo hay) en vez de 0/stake.

- **Recordar la sección activa entre recargas (F5)** (petición directa:
  al recargar en cualquier sección que no fuera Inicio, la app volvía
  siempre a Inicio). `seccionActiva` (`App.jsx`) es solo estado de React,
  sin URL/router propio (ver Stack, "sin router — la ruta se resuelve a
  mano" es solo para la Mini App de Telegram) — se guarda ahora en
  `localStorage` (clave `hall-of-bets:seccion-activa`), mismo patrón que
  `useModoOscuro.js` (preferencia de este dispositivo, no se sincroniza
  entre dispositivos). No hace falta validar el valor guardado contra una
  lista de secciones válidas: la cadena de condiciones de `App.jsx` ya
  cae en Estadísticas por defecto si no coincide con ninguna.
