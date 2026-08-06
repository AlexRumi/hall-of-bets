# Hall of Bets — Guion de desarrollo

Registro personal de apuestas. Hoja de ruta para construirlo poco a poco en VS Code con Claude Code, sin dejarte nada por el camino.

---

## 1. Concepto

App personal (no multiusuario) para registrar apuestas deportivas, separando bankroll serio de entretenimiento, con bot de lectura de fotos, combinadas reales, estadísticas y una sala de trofeos.

---

## 2. Funcionalidades — checklist

**Registro**
- [x] Registro de apuestas: fecha, casa, evento (placeholder libre, ej. "Over 2.5 goals"), stake, cuota, resultado
- [x] Estado inicial al registrar: **Pendiente** (se actualiza a mano a Ganada/Perdida/Nula)
- [x] Casas de apuestas gestionables (desplegable, añadir nuevas)
- [x] **Tipo de fondos** por apuesta: Dinero real / Crédito bono (freebet)
  - Ganada: la ganancia real es igual en ambos casos, `stake × (cuota − 1)` (con freebet no se recupera el stake, solo se cobra la ganancia)
  - Perdida con freebet: 0€ reales perdidos (el crédito no era dinero tuyo)
  - **El stake en freebet NO cuenta en el "stake total" ni en el yield** — solo el dinero real arriesgado. Se muestra aparte: nº apuestas con freebet, valor total de créditos usados, ganancia real generada por ellos
- [x] **Combinadas**: opción de "añadir nueva cuota" dentro de la misma apuesta — la cuota total es el producto de las cuotas de cada selección; si una selección se marca como perdida, la apuesta completa se marca como perdida
- [ ] Bot de fotos: sube captura → IA rellena el formulario → confirmas antes de guardar

**Organización**
- [x] Dos bankrolls independientes: **Apuestas (serias)** y **Entretenimiento**, cada uno con su propio stake, yield y gráfica
- [x] ~~Sección Promociones aparte~~ — se construyó y luego se eliminó (ver sección 8): una promoción se registra como una apuesta normal
- [x] Ver apuestas filtradas por casa de apuestas específica
- [x] Filtro adicional por tipo de fondos (Todas / Real / Freebet) — el freebet no tiene sección propia, es un filtro dentro de Apuestas y Entretenimiento

**Estadísticas**
- [x] Stake medio, cuota media, yield
- [x] Gráfico de ganancias/pérdidas acumuladas
- [x] Estadísticas y gráficos por día / semana / mes / año
- [x] Racha actual de apuestas ganadas

**Sala de trofeos**
- [x] Sección de logros desbloqueables, sin efecto real en el bankroll — solo motivación. Ejemplos de partida:
  - Acertar una cuota ≥ 1,8
  - Acertar una cuota ≥ 3,0
  - 5 apuestas ganadas seguidas
  - 10 apuestas ganadas seguidas
  - Primera combinada acertada
  - (Ampliable con el tiempo — no hace falta definirlos todos ahora)

**Base**
- [x] Borrado individual (una apuesta) y borrado total (con confirmación)
- [x] Persistencia real de datos

## 3. Descartado

- ✗ Resolución automática de apuestas vía API de resultados deportivos — registro manual.
- ✗ Desplegable fijo de tipos de mercado — sustituido por un placeholder de texto libre en la propia apuesta.

## 3bis. Ideas futuras (no entran en este ciclo de fases)

**Orden decidido para retomar (fase 13 en adelante):**

13. ✅ **Listado / gestión de casas** — hecho.
14. ✅ **Informe mensual** — hecho.
15. ✅ **Desglose por casa de apuestas** — hecho (fusionado dentro de "Casas de apuestas" en la fase 17, junto con el rediseño del formulario).
16. ✅ **Modo oscuro / claro** — hecho (segundo intento; el primero se descartó porque los inputs salían con el gris nativo del navegador — arreglado fijando su fondo/color explícitamente en `src/index.css`).
17. ✅ **Reorganización de arquitectura y navegación** — hecho (ver sección 8).

**Aparcadas indefinidamente (no en la cola anterior):**

