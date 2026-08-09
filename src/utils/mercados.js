// Catálogo del desplegable de "Apuesta" (ver SelectorMercado.jsx). Cada
// opción es una función texto({ local, visitante }) que ya genera el texto
// final completo — a diferencia de la primera versión, aquí no hace falta
// escribir ninguna línea aparte: cada entrada del desplegable es ya un
// mercado concreto (p.ej. "Over 2.5 goles"). Elegir "Otro mercado" en el
// desplegable es lo único que abre un campo de texto libre.

// El buscador de partidos rellena "Evento" como "Equipo local - Equipo
// visitante" (ver BuscadorEvento.jsx); si no tiene ese formato exacto
// (escrito a mano, u otro deporte), se usan nombres genéricos.
export function equiposDesdeEvento(evento) {
  const partes = (evento ?? "").split(" - ");
  return partes.length === 2 && partes[0].trim() && partes[1].trim()
    ? { local: partes[0].trim(), visitante: partes[1].trim() }
    : { local: "Equipo Local", visitante: "Equipo Visitante" };
}

const LINEAS_GOLES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
const LINEAS_GOLES_MEDIO = [0.5, 1.5, 2.5, 3.5];
// Interpretación de "córners" del pedido (el mensaje original venía
// incompleto/repetido en esta parte): líneas de 6.5 a 14.5, mismo patrón
// que goles — fácil de ajustar el rango si no era justo esto.
const LINEAS_CORNERS = [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5];
// Interpretación de "por mitad" para córners de un equipo (el pedido no
// daba un rango): la mitad de líneas del total ya existente, sin llegar a
// las líneas altas (14.5 córners de un equipo en 45 minutos no tiene
// sentido) — fácil de ajustar si no es justo esto.
const LINEAS_CORNERS_MEDIO = [1.5, 2.5, 3.5, 4.5, 5.5];
// Tarjetas: mismo patrón que goles (Over/Under), líneas 0.5 a 6.5.
const LINEAS_TARJETAS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];

function opcionesGolesTotal() {
  return [
    ...LINEAS_GOLES.map((l) => ({ id: `over-${l}`, texto: () => `Over ${l} goles` })),
    ...LINEAS_GOLES.map((l) => ({ id: `under-${l}`, texto: () => `Under ${l} goles` })),
  ];
}

// Mismo mercado que opcionesGolesTotal pero acotado a una parte (líneas
// más cortas, tiene menos sentido un "over 6.5" en 45 minutos).
function opcionesGolesMedioTiempo(prefijoId) {
  return [
    ...LINEAS_GOLES_MEDIO.map((l) => ({ id: `${prefijoId}-over-${l}`, texto: () => `Over ${l} goles` })),
    ...LINEAS_GOLES_MEDIO.map((l) => ({ id: `${prefijoId}-under-${l}`, texto: () => `Under ${l} goles` })),
  ];
}

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

function opcionesCorners() {
  return [
    ...LINEAS_CORNERS.map((l) => ({ id: `corners-over-${l}`, texto: () => `Over ${l} córners` })),
    ...LINEAS_CORNERS.map((l) => ({ id: `corners-under-${l}`, texto: () => `Under ${l} córners` })),
  ];
}

// Mismo patrón que opcionesGolesEquipo: reutiliza las líneas del total
// (LINEAS_CORNERS), no un rango propio más corto.
function opcionesCornersEquipo(clave) {
  return [
    ...LINEAS_CORNERS.map((l) => ({
      id: `corners-${clave}-mas-${l}`,
      texto: (eq) => `Córners ${eq[clave]}: +${l} córners`,
    })),
    ...LINEAS_CORNERS.map((l) => ({
      id: `corners-${clave}-menos-${l}`,
      texto: (eq) => `Córners ${eq[clave]}: -${l} córners`,
    })),
  ];
}

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

