# Hall of Bets — Guion de desarrollo

Registro personal de apuestas. Hoja de ruta para construirlo poco a poco en VS Code con Claude Code, sin dejarte nada por el camino.

---

## 1. Concepto

App personal (no multiusuario) para registrar apuestas deportivas, separando bankroll serio de entretenimiento, con sección aparte para promociones, bot de lectura de fotos, combinadas reales, estadísticas y una sala de trofeos.

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
- [x] Sección **Promociones** aparte (no cuenta en el yield general): tipo, valor, estado, beneficio neto
- [x] Ver apuestas filtradas por casa de apuestas específica
- [x] Filtro adicional por tipo de fondos (Todas / Real / Freebet) — el freebet no tiene sección propia, es un filtro dentro de Apuestas y Entretenimiento (la promo que originó el crédito ya se registra en Promociones)

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
  - Primera promoción convertida en beneficio
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

**promociones**: id, user_id, fecha, casa, tipo, valor, estado, beneficio_neto, creado_en

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

17. ✅ **Reorganización de arquitectura y navegación** — hecho. Sin lógica nueva, solo estructura. Navegación final: 🏠 Inicio · 🎟 Apuestas · 🎲 Entretenimiento · 🎁 Promociones (se mantuvo como pestaña, no se movió) · 📊 Estadísticas · 🏦 Casas de apuestas · 📅 Informe · 🏆 Trofeos · ⚙️ Ajustes · 🎓 Academia (vacía por ahora). "Inicio" nuevo, con resumen (bankroll total, beneficio, yield, racha), últimas 5 apuestas y accesos rápidos, reutilizando datos ya existentes. "Casas de apuestas" pasa a incluir saldo, ingresado, retirado, beneficio e historial de movimientos por casa (se fusionó ahí la antigua sección "Ingresos y retiradas"). "Ajustes" nuevo, con la copia de seguridad movida ahí. "Estadísticas" es de momento la antigua sección "Desglose" renombrada (mismo componente) — la fase 18 la sustituye por el dashboard completo. "Promociones" se mantuvo como pestaña principal, pendiente de revisión futura, sin tocar su lógica.
18. ✅ **Dashboard de Estadísticas** — hecho. KPIs (beneficio, ROI, yield, % acierto, bankroll, cuota media, nº apuestas, beneficio del mes en curso), evolución (línea, con filtros 7d/30d/90d/año/histórico), beneficio mensual (barras), distribución Ganada/Perdida/Nula/Pendiente (donut, con los colores de estado que ya usa toda la app), rachas (actual/mejor/peor) + mejor y peor apuesta, ROI por deporte, ROI por casa, beneficio por rango de cuotas, calendario de actividad (estilo GitHub, último año), insights automáticos (frases sueltas, sin narrativa — eso es la fase 19). Añadido el campo **deporte** al registrar apuestas: lista cerrada — Fútbol, Baloncesto, Tenis, eSports, Otro (por defecto Fútbol); las apuestas de antes de este campo cuentan como "Otro". Un matiz de nomenclatura: "ROI por casa" es ROI de verdad (beneficio/ingresos, como en Casas de apuestas); "ROI por deporte" es en realidad yield (beneficio/stake), porque los ingresos van ligados a la casa, no al deporte — no hay forma de calcular un ROI real por deporte.
19. **Informe profesional** — deja de ser una copia de Estadísticas: resumen del periodo, conclusiones e interpretación automática, comparación con periodos anteriores, arquitectura preparada para exportar a PDF (sin implementar el export todavía si no es trivial).
20. **Academia** — sección educativa nueva. Conceptos mínimos: Stake, ROI, Yield, Bankroll, Cuota, Win Rate, EV, Probabilidad implícita, Cash Out, Void, Apuesta simple, Apuesta combinada. Cada uno con definición, explicación sencilla, fórmula, ejemplo e interpretación, errores frecuentes. Botón ℹ️ junto a cada métrica importante de la app que enlace al concepto correspondiente. El contenido lo redacta Claude Code — conviene una lectura rápida tuya al terminar (no reescribir, solo detectar algo que suene raro), ya que un error aquí es un dato mal explicado, no un fallo visual.
21. **Gamificación de Trofeos** — añade progreso, categorías, niveles, porcentaje completado a la sala ya existente. Prepara (sin implementar todavía) la arquitectura para objetivos personales futuros.
22. **Optimización y arquitectura futura** — sin implementar: APIs deportivas, IA para registrar apuestas, autocompletado de partidos, sincronización automática de resultados (todo esto sigue descartado por coste, ver sección 3). Solo dejar la arquitectura preparada para que puedan añadirse más adelante sin fricción, evitando decisiones de código que las dificulten.