- 🔲 **Bot de fotos** (antigua fase 11) — descartado por el coste recurrente de la IA leyendo imágenes. Retomable si cambias de idea.
- 🔲 **Bot de Telegram** — canal alternativo al bot de fotos vía Telegram en vez de formulario web. Depende del punto anterior (bot de fotos), así que solo tiene sentido si ese se retoma primero.
- ✅ **Sincronización real de datos (Supabase)** — TERMINADA Y VALIDADA. La app sincroniza correctamente entre PC y móvil.

---

## 4. Stack técnico

| Capa | Elección | Estado |
|---|---|---|
| Frontend | React + Vite, **JavaScript** | ✅ en uso |
| Estilos | Tailwind CSS | ✅ en uso |
| Backend | Supabase (Postgres + Auth), sin servidor propio | ✅ en uso |
| Base de datos | **Supabase** (Postgres gestionado, capa gratuita) | ✅ en uso — sincroniza entre PC y móvil |
| Despliegue | Vercel, con GitHub (`AlexRumi/hall-of-bets`) | ✅ en uso |

---

## 5. Modelo de datos (tal como está implementado en Supabase)

**casas**: user_id, nombre, logo (clave primaria: user_id + nombre)

**apuestas**: id, user_id, fecha, casa, stake, tipo_fondos (`real`/`freebet`), categoria (`apuestas`/`entretenimiento`), deporte (texto libre, lista cerrada en el formulario; nullable — de antes de la fase 18), resultado (`pendiente`/`ganada`/`perdida`/`nula`), selecciones (jsonb: una o varias filas — más de una es una combinada), creado_en

**promociones**: id, user_id, fecha, casa, tipo, valor, estado, beneficio_neto, creado_en — tabla sin usar desde la app (ver sección 8, eliminación de Promociones); no se ha borrado por si hay datos históricos

**movimientos**: id, user_id, fecha, casa, tipo (`ingreso`/`retirada`), cantidad, creado_en

Todas las tablas con Row Level Security atada a `auth.uid() = user_id`.

---

## 6. Fases de construcción (1-12, completadas)

1. Setup del proyecto — ✅
2. CRUD básico de apuestas — ✅
3. Selecciones y combinadas — ✅
4. Categorías (Apuestas / Entretenimiento) — ✅
5. Casas de apuestas y filtros — ✅
6. Estadísticas y gráfica de beneficio acumulado — ✅
7. Estadísticas por periodo + racha de victorias — ✅
8. Promociones — ✅
9. Borrado individual y total — ✅
10. Sala de trofeos — ✅
11. ~~Bot de fotos~~ — omitida por coste recurrente de la IA
12. Despliegue (Vercel) — ✅

---

## 7. Referencia visual

Paleta felt/dorado/paper ya fijada en `tailwind.config.js` / `src/index.css` (con variante de modo oscuro). No cambiar sin pedirlo explícitamente.

---

## 8. Rediseño y expansión (fases 17-22)

Bloque grande, iniciado tras confirmar que Supabase funciona y sincroniza bien. Requisitos generales para todas estas fases: no cambiar la identidad visual (paleta felt/dorado), no romper funcionalidades existentes, mantener la app funcional al terminar cada fase, no avanzar a la siguiente sin la anterior terminada y probada. Antes de cada fase, Claude Code debe analizar qué componentes tocar y reutilizar el máximo código posible.

