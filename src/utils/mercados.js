// Catálogo del desplegable de "Apuesta" (ver SelectorMercado.jsx). Cada
// opción es una función texto({ local, visitante }) que ya genera el texto
// final completo — a diferencia de la primera versión, aquí no hace falta
// escribir ninguna línea aparte: cada entrada del desplegable es ya un
// mercado concreto (p.ej. "Over 2.5 goles"). Elegir "Otro mercado" en el
// desplegable es lo único que abre un campo de texto libre.
//
// Este archivo expone DOS formas del mismo catálogo, construidas a partir
// de las mismas listas de opciones (mismos ids, mismas funciones texto —
// nunca duplicadas, solo reorganizadas):
// - CATEGORIAS_MERCADO: lista plana de 18 categorías, la de siempre. La
//   siguen usando buscarMercadoPorTexto/etiquetaCategoriaDeTexto (y por
//   tanto calcularEstadisticasPorMercado/calcularFrecuenciaMercados en
//   utils/estadisticas.js) — no tenía sentido tocar el desglose de
//   Estadísticas solo por rediseñar el selector.
// - ARBOL_MERCADOS: 9 categorías principales con subcategorías (y un
//   tercer nivel Local/Visitante donde aplica), para SelectorMercado.jsx.

// El buscador de partidos rellena "Evento" como "Equipo local - Equipo
// visitante" (ver BuscadorEvento.jsx); si no tiene ese formato exacto
// (escrito a mano, u otro deporte), se usan nombres genéricos.
export function equiposDesdeEvento(evento) {
  const partes = (evento ?? "").split(" - ");
  return partes.length === 2 && partes[0].trim() && partes[1].trim()
    ? { local: partes[0].trim(), visitante: partes[1].trim() }
    : { local: "Equipo Local", visitante: "Equipo Visitante" };
}

// A diferencia de equiposDesdeEvento (siempre da un nombre, genérico si
// hace falta, para generar texto de mercado), esto dice si de verdad
// merece la pena partir "evento" en dos líneas (un equipo encima del
// otro) — con nombres genéricos de repuesto no aportaría nada.
export function esFormatoEquipos(evento) {
  const partes = (evento ?? "").split(" - ");
  return partes.length === 2 && !!partes[0].trim() && !!partes[1].trim();
}

const LINEAS_GOLES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
const LINEAS_GOLES_MEDIO = [0.5, 1.5, 2.5, 3.5];
// Córners del partido completo (mercado "Córners", sin equipo): líneas de
// 4.5 a 14.5 — tiene sentido un rango alto porque suma los córners de los
// dos equipos. Ampliado desde 6.5 (petición directa) para cubrir también
// partidos con pocos córners.
const LINEAS_CORNERS = [4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5];
// Córners de UN equipo, partido completo (petición directa, ajuste tras
// probar el catálogo con datos reales: 6.5-14.5 quedaba demasiado alto
// para un solo equipo, casi nunca se llega): 0.5 a 9.5.
const LINEAS_CORNERS_EQUIPO = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];
// Córners de un equipo por mitad (misma petición, mismo motivo): 0.5 a 4.5.
const LINEAS_CORNERS_MEDIO = [0.5, 1.5, 2.5, 3.5, 4.5];
// Tarjetas: mismo patrón que goles (Over/Under), líneas 0.5 a 6.5.
const LINEAS_TARJETAS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];

// ---------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------

const OPCIONES_1X2 = [
  { id: "1", texto: (eq) => `Gana ${eq.local}` },
  { id: "x", texto: () => "Empate" },
  { id: "2", texto: (eq) => `Gana ${eq.visitante}` },
];

// Betfair Exchange: se puede apostar a favor (back) o en contra (lay) de
// cada resultado, no solo elegir un ganador. Sin nombre de equipo aquí
// (Local/Empate/Visitante), pedido así explícitamente.
const OPCIONES_FAVOR_CONTRA = [
  { id: "exchange-1-favor", texto: () => "Local: Favor" },
  { id: "exchange-1-contra", texto: () => "Local: Contra" },
  { id: "exchange-x-favor", texto: () => "Empate: Favor" },
  { id: "exchange-x-contra", texto: () => "Empate: Contra" },
  { id: "exchange-2-favor", texto: () => "Visitante: Favor" },
  { id: "exchange-2-contra", texto: () => "Visitante: Contra" },
];

const OPCIONES_DOBLE_OPORTUNIDAD = [
  { id: "1x", texto: (eq) => `Doble oportunidad: ${eq.local} o empate` },
  { id: "x2", texto: (eq) => `Doble oportunidad: ${eq.visitante} o empate` },
  { id: "12", texto: (eq) => `Doble oportunidad: ${eq.local} o ${eq.visitante}` },
];