function opcionesTarjetasTotal() {
  return [
    ...LINEAS_TARJETAS.map((l) => ({ id: `tarjetas-over-${l}`, texto: () => `Over ${l} tarjetas` })),
    ...LINEAS_TARJETAS.map((l) => ({ id: `tarjetas-under-${l}`, texto: () => `Under ${l} tarjetas` })),
  ];
}

// Mismo patrón que opcionesGolesEquipo: reutiliza las líneas del total
// (LINEAS_TARJETAS), no un rango propio más corto.
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

// Goles por equipo pero acotados a una mitad (separado de "goles-equipo",
// que es del partido completo) — a diferencia de opcionesGolesMedioTiempo
// (que no menciona la mitad en el texto, un mercado sin ambigüedad porque
// no compite con "goles-equipo" por nombre de equipo), aquí sí hace falta
// decir "1ª mitad"/"2ª mitad" en el texto: si no, un mismo texto como
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

function opcionesEquipoMasEstadistica(slug, etiqueta) {
  return [
    { id: `mas-${slug}-local`, texto: (eq) => `Equipo con más ${etiqueta}: ${eq.local}` },
    { id: `mas-${slug}-visitante`, texto: (eq) => `Equipo con más ${etiqueta}: ${eq.visitante}` },
    { id: `mas-${slug}-igualados`, texto: () => `Equipo con más ${etiqueta}: Igualados` },
  ];
}

function opcionesMargenVictoria(clave) {
  return [2, 3, 4, 5].map((n) => ({
    id: `margen-${clave}-${n}`,
    texto: (eq) => `${eq[clave]} gana por ${n}+ goles`,
  }));
}

function opcionesEspecialEquipo(slug, plantilla) {
  return [
    { id: `${slug}-local`, texto: (eq) => plantilla(eq.local) },
    { id: `${slug}-visitante`, texto: (eq) => plantilla(eq.visitante) },
  ];
}

// Mercados de jugador: a diferencia del resto del catálogo, el texto final
// no se puede generar solo con los equipos — hace falta también el
// jugador elegido en el desplegable propio que abre SelectorMercado.jsx
// (alimentado por /api/jugadores, ver usePlantilla.js). Por eso "texto"
// acepta aquí un segundo argumento (el resto del catálogo lo ignora).
// "sufijo" se guarda aparte para poder reconocer, al editar una apuesta ya
// guardada, qué plantilla y qué jugador generaron un texto concreto (ver
// interpretarMercadoJugador).
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

function formatoLinea(v) {
  if (v === 0) return "0";
  return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
}

// Hándicap asiático de un equipo: de -5.5 a +5.5 en pasos de 0.5, con las
// líneas "partidas" (cuartos) intercaladas — p.ej. entre -5.5 y -5.0 va
// "-5.0, -5.5" (el hándicap se reparte mitad y mitad entre las dos líneas).
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