17. ✅ **Reorganización de arquitectura y navegación** — hecho. Sin lógica nueva, solo estructura. Navegación final en ese momento: 🏠 Inicio · 🎟 Apuestas · 🎲 Entretenimiento · 🎁 Promociones (se mantuvo como pestaña, no se movió) · 📊 Estadísticas · 🏦 Casas de apuestas · 📅 Informe · 🏆 Trofeos · ⚙️ Ajustes · 🎓 Academia (vacía por ahora). "Inicio" nuevo, con resumen (bankroll total, beneficio, yield, racha), últimas 5 apuestas y accesos rápidos, reutilizando datos ya existentes. "Casas de apuestas" pasa a incluir saldo, ingresado, retirado, beneficio e historial de movimientos por casa (se fusionó ahí la antigua sección "Ingresos y retiradas"). "Ajustes" nuevo, con la copia de seguridad movida ahí. "Estadísticas" es de momento la antigua sección "Desglose" renombrada (mismo componente) — la fase 18 la sustituye por el dashboard completo. "Promociones" se mantuvo como pestaña principal en esta fase, pendiente de revisión futura — ver más abajo, se acabó eliminando del todo.
18. ✅ **Dashboard de Estadísticas** — hecho. KPIs (beneficio, ROI, yield, % acierto, bankroll, cuota media, nº apuestas, beneficio del mes en curso), evolución (línea, con filtros 7d/30d/90d/año/histórico), beneficio mensual (barras), distribución Ganada/Perdida/Nula/Pendiente (donut, con los colores de estado que ya usa toda la app), rachas (actual/mejor/peor) + mejor y peor apuesta, ROI por deporte, ROI por casa, beneficio por rango de cuotas, calendario de actividad (estilo GitHub, último año), insights automáticos (frases sueltas, sin narrativa — eso es la fase 19). Añadido el campo **deporte** al registrar apuestas: lista cerrada — Fútbol, Baloncesto, Tenis, eSports, Otro (por defecto Fútbol); las apuestas de antes de este campo cuentan como "Otro". Un matiz de nomenclatura: "ROI por casa" es ROI de verdad (beneficio/ingresos, como en Casas de apuestas); "ROI por deporte" es en realidad yield (beneficio/stake), porque los ingresos van ligados a la casa, no al deporte — no hay forma de calcular un ROI real por deporte.
19. ✅ **Informe profesional** — hecho. Deja de ser una lista de todos los meses: ahora muestra un periodo a la vez (Semana/Mes/Año, elegible), con flechas ← → para navegar hacia atrás (no se puede ir al futuro), comparación automática con el periodo anterior (badges ▲/▼ % en cada KPI) y un bloque de "Conclusiones" con 2-3 frases generadas por plantilla a partir de esos números (sin narrativa compleja ni IA). Mantiene el selector de bankroll Apuestas/Entretenimiento. Sigue siendo un único bloque de contenido estático (sin pestañas ocultas), para que exportar a PDF más adelante sea sencillo — el export en sí no se implementó.
**Eliminación de Promociones** (no era una fase del guion, decisión directa tras la fase 19): la sección se quita del todo, no se fusiona en ningún otro sitio. Razón: una promoción es al final una apuesta más — se registra igual, opcionalmente con "Promoción" en el texto del evento, sin necesidad de un modelo de datos ni una pantalla propia. Se borran `PromocionesSection.jsx`, `FormularioPromocion.jsx`, `PromocionItem.jsx`, `ListaPromociones.jsx`, `usePromociones.js` y el trofeo "Cazapromos"; la pestaña desaparece de la navegación. La tabla `promociones` de Supabase se queda tal cual, sin usarse, por si hubiera datos históricos que consultar alguna vez a mano.

**Navegación responsive** (no era una fase del guion, varias vueltas de diseño directo con el usuario tras la fase 19): barra lateral fija en escritorio con las 9 secciones (el nombre "Hall of Bets" vive en la cabecera, no repetido en la barra), barra fija abajo en móvil con 5 accesos (Apuestas despliega Apuestas/Entretenimiento al tocarlo), y el resto de secciones en el menú ☰ — que en escritorio ya solo tiene modo oscuro/claro y cerrar sesión (visibles como iconos sueltos en la cabecera, sin ni siquiera abrir el ☰).

20. ✅ **Academia** — hecho. 12 conceptos (Stake, ROI, Yield, Bankroll, Cuota, Win Rate, EV, Probabilidad implícita, Cash Out, Void, Apuesta simple, Apuesta combinada), cada uno con definición, explicación sencilla, fórmula, ejemplo, interpretación y errores frecuentes, en un acordeón con buscador. Botón ℹ️ junto a las métricas que tienen concepto asociado en los KPIs de Estadísticas, Apuestas/Entretenimiento e Informe (no en el desglose por casa, para no repetir cableado); al pulsarlo, abre un recuadro con la explicación del concepto ahí mismo (cambiado tras la fase, ver más abajo — al principio saltaba a Academia y había que volver, se sustituyó por el recuadro in-situ).

