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
  `useCasas`/`useMovimientos` solo para esto.

## Convenciones de código

- Componentes funcionales con hooks, sin clases
- Un componente por responsabilidad clara; evita archivos gigantes
- Comentarios breves en español donde la lógica no sea obvia (freebets, combinadas, cálculo de yield)
- No añadir dependencias nuevas sin comentarlo primero