const OPCIONES_EMPATE_NO_VALIDO = [
  { id: "dnb-1", texto: (eq) => `Empate no válido: ${eq.local}` },
  { id: "dnb-2", texto: (eq) => `Empate no válido: ${eq.visitante}` },
];

function opcionesResultadoExacto() {
  const opciones = [];
  for (let local = 0; local <= 4; local++) {
    for (let visitante = 0; visitante <= 4; visitante++) {
      opciones.push({
        id: `exacto-${local}-${visitante}`,
        texto: () => `Resultado exacto: ${local}-${visitante}`,
      });
    }
  }
  return opciones;
}
const OPCIONES_MARCADOR_EXACTO = [
  ...opcionesResultadoExacto(),
  { id: "exacto-otro", texto: () => "Otro resultado" },
];

// "ht-x" vuelve a decir "Empate al descanso" (antes solo "Empate", pedido
// así para acortarlo): con el mismo texto que el "Empate" de Resultado
// Final, buscarMercadoPorTexto siempre encontraba el de Resultado Final
// primero (va antes en CATEGORIAS_MERCADO) — dos mercados distintos, con
// resultados que pueden no coincidir, se confundían al editar/clasificar.
const OPCIONES_DESCANSO = [
  { id: "ht-1", texto: (eq) => `${eq.local} gana al descanso` },
  { id: "ht-2", texto: (eq) => `${eq.visitante} gana al descanso` },
  { id: "ht-x", texto: () => "Empate al descanso" },
];

// Notación estándar de este mercado (descanso/final): no se sustituye por
// nombres de equipo, "Local/Visitante" es la forma habitual de escribirlo
// en un ticket, igual que "1X2" tampoco lleva nombres.
const OPCIONES_DESCANSO_FINAL = [
  { id: "1-1", texto: () => "Local/Local" },
  { id: "1-x", texto: () => "Local/Empate" },
  { id: "1-2", texto: () => "Local/Visitante" },
  { id: "x-1", texto: () => "Empate/Local" },
  { id: "x-x", texto: () => "Empate/Empate" },
  { id: "x-2", texto: () => "Empate/Visitante" },
  { id: "2-1", texto: () => "Visitante/Local" },
  { id: "2-x", texto: () => "Visitante/Empate" },
  { id: "2-2", texto: () => "Visitante/Visitante" },
];

function opcionesMargenVictoria(clave) {
  return [2, 3, 4, 5].map((n) => ({
    id: `margen-${clave}-${n}`,
    texto: (eq) => `${eq[clave]} gana por ${n}+ goles`,
  }));
}
const OPCIONES_MARGEN_VICTORIA = [
  ...opcionesMargenVictoria("local"),
  ...opcionesMargenVictoria("visitante"),
];

// ---------------------------------------------------------------------
// Jugador — a diferencia del resto del catálogo, el texto final no se
// puede generar solo con los equipos: hace falta también el jugador,
// elegido en el desplegable propio que abre SelectorMercado.jsx
// (alimentado por /api/jugadores, ver usePlantilla.js). Por eso "texto"
// acepta aquí un segundo argumento (el resto del catálogo lo ignora).
// "sufijo" se guarda aparte para poder reconocer, al editar una apuesta ya
// guardada, qué plantilla y qué jugador generaron un texto concreto (ver
// interpretarMercadoJugador).
// ---------------------------------------------------------------------

const PLANTILLAS_JUGADOR = [
  { id: "gol", sufijo: " anota un gol" },
  { id: "gol-2", sufijo: " anota 2+ goles" },
  { id: "asistencia", sufijo: " da una asistencia" },
  { id: "remates-puerta-0.5", sufijo: ": +0.5 remates a puerta" },
  { id: "remates-puerta-1.5", sufijo: ": +1.5 remates a puerta" },
  { id: "remates-puerta-2.5", sufijo: ": +2.5 remates a puerta" },
  { id: "remates-totales-0.5", sufijo: ": +0.5 remates totales" },
  { id: "remates-totales-1.5", sufijo: ": +1.5 remates totales" },
  { id: "remates-totales-2.5", sufijo: ": +2.5 remates totales" },
  { id: "falta-cometida", sufijo: " comete una falta" },
  { id: "falta-recibida", sufijo: " recibe una falta" },
  { id: "tarjeta", sufijo: " recibe tarjeta" },
];

function opcionesJugador(ids) {
  return PLANTILLAS_JUGADOR.filter((p) => ids.includes(p.id)).map((p) => ({
    id: p.id,
    texto: (eq, jugador) => `${jugador || "?"}${p.sufijo}`,
  }));
}
const OPCIONES_JUGADOR_TODAS = opcionesJugador(PLANTILLAS_JUGADOR.map((p) => p.id));
const OPCIONES_JUGADOR_GOLES = opcionesJugador(["gol", "gol-2"]);
const OPCIONES_JUGADOR_ASISTENCIAS = opcionesJugador(["asistencia"]);
const OPCIONES_JUGADOR_REMATES = opcionesJugador([
  "remates-puerta-0.5",
  "remates-puerta-1.5",
  "remates-puerta-2.5",
  "remates-totales-0.5",
  "remates-totales-1.5",
  "remates-totales-2.5",
]);
const OPCIONES_JUGADOR_FALTAS = opcionesJugador(["falta-cometida", "falta-recibida"]);
const OPCIONES_JUGADOR_TARJETAS = opcionesJugador(["tarjeta"]);