**Pulido de navegación y gráficas** (no era una fase del guion, varias rondas de ajustes directos con el usuario tras la fase 20): cabecera y menú lateral de escritorio fijos al hacer scroll; barra inferior móvil sin el bug del desplegable Apuestas/Entretenimiento que se quedaba abierto de fondo; menú ☰ con el mismo orden que el menú lateral, borde dorado y fondo difuminado para destacar en modo oscuro; tooltips de las gráficas con borde dorado, tamaño mayor en escritorio y más compacto en móvil (y aún más compacto si hay muchas barras, como en ROI por casa con muchas casas); al cambiar de sección, la página vuelve arriba del todo. Además, el formulario de nueva apuesta muestra el bankroll disponible de la casa elegida y avisa (sin bloquear el envío) si está a 0 o si el importe la supera.

21. ✅ **Gamificación de Trofeos** — hecho. `utils/trofeos.js`: cada trofeo tiene ahora `categoria` (Volumen, Rachas, Cuotas, Combinadas, Especiales) y, cuando aplica, una función `progreso` que calcula actual/objetivo (p.ej. "42 / 100 apuestas"); los trofeos ocultos (`oculto: true`) no calculan progreso hasta desbloquearse, para no delatar el objetivo. `SalaTrofeos.jsx`: cabecera con % completado y barra, resumen de cuántos trofeos hay conseguidos por nivel (bronce/plata/oro/platino), secciones por categoría, y barra de progreso en cada trofeo pendiente que tenga uno. Arquitectura pensada para que un futuro "objetivo personal" del usuario encaje con la misma forma (id, categoría, tier, comprobar, progreso) sin tocar `SalaTrofeos.jsx` — no implementado todavía, eso es la fase 22.
**Filtro por casa en Estadísticas y rediseño de la barra móvil** (no era una fase del guion, petición directa tras la fase 21): pastillas de acceso rápido en Estadísticas ("Estadísticas Totales" + cada casa) que recalculan todo el dashboard para esa casa sola; botón "Inicio" de la barra inferior móvil rediseñado como círculo flotante sobre la barra; la pestaña móvil "Apuestas" se renombra a "Registro" (lleva directo al formulario, sin desplegable) para no chocar con el selector Apuestas/Entretenimiento que ahora vive arriba de esa pantalla en móvil.

**Cash Out** (no era una fase del guion, petición directa): nuevo resultado además de Ganada/Perdida/Nula, disponible tanto en Apuestas como en Entretenimiento. Pide el importe pagado por la casa (no se puede calcular con la cuota, lo decide la casa en el momento) y lo guarda en la columna `cashout_importe` de Supabase. Beneficio: con dinero real, importe recibido menos el stake; con freebet, el importe recibido es ganancia entera. No cuenta en el % de acierto (como "Nula"), pero sí corta una racha de victorias y sí suma al beneficio/yield. Tiene su propio color (azul acero) para no confundirse con los otros 4 resultados.

**Buscador de partidos (API-Football)** (no era una fase del guion, petición directa tras registrarse en API-Football con cuenta gratuita): el usuario se registró por su cuenta y pidió conectar el autocompletado de partidos, así que ese punto concreto de la fase 22 deja de estar descartado. Al escribir el evento de una apuesta, sugiere partidos reales de 21 competiciones (España, Italia, Francia, Alemania e Inglaterra —primera, segunda y copa de cada una—, las 3 copas europeas, Portugal y Países Bajos) y rellena evento/país/competición/fecha solos; el resto de ligas del mundo se sigue escribiendo a mano, no se ha roto nada de lo que ya había. Requirió la primera pieza de servidor propio del proyecto (`api/partidos.js`, una Serverless Function de Vercel) porque la key de API-Football es secreta, a diferencia de la de Supabase — ver detalle técnico en `CLAUDE.md`.

22. **Optimización y arquitectura futura** — sin implementar: IA para registrar apuestas, sincronización automática de resultados (resolver Ganada/Perdida sola a partir de una API — distinto del autocompletado de partidos de arriba, que solo rellena datos, no decide el resultado; sigue descartado por coste y por preferir el registro manual, ver sección 3). Solo dejar la arquitectura preparada para que puedan añadirse más adelante sin fricción, evitando decisiones de código que las dificulten.