// Orden pedido directamente por el usuario (2026-08-10): de lo más
// general (resultado) a lo más específico (especiales), con "Jugador"
// justo después de los mercados de resultado y antes de los de goles.
// "Otro mercado" no está aquí — es el botón fijo al final del desplegable
// (ver SelectorMercado.jsx), no una categoría del catálogo.
export const CATEGORIAS_MERCADO = [
  {
    id: "resultado",
    etiqueta: "Resultado Final",
    opciones: [
      { id: "1", texto: (eq) => `Gana ${eq.local}` },
      { id: "x", texto: () => "Empate" },
      { id: "2", texto: (eq) => `Gana ${eq.visitante}` },
      // Betfair Exchange: se puede apostar a favor (back) o en contra
      // (lay) de cada resultado, no solo elegir un ganador. Sin nombre de
      // equipo aquí (Local/Empate/Visitante), pedido así explícitamente.
      { id: "exchange-1-favor", texto: () => "Local: Favor" },
      { id: "exchange-1-contra", texto: () => "Local: Contra" },
      { id: "exchange-x-favor", texto: () => "Empate: Favor" },
      { id: "exchange-x-contra", texto: () => "Empate: Contra" },
      { id: "exchange-2-favor", texto: () => "Visitante: Favor" },
      { id: "exchange-2-contra", texto: () => "Visitante: Contra" },
      { id: "1x", texto: (eq) => `Doble oportunidad: ${eq.local} o empate` },
      { id: "x2", texto: (eq) => `Doble oportunidad: ${eq.visitante} o empate` },
      { id: "12", texto: (eq) => `Doble oportunidad: ${eq.local} o ${eq.visitante}` },
      { id: "dnb-1", texto: (eq) => `Empate no válido: ${eq.local}` },
      { id: "dnb-2", texto: (eq) => `Empate no válido: ${eq.visitante}` },
    ],
  },
  {
    id: "resultado-exacto",
    etiqueta: "Resultado exacto",
    opciones: [...opcionesResultadoExacto(), { id: "exacto-otro", texto: () => "Otro resultado" }],
  },
  {
    id: "margen-victoria",
    etiqueta: "Margen de victoria",
    opciones: [...opcionesMargenVictoria("local"), ...opcionesMargenVictoria("visitante")],
  },
  {
    id: "resultado-descanso",
    etiqueta: "Resultado al descanso",
    opciones: [
      { id: "ht-1", texto: (eq) => `${eq.local} gana al descanso` },
      { id: "ht-2", texto: (eq) => `${eq.visitante} gana al descanso` },
      { id: "ht-x", texto: () => "Empate" },
    ],
  },
  {
    // Notación estándar de este mercado (descanso/final): no se sustituye
    // por nombres de equipo, "Local/Visitante" es la forma habitual de
    // escribirlo en un ticket, igual que "1X2" tampoco lleva nombres.
    id: "resultado-descanso-final",
    etiqueta: "Resultado descanso/final",
    opciones: [
      { id: "1-1", texto: () => "Local/Local" },
      { id: "1-x", texto: () => "Local/Empate" },
      { id: "1-2", texto: () => "Local/Visitante" },
      { id: "x-1", texto: () => "Empate/Local" },
      { id: "x-x", texto: () => "Empate/Empate" },
      { id: "x-2", texto: () => "Empate/Visitante" },
      { id: "2-1", texto: () => "Visitante/Local" },
      { id: "2-x", texto: () => "Visitante/Empate" },
      { id: "2-2", texto: () => "Visitante/Visitante" },
    ],
  },
  {
    id: "jugador",
    etiqueta: "Jugador",
    // Marca especial para SelectorMercado.jsx: esta categoría necesita el
    // desplegable de jugador aparte, no solo la lista de opciones.
    requiereJugador: true,
    opciones: PLANTILLAS_JUGADOR.map((p) => ({
      id: p.id,
      texto: (eq, jugador) => `${jugador || "?"}${p.sufijo}`,
    })),
  },
  {
    id: "goles",
    etiqueta: "Goles",
    opciones: [
      ...opcionesGolesTotal(),
      { id: "btts-si", texto: () => "Ambos equipos marcan: Sí" },
      { id: "btts-no", texto: () => "Ambos equipos marcan: No" },
      { id: "btts-1t-si", texto: () => "Ambos equipos marcan en la 1ª mitad: Sí" },
      { id: "btts-1t-no", texto: () => "Ambos equipos marcan en la 1ª mitad: No" },
      { id: "btts-2t-si", texto: () => "Ambos equipos marcan en la 2ª mitad: Sí" },
      { id: "btts-2t-no", texto: () => "Ambos equipos marcan en la 2ª mitad: No" },
      { id: "gol-ambas-mitades-si", texto: () => "Gol en ambas mitades: Sí" },
      { id: "gol-ambas-mitades-no", texto: () => "Gol en ambas mitades: No" },
    ],
  },
  {
    id: "goles-1t",
    etiqueta: "Goles 1ª mitad",
    opciones: opcionesGolesMedioTiempo("g1t"),
  },
  {
    id: "goles-2t",
    etiqueta: "Goles 2ª mitad",
    opciones: opcionesGolesMedioTiempo("g2t"),
  },
  {
    id: "goles-equipo",
    etiqueta: "Goles por equipo",
    opciones: [...opcionesGolesEquipo("local"), ...opcionesGolesEquipo("visitante")],
  },
  {
    id: "goles-equipo-mitad",
    etiqueta: "Goles por equipo por mitad",
    opciones: [
      ...opcionesGolesEquipoMedioTiempo("local", "1t", "1ª mitad"),
      ...opcionesGolesEquipoMedioTiempo("visitante", "1t", "1ª mitad"),
      ...opcionesGolesEquipoMedioTiempo("local", "2t", "2ª mitad"),
      ...opcionesGolesEquipoMedioTiempo("visitante", "2t", "2ª mitad"),
    ],
  },
  {
    id: "mitad-mas-goles",
    etiqueta: "Mitad con más goles",
    opciones: [
      { id: "mitad-1", texto: () => "Mitad con más goles: 1ª mitad" },
      { id: "mitad-2", texto: () => "Mitad con más goles: 2ª mitad" },
      { id: "mitad-igual", texto: () => "Mitad con más goles: Igualadas" },
    ],
  },
  {
    id: "handicap",
    etiqueta: "Hándicap asiático",
    opciones: [...opcionesHandicapEquipo("local"), ...opcionesHandicapEquipo("visitante")],
  },
  {
    id: "corners",
    etiqueta: "Córners",
    opciones: opcionesCorners(),
  },
  {
    id: "corners-equipo",
    etiqueta: "Córners por equipo",
    opciones: [
      ...opcionesCornersEquipo("local"),
      ...opcionesCornersEquipo("visitante"),
      ...opcionesCornersEquipoMedioTiempo("local", "1t", "1ª mitad"),
      ...opcionesCornersEquipoMedioTiempo("visitante", "1t", "1ª mitad"),
      ...opcionesCornersEquipoMedioTiempo("local", "2t", "2ª mitad"),
      ...opcionesCornersEquipoMedioTiempo("visitante", "2t", "2ª mitad"),
    ],
  },
  {
    id: "tarjetas",
    etiqueta: "Tarjetas",
    opciones: [
      ...opcionesTarjetasTotal(),
      ...opcionesTarjetasEquipo("local"),
      ...opcionesTarjetasEquipo("visitante"),
      { id: "primera-tarjeta-local", texto: (eq) => `Primera tarjeta: ${eq.local}` },
      { id: "primera-tarjeta-visitante", texto: (eq) => `Primera tarjeta: ${eq.visitante}` },
      { id: "ambos-tarjeta-si", texto: () => "Ambos equipos reciben tarjeta: Sí" },
      { id: "ambos-tarjeta-no", texto: () => "Ambos equipos reciben tarjeta: No" },
    ],
  },
  {
    id: "equipo-mas",
    etiqueta: "Equipo — mayor número",
    opciones: [
      ...opcionesEquipoMasEstadistica("corners", "córners"),
      ...opcionesEquipoMasEstadistica("tarjetas", "tarjetas"),
      ...opcionesEquipoMasEstadistica("remates", "remates"),
      ...opcionesEquipoMasEstadistica("remates-puerta", "remates a puerta"),
    ],
  },
  {
    id: "especiales",
    etiqueta: "Especiales",
    opciones: [
      ...opcionesEspecialEquipo("gana-una-mitad", (equipo) => `${equipo} gana una mitad`),
      ...opcionesEspecialEquipo("gana-ambas-mitades", (equipo) => `${equipo} gana las dos mitades`),
      ...opcionesEspecialEquipo("anota-una-mitad", (equipo) => `${equipo} anota en una mitad`),
      ...opcionesEspecialEquipo("anota-ambas-mitades", (equipo) => `${equipo} anota en las dos mitades`),
      ...opcionesEspecialEquipo("gana-a-cero", (equipo) => `${equipo} gana a cero`),
      ...opcionesEspecialEquipo("gana-remontando", (equipo) => `${equipo} gana remontando`),
    ],
  },
];
