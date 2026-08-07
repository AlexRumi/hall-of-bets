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
    : { local: "el equipo local", visitante: "el equipo visitante" };
}

const LINEAS_GOLES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
const LINEAS_GOLES_MEDIO = [0.5, 1.5, 2.5, 3.5];
// Interpretación de "córners" del pedido (el mensaje original venía
// incompleto/repetido en esta parte): líneas de 6.5 a 14.5, mismo patrón
// que goles — fácil de ajustar el rango si no era justo esto.
const LINEAS_CORNERS = [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5];

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

export const CATEGORIAS_MERCADO = [
  {
    id: "resultado",
    etiqueta: "Resultado",
    opciones: [
      { id: "1", texto: (eq) => `Gana ${eq.local}` },
      { id: "x", texto: () => "Empate" },
      { id: "2", texto: (eq) => `Gana ${eq.visitante}` },
      { id: "1x", texto: (eq) => `Doble oportunidad: ${eq.local} o empate` },
      { id: "x2", texto: (eq) => `Doble oportunidad: ${eq.visitante} o empate` },
      { id: "12", texto: (eq) => `Doble oportunidad: ${eq.local} o ${eq.visitante}` },
      { id: "dnb-1", texto: (eq) => `Empate no válido: ${eq.local}` },
      { id: "dnb-2", texto: (eq) => `Empate no válido: ${eq.visitante}` },
    ],
  },
  {
    id: "resultado-descanso",
    etiqueta: "Resultado al descanso",
    opciones: [
      { id: "ht-1", texto: (eq) => `${eq.local} gana al descanso` },
      { id: "ht-2", texto: (eq) => `${eq.visitante} gana al descanso` },
      { id: "ht-x", texto: () => "Empate al descanso" },
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
    id: "handicap",
    etiqueta: "Hándicap asiático",
    opciones: [...opcionesHandicapEquipo("local"), ...opcionesHandicapEquipo("visitante")],
  },
  {
    id: "corners",
    etiqueta: "Córners",
    opciones: opcionesCorners(),
  },
];