// Si el texto ya guardado de una selección termina en el sufijo de alguna
// plantilla de jugador, separa el nombre del jugador del resto —
// SelectorMercado.jsx lo usa para preseleccionar jugador + mercado al
// editar una apuesta ya creada con este tipo de mercado.
export function interpretarMercadoJugador(texto) {
  if (!texto) return null;
  for (const plantilla of PLANTILLAS_JUGADOR) {
    if (texto.endsWith(plantilla.sufijo)) {
      const jugador = texto.slice(0, texto.length - plantilla.sufijo.length);
      if (jugador) return { opcionId: plantilla.id, jugador };
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// Goles
// ---------------------------------------------------------------------

const OPCIONES_GOLES_OVER = LINEAS_GOLES.map((l) => ({
  id: `over-${l}`,
  texto: () => `Over ${l} goles`,
}));
const OPCIONES_GOLES_UNDER = LINEAS_GOLES.map((l) => ({
  id: `under-${l}`,
  texto: () => `Under ${l} goles`,
}));

const OPCIONES_AMBOS_MARCAN = [
  { id: "btts-si", texto: () => "Ambos equipos marcan: Sí" },
  { id: "btts-no", texto: () => "Ambos equipos marcan: No" },
  { id: "btts-1t-si", texto: () => "Ambos equipos marcan en la 1ª mitad: Sí" },
  { id: "btts-1t-no", texto: () => "Ambos equipos marcan en la 1ª mitad: No" },
  { id: "btts-2t-si", texto: () => "Ambos equipos marcan en la 2ª mitad: Sí" },
  { id: "btts-2t-no", texto: () => "Ambos equipos marcan en la 2ª mitad: No" },
];
const OPCIONES_AMBAS_MITADES_GOL = [
  { id: "gol-ambas-mitades-si", texto: () => "Gol en ambas mitades: Sí" },
  { id: "gol-ambas-mitades-no", texto: () => "Gol en ambas mitades: No" },
];

// Mismo mercado que el total pero acotado a una parte (líneas más cortas,
// tiene menos sentido un "over 6.5" en 45 minutos) — sin mencionar la
// mitad en el texto, un mercado sin ambigüedad porque no compite con
// "goles por equipo" por nombre de equipo.
function opcionesGolesMedioTiempo(prefijoId) {
  return [
    ...LINEAS_GOLES_MEDIO.map((l) => ({ id: `${prefijoId}-over-${l}`, texto: () => `Over ${l} goles` })),
    ...LINEAS_GOLES_MEDIO.map((l) => ({ id: `${prefijoId}-under-${l}`, texto: () => `Under ${l} goles` })),
  ];
}
const OPCIONES_GOLES_1T = opcionesGolesMedioTiempo("g1t");
const OPCIONES_GOLES_2T = opcionesGolesMedioTiempo("g2t");

function opcionesGolesEquipo(clave) {
  return [
    ...LINEAS_GOLES.map((l) => ({
      id: `goles-${clave}-mas-${l}`,
      texto: (eq) => `Goles ${eq[clave]}: +${l} goles`,
    })),
    ...LINEAS_GOLES.map((l) => ({
      id: `goles-${clave}-menos-${l}`,
      texto: (eq) => `Goles ${eq[clave]}: -${l} goles`,
    })),
  ];
}
const OPCIONES_GOLES_EQUIPO_LOCAL = opcionesGolesEquipo("local");
const OPCIONES_GOLES_EQUIPO_VISITANTE = opcionesGolesEquipo("visitante");

// Goles por equipo pero acotados a una mitad (separado de "goles por
// equipo", que es del partido completo) — a diferencia de
// opcionesGolesMedioTiempo (que no menciona la mitad en el texto), aquí sí
// hace falta decir "1ª mitad"/"2ª mitad": si no, un mismo texto como
// "Goles Real Madrid: Over 1.5" podría venir tanto del partido completo
// como de una mitad, y no habría forma de distinguirlos al editar.
function opcionesGolesEquipoMedioTiempo(clave, prefijoId, etiquetaMitad) {
  return [
    ...LINEAS_GOLES_MEDIO.map((l) => ({
      id: `goles-${clave}-${prefijoId}-over-${l}`,
      texto: (eq) => `Goles ${eq[clave]} ${etiquetaMitad}: Over ${l}`,
    })),
    ...LINEAS_GOLES_MEDIO.map((l) => ({
      id: `goles-${clave}-${prefijoId}-under-${l}`,
      texto: (eq) => `Goles ${eq[clave]} ${etiquetaMitad}: Under ${l}`,
    })),
  ];
}
const OPCIONES_GOLES_EQUIPO_MITAD_LOCAL = [
  ...opcionesGolesEquipoMedioTiempo("local", "1t", "1ª mitad"),
  ...opcionesGolesEquipoMedioTiempo("local", "2t", "2ª mitad"),
];
const OPCIONES_GOLES_EQUIPO_MITAD_VISITANTE = [
  ...opcionesGolesEquipoMedioTiempo("visitante", "1t", "1ª mitad"),
  ...opcionesGolesEquipoMedioTiempo("visitante", "2t", "2ª mitad"),
];

const OPCIONES_MITAD_MAS_GOLES = [
  { id: "mitad-1", texto: () => "Mitad con más goles: 1ª mitad" },
  { id: "mitad-2", texto: () => "Mitad con más goles: 2ª mitad" },
  { id: "mitad-igual", texto: () => "Mitad con más goles: Igualadas" },
];

// ---------------------------------------------------------------------
// Hándicap asiático
// ---------------------------------------------------------------------

function formatoLinea(v) {
  if (v === 0) return "0";
  return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
}

// De -5.5 a +5.5 en pasos de 0.5, con las líneas "partidas" (cuartos)
// intercaladas — p.ej. entre -5.5 y -5.0 va "-5.0, -5.5" (el hándicap se
// reparte mitad y mitad entre las dos líneas).
function opcionesHandicapEquipo(clave) {
  const magnitudes = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5];
  const opciones = [];

  for (let i = magnitudes.length - 1; i >= 1; i--) {
    const lejos = -magnitudes[i];
    const cerca = -magnitudes[i - 1];
    opciones.push({
      id: `hcap-${clave}-n${i}`,
      texto: (eq) => `${eq[clave]}: ${formatoLinea(lejos)}`,
    });
    opciones.push({
      id: `hcap-${clave}-n${i}s`,
      texto: (eq) => `${eq[clave]}: ${formatoLinea(cerca)}, ${formatoLinea(lejos)}`,
    });
  }

  opciones.push({ id: `hcap-${clave}-0`, texto: (eq) => `${eq[clave]}: 0` });

  for (let i = 1; i < magnitudes.length; i++) {
    const valor = magnitudes[i];
    opciones.push({
      id: `hcap-${clave}-p${i}`,
      texto: (eq) => `${eq[clave]}: ${formatoLinea(valor)}`,
    });
    if (i < magnitudes.length - 1) {
      const siguiente = magnitudes[i + 1];
      opciones.push({
        id: `hcap-${clave}-p${i}s`,
        texto: (eq) => `${eq[clave]}: ${formatoLinea(valor)}, ${formatoLinea(siguiente)}`,
      });
    }
  }

  return opciones;
}
const OPCIONES_HANDICAP_LOCAL = opcionesHandicapEquipo("local");
const OPCIONES_HANDICAP_VISITANTE = opcionesHandicapEquipo("visitante");

// ---------------------------------------------------------------------
// Córners
// ---------------------------------------------------------------------

const OPCIONES_CORNERS_OVER = LINEAS_CORNERS.map((l) => ({
  id: `corners-over-${l}`,
  texto: () => `Over ${l} córners`,
}));
const OPCIONES_CORNERS_UNDER = LINEAS_CORNERS.map((l) => ({
  id: `corners-under-${l}`,
  texto: () => `Under ${l} córners`,
}));

function opcionesCornersEquipo(clave) {
  return [
    ...LINEAS_CORNERS_EQUIPO.map((l) => ({
      id: `corners-${clave}-mas-${l}`,
      texto: (eq) => `Córners ${eq[clave]}: +${l} córners`,
    })),
    ...LINEAS_CORNERS_EQUIPO.map((l) => ({
      id: `corners-${clave}-menos-${l}`,
      texto: (eq) => `Córners ${eq[clave]}: -${l} córners`,
    })),
  ];
}
const OPCIONES_CORNERS_EQUIPO_LOCAL = opcionesCornersEquipo("local");
const OPCIONES_CORNERS_EQUIPO_VISITANTE = opcionesCornersEquipo("visitante");

function opcionesCornersEquipoMedioTiempo(clave, prefijoId, etiquetaMitad) {
  return [
    ...LINEAS_CORNERS_MEDIO.map((l) => ({
      id: `corners-${clave}-${prefijoId}-over-${l}`,
      texto: (eq) => `Córners ${eq[clave]} ${etiquetaMitad}: Over ${l}`,
    })),
    ...LINEAS_CORNERS_MEDIO.map((l) => ({
      id: `corners-${clave}-${prefijoId}-under-${l}`,
      texto: (eq) => `Córners ${eq[clave]} ${etiquetaMitad}: Under ${l}`,
    })),
  ];
}
const OPCIONES_CORNERS_EQUIPO_MITAD_LOCAL = [
  ...opcionesCornersEquipoMedioTiempo("local", "1t", "1ª mitad"),
  ...opcionesCornersEquipoMedioTiempo("local", "2t", "2ª mitad"),
];
const OPCIONES_CORNERS_EQUIPO_MITAD_VISITANTE = [
  ...opcionesCornersEquipoMedioTiempo("visitante", "1t", "1ª mitad"),
  ...opcionesCornersEquipoMedioTiempo("visitante", "2t", "2ª mitad"),
];

// ---------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------

const OPCIONES_TARJETAS_OVER = LINEAS_TARJETAS.map((l) => ({
  id: `tarjetas-over-${l}`,
  texto: () => `Over ${l} tarjetas`,
}));
const OPCIONES_TARJETAS_UNDER = LINEAS_TARJETAS.map((l) => ({
  id: `tarjetas-under-${l}`,
  texto: () => `Under ${l} tarjetas`,
}));

function opcionesTarjetasEquipo(clave) {
  return [
    ...LINEAS_TARJETAS.map((l) => ({
      id: `tarjetas-${clave}-mas-${l}`,
      texto: (eq) => `Tarjetas ${eq[clave]}: +${l} tarjetas`,
    })),
    ...LINEAS_TARJETAS.map((l) => ({
      id: `tarjetas-${clave}-menos-${l}`,
      texto: (eq) => `Tarjetas ${eq[clave]}: -${l} tarjetas`,
    })),
  ];
}
const OPCIONES_TARJETAS_EQUIPO_LOCAL = opcionesTarjetasEquipo("local");
const OPCIONES_TARJETAS_EQUIPO_VISITANTE = opcionesTarjetasEquipo("visitante");

const OPCIONES_PRIMERA_TARJETA = [
  { id: "primera-tarjeta-local", texto: (eq) => `Primera tarjeta: ${eq.local}` },
  { id: "primera-tarjeta-visitante", texto: (eq) => `Primera tarjeta: ${eq.visitante}` },
];
const OPCIONES_AMBOS_TARJETA = [
  { id: "ambos-tarjeta-si", texto: () => "Ambos equipos reciben tarjeta: Sí" },
  { id: "ambos-tarjeta-no", texto: () => "Ambos equipos reciben tarjeta: No" },
];

// ---------------------------------------------------------------------
// Equipo — mayor número, y Especiales
// ---------------------------------------------------------------------

function opcionesEquipoMasEstadistica(slug, etiqueta) {
  return [
    { id: `mas-${slug}-local`, texto: (eq) => `Equipo con más ${etiqueta}: ${eq.local}` },
    { id: `mas-${slug}-visitante`, texto: (eq) => `Equipo con más ${etiqueta}: ${eq.visitante}` },
    { id: `mas-${slug}-igualados`, texto: () => `Equipo con más ${etiqueta}: Igualados` },
  ];
}
const EQUIPO_MAS_SUBCATS = [
  { id: "corners", etiqueta: "Córners", opciones: opcionesEquipoMasEstadistica("corners", "córners") },
  { id: "tarjetas", etiqueta: "Tarjetas", opciones: opcionesEquipoMasEstadistica("tarjetas", "tarjetas") },
  { id: "remates", etiqueta: "Remates", opciones: opcionesEquipoMasEstadistica("remates", "remates") },
  {
    id: "remates-puerta",
    etiqueta: "Remates a puerta",
    opciones: opcionesEquipoMasEstadistica("remates-puerta", "remates a puerta"),
  },
];

function opcionesEspecialEquipo(slug, plantilla) {
  return [
    { id: `${slug}-local`, texto: (eq) => plantilla(eq.local) },
    { id: `${slug}-visitante`, texto: (eq) => plantilla(eq.visitante) },
  ];
}
const ESPECIALES_SUBCATS = [
  {
    id: "gana-una-mitad",
    etiqueta: "Gana una mitad",
    opciones: opcionesEspecialEquipo("gana-una-mitad", (equipo) => `${equipo} gana una mitad`),
  },
  {
    id: "gana-ambas-mitades",
    etiqueta: "Gana las dos mitades",
    opciones: opcionesEspecialEquipo("gana-ambas-mitades", (equipo) => `${equipo} gana las dos mitades`),
  },
  {
    id: "anota-una-mitad",
    etiqueta: "Anota en una mitad",
    opciones: opcionesEspecialEquipo("anota-una-mitad", (equipo) => `${equipo} anota en una mitad`),
  },
  {
    id: "anota-ambas-mitades",
    etiqueta: "Anota en las dos mitades",
    opciones: opcionesEspecialEquipo("anota-ambas-mitades", (equipo) => `${equipo} anota en las dos mitades`),
  },
  {
    id: "gana-a-cero",
    etiqueta: "Gana a cero",
    opciones: opcionesEspecialEquipo("gana-a-cero", (equipo) => `${equipo} gana a cero`),
  },
  {
    id: "gana-remontando",
    etiqueta: "Gana remontando",
    opciones: opcionesEspecialEquipo("gana-remontando", (equipo) => `${equipo} gana remontando`),
  },
];

// ---------------------------------------------------------------------
// Catálogo plano (18 categorías) — el de siempre, sin cambios de fondo:
// mismos ids, mismas opciones por categoría. Lo siguen usando
// buscarMercadoPorTexto/etiquetaCategoriaDeTexto y, por tanto, el
// desglose por mercado de Estadísticas (utils/estadisticas.js).
// "Otro mercado" no está aquí — es el botón fijo al final del desplegable
// (ver SelectorMercado.jsx), no una categoría del catálogo.
// ---------------------------------------------------------------------

export const CATEGORIAS_MERCADO = [
  {
    id: "resultado",
    etiqueta: "Resultado Final",
    opciones: [
      ...OPCIONES_1X2,
      ...OPCIONES_FAVOR_CONTRA,
      ...OPCIONES_DOBLE_OPORTUNIDAD,
      ...OPCIONES_EMPATE_NO_VALIDO,
    ],
  },
  { id: "resultado-exacto", etiqueta: "Resultado exacto", opciones: OPCIONES_MARCADOR_EXACTO },
  { id: "margen-victoria", etiqueta: "Margen de victoria", opciones: OPCIONES_MARGEN_VICTORIA },
  { id: "resultado-descanso", etiqueta: "Resultado al descanso", opciones: OPCIONES_DESCANSO },
  {
    id: "resultado-descanso-final",
    etiqueta: "Resultado descanso/final",
    opciones: OPCIONES_DESCANSO_FINAL,
  },
  {
    id: "jugador",
    etiqueta: "Jugador",
    // Marca especial para SelectorMercado.jsx: esta categoría necesita el
    // desplegable de jugador aparte, no solo la lista de opciones.
    requiereJugador: true,
    opciones: OPCIONES_JUGADOR_TODAS,
  },
  {
    id: "goles",
    etiqueta: "Goles",
    opciones: [
      ...OPCIONES_GOLES_OVER,
      ...OPCIONES_GOLES_UNDER,
      ...OPCIONES_AMBOS_MARCAN,
      ...OPCIONES_AMBAS_MITADES_GOL,
    ],
  },
  { id: "goles-1t", etiqueta: "Goles 1ª mitad", opciones: OPCIONES_GOLES_1T },
  { id: "goles-2t", etiqueta: "Goles 2ª mitad", opciones: OPCIONES_GOLES_2T },
  {
    id: "goles-equipo",
    etiqueta: "Goles por equipo",
    opciones: [...OPCIONES_GOLES_EQUIPO_LOCAL, ...OPCIONES_GOLES_EQUIPO_VISITANTE],
  },
  {
    id: "goles-equipo-mitad",
    etiqueta: "Goles por equipo por mitad",
    opciones: [...OPCIONES_GOLES_EQUIPO_MITAD_LOCAL, ...OPCIONES_GOLES_EQUIPO_MITAD_VISITANTE],
  },
  { id: "mitad-mas-goles", etiqueta: "Mitad con más goles", opciones: OPCIONES_MITAD_MAS_GOLES },
  {
    id: "handicap",
    etiqueta: "Hándicap asiático",
    opciones: [...OPCIONES_HANDICAP_LOCAL, ...OPCIONES_HANDICAP_VISITANTE],
  },
  { id: "corners", etiqueta: "Córners", opciones: [...OPCIONES_CORNERS_OVER, ...OPCIONES_CORNERS_UNDER] },
  {
    id: "corners-equipo",
    etiqueta: "Córners por equipo",
    opciones: [
      ...OPCIONES_CORNERS_EQUIPO_LOCAL,
      ...OPCIONES_CORNERS_EQUIPO_VISITANTE,
      ...OPCIONES_CORNERS_EQUIPO_MITAD_LOCAL,
      ...OPCIONES_CORNERS_EQUIPO_MITAD_VISITANTE,
    ],
  },
  {
    id: "tarjetas",
    etiqueta: "Tarjetas",
    opciones: [
      ...OPCIONES_TARJETAS_OVER,
      ...OPCIONES_TARJETAS_UNDER,
      ...OPCIONES_TARJETAS_EQUIPO_LOCAL,
      ...OPCIONES_TARJETAS_EQUIPO_VISITANTE,
      ...OPCIONES_PRIMERA_TARJETA,
      ...OPCIONES_AMBOS_TARJETA,
    ],
  },
  {
    id: "equipo-mas",
    etiqueta: "Equipo — mayor número",
    opciones: EQUIPO_MAS_SUBCATS.flatMap((s) => s.opciones),
  },
  { id: "especiales", etiqueta: "Especiales", opciones: ESPECIALES_SUBCATS.flatMap((s) => s.opciones) },
];

// Busca en el catálogo la categoría+opción cuyo texto generado (con los
// nombres de equipo ya resueltos) coincide exactamente con el texto ya
// guardado de una selección — para saber de qué categoría es un mercado a
// partir solo del texto que se guardó (ver SelectorMercado.jsx y
// calcularEstadisticasPorMercado en utils/estadisticas.js). Devuelve null
// si no coincide con nada del catálogo (mercado escrito a mano en "Otro
// mercado", o de antes de tener este desplegable).
export function buscarMercadoPorTexto(apuestaTexto, equipos) {
  if (!apuestaTexto) return null;
  for (const categoria of CATEGORIAS_MERCADO) {
    for (const opcion of categoria.opciones) {
      if (opcion.texto(equipos) === apuestaTexto) {
        return { categoriaId: categoria.id, opcionId: opcion.id };
      }
    }
  }
  return null;
}

// Etiqueta de categoría (ej. "Goles", "Resultado Final") para un texto de
// mercado ya guardado — el subtítulo gris bajo cada pick en el detalle de
// la apuesta (ApuestaItem.jsx). null si no coincide con nada del catálogo
// (mercado escrito a mano en "Otro mercado", o de antes de tener este
// desplegable) — en ese caso no se pinta ningún subtítulo.
export function etiquetaCategoriaDeTexto(apuestaTexto, equipos) {
  const encontrado = buscarMercadoPorTexto(apuestaTexto, equipos);
  if (!encontrado) return null;
  return CATEGORIAS_MERCADO.find((c) => c.id === encontrado.categoriaId)?.etiqueta ?? null;
}

// ---------------------------------------------------------------------
// Árbol de navegación (9 categorías principales) — petición directa, a
// partir de una maqueta HTML de referencia (real-demo-v3.html) construida
// con los 433 mercados reales de este mismo catálogo. Reutiliza las
// mismas listas de opciones de arriba (mismos ids, mismas funciones
// texto) — nunca las vuelve a generar, solo las reagrupa en categoría →
// subcategoría → (si aplica) Local/Visitante. Cada nodo de subcategoría
// lleva "opciones" (hoja) o "subcategorias" (un nivel más, nunca los dos.
// ---------------------------------------------------------------------

export const ARBOL_MERCADOS = [
  {
    id: "resultado",
    etiqueta: "Resultado",
    subcategorias: [
      { id: "1x2", etiqueta: "1X2", opciones: OPCIONES_1X2 },
      { id: "favor-contra", etiqueta: "Favor / Contra", opciones: OPCIONES_FAVOR_CONTRA },
      { id: "doble-oportunidad", etiqueta: "Doble oportunidad", opciones: OPCIONES_DOBLE_OPORTUNIDAD },
      { id: "empate-no-valido", etiqueta: "Empate no válido", opciones: OPCIONES_EMPATE_NO_VALIDO },
      { id: "marcador-exacto", etiqueta: "Marcador exacto", opciones: OPCIONES_MARCADOR_EXACTO },
      { id: "descanso", etiqueta: "Descanso", opciones: OPCIONES_DESCANSO },
      { id: "descanso-final", etiqueta: "Descanso / Final", opciones: OPCIONES_DESCANSO_FINAL },
      { id: "margen-victoria", etiqueta: "Margen de victoria", opciones: OPCIONES_MARGEN_VICTORIA },
    ],
  },
  {
    id: "jugador",
    etiqueta: "Jugador",
    requiereJugador: true,
    subcategorias: [
      { id: "goles", etiqueta: "Goles", opciones: OPCIONES_JUGADOR_GOLES },
      { id: "asistencias", etiqueta: "Asistencias", opciones: OPCIONES_JUGADOR_ASISTENCIAS },
      { id: "remates", etiqueta: "Remates", opciones: OPCIONES_JUGADOR_REMATES },
      { id: "faltas", etiqueta: "Faltas", opciones: OPCIONES_JUGADOR_FALTAS },
      { id: "tarjetas", etiqueta: "Tarjetas", opciones: OPCIONES_JUGADOR_TARJETAS },
    ],
  },
  {
    id: "goles",
    etiqueta: "Goles",
    subcategorias: [
      { id: "over", etiqueta: "Over", opciones: OPCIONES_GOLES_OVER },
      { id: "under", etiqueta: "Under", opciones: OPCIONES_GOLES_UNDER },
      { id: "ambos-marcan", etiqueta: "Ambos marcan", opciones: OPCIONES_AMBOS_MARCAN },
      { id: "ambas-mitades", etiqueta: "Ambas mitades", opciones: OPCIONES_AMBAS_MITADES_GOL },
      { id: "1t", etiqueta: "1ª mitad", opciones: OPCIONES_GOLES_1T },
      { id: "2t", etiqueta: "2ª mitad", opciones: OPCIONES_GOLES_2T },
      {
        id: "por-equipo",
        etiqueta: "Por equipo",
        subcategorias: [
          { id: "local", etiqueta: "Local", opciones: OPCIONES_GOLES_EQUIPO_LOCAL },
          { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_GOLES_EQUIPO_VISITANTE },
        ],
      },
      {
        id: "por-equipo-mitades",
        etiqueta: "Por equipo y mitades",
        subcategorias: [
          { id: "local", etiqueta: "Local", opciones: OPCIONES_GOLES_EQUIPO_MITAD_LOCAL },
          { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_GOLES_EQUIPO_MITAD_VISITANTE },
        ],
      },
      { id: "mitad-mas-goles", etiqueta: "Mitad con más goles", opciones: OPCIONES_MITAD_MAS_GOLES },
    ],
  },
  {
    id: "handicap",
    etiqueta: "Hándicap Asiático",
    subcategorias: [
      { id: "local", etiqueta: "Local", opciones: OPCIONES_HANDICAP_LOCAL },
      { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_HANDICAP_VISITANTE },
    ],
  },
  {
    id: "corners",
    etiqueta: "Córners",
    subcategorias: [
      { id: "over", etiqueta: "Over", opciones: OPCIONES_CORNERS_OVER },
      { id: "under", etiqueta: "Under", opciones: OPCIONES_CORNERS_UNDER },
      {
        id: "por-equipo",
        etiqueta: "Por equipo",
        subcategorias: [
          { id: "local", etiqueta: "Local", opciones: OPCIONES_CORNERS_EQUIPO_LOCAL },
          { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_CORNERS_EQUIPO_VISITANTE },
        ],
      },
      {
        id: "por-equipo-mitad",
        etiqueta: "Por equipo y mitad",
        subcategorias: [
          { id: "local", etiqueta: "Local", opciones: OPCIONES_CORNERS_EQUIPO_MITAD_LOCAL },
          { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_CORNERS_EQUIPO_MITAD_VISITANTE },
        ],
      },
    ],
  },
  {
    id: "tarjetas",
    etiqueta: "Tarjetas",
    subcategorias: [
      { id: "over", etiqueta: "Over", opciones: OPCIONES_TARJETAS_OVER },
      { id: "under", etiqueta: "Under", opciones: OPCIONES_TARJETAS_UNDER },
      {
        id: "por-equipo",
        etiqueta: "Por equipo",
        subcategorias: [
          { id: "local", etiqueta: "Local", opciones: OPCIONES_TARJETAS_EQUIPO_LOCAL },
          { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_TARJETAS_EQUIPO_VISITANTE },
        ],
      },
      { id: "primera-tarjeta", etiqueta: "Primera tarjeta", opciones: OPCIONES_PRIMERA_TARJETA },
      { id: "ambos-tarjeta", etiqueta: "Ambos reciben tarjeta", opciones: OPCIONES_AMBOS_TARJETA },
    ],
  },
  {
    id: "equipo-mas",
    etiqueta: "Equipo — Mayor número",
    subcategorias: EQUIPO_MAS_SUBCATS,
  },
  {
    id: "especiales",
    etiqueta: "Especiales",
    subcategorias: ESPECIALES_SUBCATS,
  },
];

// Ruta (categoría → subcategoría → Local/Visitante si aplica) de una
// opción por su id, buscando en ARBOL_MERCADOS — la usa SelectorMercado.jsx
// para abrir en las pestañas correctas al editar una selección ya
// guardada (buscarMercadoPorTexto, sin cambios, ya dice qué opción es;
// esto solo dice DÓNDE vive esa opción en el árbol nuevo). Los ids del
// catálogo son únicos en todo el árbol, así que basta con el id de la
// opción, sin necesitar también la categoría plana.
export function rutaEnArbol(opcionId) {
  for (const categoria of ARBOL_MERCADOS) {
    for (const sub of categoria.subcategorias) {
      if (sub.opciones) {
        if (sub.opciones.some((o) => o.id === opcionId)) {
          return { categoriaId: categoria.id, subcategoriaId: sub.id, nivel3Id: null };
        }
      } else {
        for (const nivel3 of sub.subcategorias) {
          if (nivel3.opciones.some((o) => o.id === opcionId)) {
            return { categoriaId: categoria.id, subcategoriaId: sub.id, nivel3Id: nivel3.id };
          }
        }
      }
    }
  }
  return null;
}
