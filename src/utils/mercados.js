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

// Genera líneas desde/hasta (ambos incluidos) saltando de "paso" en paso —
// para rangos más largos que ya no compensa escribir a mano como el resto
// de LINEAS_* de arriba (usado por "Remates"/"Remates a puerta" del
// equipo, más abajo).
function lineasDesde(desde, hasta, paso) {
  const lineas = [];
  for (let v = desde; v <= hasta + 0.001; v += paso) {
    lineas.push(Math.round(v * 10) / 10);
  }
  return lineas;
}

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
// Clasificación — eliminatorias a doble partido o a partido único con
// prórroga/penaltis (Champions, Copa del Rey...): quién pasa a la
// siguiente ronda, y por qué vía.
// ---------------------------------------------------------------------

const OPCIONES_EQUIPO_CLASIFICA = [
  { id: "clasifica-local", texto: (eq) => `${eq.local} clasificará` },
  { id: "clasifica-visitante", texto: (eq) => `${eq.visitante} clasificará` },
];

function opcionesMetodoClasificacion(clave) {
  return [
    { id: `metodo-${clave}-90`, texto: (eq) => `${eq[clave]} clasificará en 90 minutos` },
    { id: `metodo-${clave}-prorroga`, texto: (eq) => `${eq[clave]} clasificará en la prórroga` },
    { id: `metodo-${clave}-penaltis`, texto: (eq) => `${eq[clave]} clasificará en los penaltis` },
  ];
}
const OPCIONES_METODO_CLASIFICACION_LOCAL = opcionesMetodoClasificacion("local");
const OPCIONES_METODO_CLASIFICACION_VISITANTE = opcionesMetodoClasificacion("visitante");

const OPCIONES_GANADOR_TROFEO = [
  { id: "trofeo-local", texto: (eq) => `${eq.local} gana el trofeo` },
  { id: "trofeo-visitante", texto: (eq) => `${eq.visitante} gana el trofeo` },
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

// Líneas de jugador (remates/faltas/entradas): siempre de 0.5 en 0.5,
// ampliadas a 4.5 (petición directa — remates llegaba solo a 2.5, faltas/
// entradas ni siquiera tenían línea, eran un único mercado "comete una
// falta").
const LINEAS_JUGADOR = lineasDesde(0.5, 4.5, 1);

// Añade una plantilla por cada línea de LINEAS_JUGADOR, con el id
// "prefijoId-línea" (p.ej. "falta-cometida-1.5") y el sufijo que genere
// "generarSufijo(linea)" — para no repetir la lista a mano en Faltas/
// Entradas/Remates, que comparten exactamente este patrón.
function plantillasLinea(prefijoId, generarSufijo) {
  return LINEAS_JUGADOR.map((l) => ({ id: `${prefijoId}-${l}`, sufijo: generarSufijo(l) }));
}

const PLANTILLAS_JUGADOR = [
  { id: "gol", sufijo: " anota un gol" },
  { id: "gol-2", sufijo: " anota 2+ goles" },
  { id: "asistencia", sufijo: " asistirá" },
  { id: "anota-o-asiste", sufijo: " anota o asiste" },
  ...plantillasLinea("remates-puerta", (l) => `: +${l} remates a puerta`),
  // Dos mercados nuevos (petición directa), separados del genérico
  // "Remates a puerta" de arriba — mismo patrón, otro prefijoId y otro
  // sufijo, así que no compiten entre ellos en interpretarMercadoJugador
  // (busca por sufijo exacto, y ninguno de los tres es sufijo de otro).
  ...plantillasLinea("remates-puerta-cabeza", (l) => `: +${l} remates a puerta de cabeza`),
  ...plantillasLinea("remates-puerta-fuera-area", (l) => `: +${l} remates a puerta fuera del área`),
  ...plantillasLinea("remates-totales", (l) => `: +${l} remates totales`),
  ...plantillasLinea("falta-cometida", (l) => ` comete +${l} faltas`),
  ...plantillasLinea("falta-recibida", (l) => ` recibe +${l} faltas`),
  ...plantillasLinea("entrada", (l) => ` comete +${l} entradas`),
  { id: "tarjeta", sufijo: " será amonestado" },
  // Paradas del portero: sin línea "under" a propósito (pedido así:
  // "1+, 2+, 3+..."), números enteros del 1 al 7.
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: `paradas-${n}`, sufijo: `: ${n}+ paradas` })),
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
const OPCIONES_JUGADOR_ANOTA_O_ASISTE = opcionesJugador(["anota-o-asiste"]);
// "Remates" y "Remates a puerta" del jugador, separados (petición
// directa: antes eran una única categoría "Remates" con las dos cosas
// mezcladas).
const OPCIONES_JUGADOR_REMATES = opcionesJugador(LINEAS_JUGADOR.map((l) => `remates-totales-${l}`));
const OPCIONES_JUGADOR_REMATES_PUERTA = opcionesJugador(LINEAS_JUGADOR.map((l) => `remates-puerta-${l}`));
const OPCIONES_JUGADOR_REMATES_PUERTA_CABEZA = opcionesJugador(
  LINEAS_JUGADOR.map((l) => `remates-puerta-cabeza-${l}`)
);
const OPCIONES_JUGADOR_REMATES_PUERTA_FUERA_AREA = opcionesJugador(
  LINEAS_JUGADOR.map((l) => `remates-puerta-fuera-area-${l}`)
);
// "Faltas" se divide en Comete/Recibe (petición directa, subcategoría
// nueva) — ver ARBOL_MERCADOS más abajo.
const OPCIONES_JUGADOR_FALTAS_COMETE = opcionesJugador(LINEAS_JUGADOR.map((l) => `falta-cometida-${l}`));
const OPCIONES_JUGADOR_FALTAS_RECIBE = opcionesJugador(LINEAS_JUGADOR.map((l) => `falta-recibida-${l}`));
const OPCIONES_JUGADOR_ENTRADAS = opcionesJugador(LINEAS_JUGADOR.map((l) => `entrada-${l}`));
const OPCIONES_JUGADOR_TARJETAS = opcionesJugador(["tarjeta"]);
const OPCIONES_JUGADOR_PARADAS = opcionesJugador([1, 2, 3, 4, 5, 6, 7].map((n) => `paradas-${n}`));

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

// "Portería a cero" (petición directa): a diferencia de "Gana a cero"
// (más abajo, en Especiales — exige además ganar el partido), aquí solo
// importa si el equipo encaja o no algún gol, Sí/No por separado para
// cada equipo — ids propios, no se reutilizan los de "Gana a cero". Un
// solo ":" en el texto.
function opcionesPorteriaCero(clave) {
  return [
    { id: `porteria-cero-${clave}-si`, texto: (eq) => `${eq[clave]} - Portería a cero: Sí` },
    { id: `porteria-cero-${clave}-no`, texto: (eq) => `${eq[clave]} - Portería a cero: No` },
  ];
}
const OPCIONES_PORTERIA_CERO_LOCAL = opcionesPorteriaCero("local");
const OPCIONES_PORTERIA_CERO_VISITANTE = opcionesPorteriaCero("visitante");

// Mismo mercado que el total pero acotado a una parte (líneas más cortas,
// tiene menos sentido un "over 6.5" en 45 minutos). Bug real: al no
// mencionar la mitad en el texto, "Over 0.5 goles" de la 1ª mitad se veía
// (y se guardaba) exactamente igual que el "Over 0.5 goles" del partido
// completo — buscarMercadoPorTexto (más abajo) recorre las categorías en
// orden y "Goles" va antes que "Goles 1ª/2ª mitad", así que una selección
// de mitad se etiquetaba siempre como del partido completo. Se prefija
// con la mitad y se usa "+/-" en vez de "Over/Under" (mismo estilo que ya
// usa opcionesGolesEquipo para el mismo motivo: no competir por texto con
// otro mercado de la misma categoría).
function opcionesGolesMedioTiempo(prefijoId, etiquetaMitad) {
  return [
    ...LINEAS_GOLES_MEDIO.map((l) => ({
      id: `${prefijoId}-over-${l}`,
      texto: () => `${etiquetaMitad}: +${l} goles`,
    })),
    ...LINEAS_GOLES_MEDIO.map((l) => ({
      id: `${prefijoId}-under-${l}`,
      texto: () => `${etiquetaMitad}: -${l} goles`,
    })),
  ];
}
const OPCIONES_GOLES_1T = opcionesGolesMedioTiempo("g1t", "1ª mitad");
const OPCIONES_GOLES_2T = opcionesGolesMedioTiempo("g2t", "2ª mitad");

function opcionesGolesEquipo(clave) {
  return [
    ...LINEAS_GOLES.map((l) => ({
      id: `goles-${clave}-mas-${l}`,
      texto: (eq) => `${eq[clave]}: +${l} goles`,
    })),
    ...LINEAS_GOLES.map((l) => ({
      id: `goles-${clave}-menos-${l}`,
      texto: (eq) => `${eq[clave]}: -${l} goles`,
    })),
  ];
}
const OPCIONES_GOLES_EQUIPO_LOCAL = opcionesGolesEquipo("local");
const OPCIONES_GOLES_EQUIPO_VISITANTE = opcionesGolesEquipo("visitante");

// Goles por equipo pero acotados a una mitad (separado de "goles por
// equipo", que es del partido completo) — a diferencia de
// opcionesGolesMedioTiempo (que no menciona la mitad en el texto), aquí sí
// hace falta decir "1ª mitad"/"2ª mitad": si no, un mismo texto como
// "Real Madrid: Over 1.5 goles" podría venir tanto del partido completo
// como de una mitad, y no habría forma de distinguirlos al editar.
// Devuelve { over, under } por separado (en vez de una lista plana) para
// poder combinar los dos equipos por Over/Under más abajo — necesario
// para el 4º nivel de navegación (mitad → Over/Under) del árbol.
function opcionesGolesEquipoMedioTiempo(clave, prefijoId, etiquetaMitad) {
  return {
    over: LINEAS_GOLES_MEDIO.map((l) => ({
      id: `goles-${clave}-${prefijoId}-over-${l}`,
      texto: (eq) => `${eq[clave]} ${etiquetaMitad}: Over ${l} goles`,
    })),
    under: LINEAS_GOLES_MEDIO.map((l) => ({
      id: `goles-${clave}-${prefijoId}-under-${l}`,
      texto: (eq) => `${eq[clave]} ${etiquetaMitad}: Under ${l} goles`,
    })),
  };
}
const GOLES_EQUIPO_LOCAL_1T = opcionesGolesEquipoMedioTiempo("local", "1t", "1ª mitad");
const GOLES_EQUIPO_VISITANTE_1T = opcionesGolesEquipoMedioTiempo("visitante", "1t", "1ª mitad");
const GOLES_EQUIPO_LOCAL_2T = opcionesGolesEquipoMedioTiempo("local", "2t", "2ª mitad");
const GOLES_EQUIPO_VISITANTE_2T = opcionesGolesEquipoMedioTiempo("visitante", "2t", "2ª mitad");
// Combinados por mitad + Over/Under (los dos equipos juntos) — petición
// directa: agrupado solo por mitad (sin este último nivel) seguía
// juntando de golpe el Over Y el Under de los dos equipos, una lista
// larga. Con este 4º nivel, cada pestaña final solo tiene las líneas de
// los dos equipos para ese Over/Under de esa mitad.
const OPCIONES_GOLES_EQUIPO_1T_OVER = [...GOLES_EQUIPO_LOCAL_1T.over, ...GOLES_EQUIPO_VISITANTE_1T.over];
const OPCIONES_GOLES_EQUIPO_1T_UNDER = [...GOLES_EQUIPO_LOCAL_1T.under, ...GOLES_EQUIPO_VISITANTE_1T.under];
const OPCIONES_GOLES_EQUIPO_2T_OVER = [...GOLES_EQUIPO_LOCAL_2T.over, ...GOLES_EQUIPO_VISITANTE_2T.over];
const OPCIONES_GOLES_EQUIPO_2T_UNDER = [...GOLES_EQUIPO_LOCAL_2T.under, ...GOLES_EQUIPO_VISITANTE_2T.under];

const OPCIONES_MITAD_MAS_GOLES = [
  { id: "mitad-1", texto: () => "Mitad con más goles: 1ª mitad" },
  { id: "mitad-2", texto: () => "Mitad con más goles: 2ª mitad" },
  { id: "mitad-igual", texto: () => "Mitad con más goles: Igualadas" },
];

// ---------------------------------------------------------------------
// Remates y Remates a puerta (del EQUIPO, no del jugador — ver más abajo
// en "Jugador" para los suyos, con ids distintos para no chocar con
// estos). Cada uno con Totales (los dos equipos juntos) / Local /
// Visitante, y dentro de cada uno, Over/Under — a diferencia de
// "Córners"/"Tarjetas" por equipo (que usan notación "+X"), aquí se pidió
// Over/Under explícito como tercer nivel del árbol, así que el texto
// también lo usa.
// ---------------------------------------------------------------------

const LINEAS_REMATES_EQUIPO_TOTAL = lineasDesde(16.5, 34.5, 2);
const LINEAS_REMATES_EQUIPO_LADO = lineasDesde(5.5, 23.5, 2);
const LINEAS_REMATES_PUERTA_EQUIPO_TOTAL = lineasDesde(4.5, 12.5, 1);
const LINEAS_REMATES_PUERTA_EQUIPO_LADO = lineasDesde(0.5, 9.5, 1);

function opcionesOverUnderTotalEquipo(lineas, prefijoId, etiquetaMercado) {
  return {
    over: lineas.map((l) => ({ id: `${prefijoId}-total-over-${l}`, texto: () => `Over ${l} ${etiquetaMercado}` })),
    under: lineas.map((l) => ({ id: `${prefijoId}-total-under-${l}`, texto: () => `Under ${l} ${etiquetaMercado}` })),
  };
}
// "etiquetaMercado" en minúsculas: el nombre del mercado va al FINAL del
// texto ("Real Madrid: Over 1.5 remates"), no delante del equipo — mismo
// orden "Equipo: ..." que el resto del catálogo (petición directa).
function opcionesOverUnderLadoEquipo(lineas, clave, prefijoId, etiquetaMercado) {
  return {
    over: lineas.map((l) => ({
      id: `${prefijoId}-${clave}-over-${l}`,
      texto: (eq) => `${eq[clave]}: Over ${l} ${etiquetaMercado}`,
    })),
    under: lineas.map((l) => ({
      id: `${prefijoId}-${clave}-under-${l}`,
      texto: (eq) => `${eq[clave]}: Under ${l} ${etiquetaMercado}`,
    })),
  };
}

const REMATES_EQUIPO_TOTAL = opcionesOverUnderTotalEquipo(LINEAS_REMATES_EQUIPO_TOTAL, "remates-equipo", "remates");
const REMATES_EQUIPO_LOCAL = opcionesOverUnderLadoEquipo(
  LINEAS_REMATES_EQUIPO_LADO,
  "local",
  "remates-equipo",
  "remates"
);
const REMATES_EQUIPO_VISITANTE = opcionesOverUnderLadoEquipo(
  LINEAS_REMATES_EQUIPO_LADO,
  "visitante",
  "remates-equipo",
  "remates"
);

const REMATES_PUERTA_EQUIPO_TOTAL = opcionesOverUnderTotalEquipo(
  LINEAS_REMATES_PUERTA_EQUIPO_TOTAL,
  "remates-puerta-equipo",
  "remates a puerta"
);
const REMATES_PUERTA_EQUIPO_LOCAL = opcionesOverUnderLadoEquipo(
  LINEAS_REMATES_PUERTA_EQUIPO_LADO,
  "local",
  "remates-puerta-equipo",
  "remates a puerta"
);
const REMATES_PUERTA_EQUIPO_VISITANTE = opcionesOverUnderLadoEquipo(
  LINEAS_REMATES_PUERTA_EQUIPO_LADO,
  "visitante",
  "remates-puerta-equipo",
  "remates a puerta"
);

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
      texto: (eq) => `${eq[clave]}: +${l} córners`,
    })),
    ...LINEAS_CORNERS_EQUIPO.map((l) => ({
      id: `corners-${clave}-menos-${l}`,
      texto: (eq) => `${eq[clave]}: -${l} córners`,
    })),
  ];
}
const OPCIONES_CORNERS_EQUIPO_LOCAL = opcionesCornersEquipo("local");
const OPCIONES_CORNERS_EQUIPO_VISITANTE = opcionesCornersEquipo("visitante");

function opcionesCornersEquipoMedioTiempo(clave, prefijoId, etiquetaMitad) {
  return {
    over: LINEAS_CORNERS_MEDIO.map((l) => ({
      id: `corners-${clave}-${prefijoId}-over-${l}`,
      texto: (eq) => `${eq[clave]} ${etiquetaMitad}: Over ${l} córners`,
    })),
    under: LINEAS_CORNERS_MEDIO.map((l) => ({
      id: `corners-${clave}-${prefijoId}-under-${l}`,
      texto: (eq) => `${eq[clave]} ${etiquetaMitad}: Under ${l} córners`,
    })),
  };
}
const CORNERS_EQUIPO_LOCAL_1T = opcionesCornersEquipoMedioTiempo("local", "1t", "1ª mitad");
const CORNERS_EQUIPO_VISITANTE_1T = opcionesCornersEquipoMedioTiempo("visitante", "1t", "1ª mitad");
const CORNERS_EQUIPO_LOCAL_2T = opcionesCornersEquipoMedioTiempo("local", "2t", "2ª mitad");
const CORNERS_EQUIPO_VISITANTE_2T = opcionesCornersEquipoMedioTiempo("visitante", "2t", "2ª mitad");
// Agrupado por mitad y luego por Over/Under (4º nivel, petición directa):
// separar solo por mitad seguía mezclando de golpe el Over Y el Under de
// los dos equipos en cada pestaña, una lista larga. Con este nivel extra,
// cada pestaña final solo tiene las líneas de los dos equipos para ese
// Over/Under de esa mitad.
const OPCIONES_CORNERS_EQUIPO_1T_OVER = [...CORNERS_EQUIPO_LOCAL_1T.over, ...CORNERS_EQUIPO_VISITANTE_1T.over];
const OPCIONES_CORNERS_EQUIPO_1T_UNDER = [...CORNERS_EQUIPO_LOCAL_1T.under, ...CORNERS_EQUIPO_VISITANTE_1T.under];
const OPCIONES_CORNERS_EQUIPO_2T_OVER = [...CORNERS_EQUIPO_LOCAL_2T.over, ...CORNERS_EQUIPO_VISITANTE_2T.over];
const OPCIONES_CORNERS_EQUIPO_2T_UNDER = [...CORNERS_EQUIPO_LOCAL_2T.under, ...CORNERS_EQUIPO_VISITANTE_2T.under];

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
      texto: (eq) => `${eq[clave]}: +${l} tarjetas`,
    })),
    ...LINEAS_TARJETAS.map((l) => ({
      id: `tarjetas-${clave}-menos-${l}`,
      texto: (eq) => `${eq[clave]}: -${l} tarjetas`,
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
const OPCIONES_AMBOS_DOS_TARJETAS = [
  { id: "ambos-2-tarjetas-si", texto: () => "Ambos reciben dos tarjetas: Sí" },
  { id: "ambos-2-tarjetas-no", texto: () => "Ambos reciben dos tarjetas: No" },
];
const OPCIONES_EXPULSION = [
  { id: "expulsion-si", texto: () => "Tarjeta roja: Sí" },
  { id: "expulsion-no", texto: () => "Tarjeta roja: No" },
];

// Un equipo recibe tarjeta en una mitad concreta (petición directa,
// faltaba en el catálogo) — Sí/No por equipo y por mitad, mismo patrón
// que OPCIONES_PRIMERA_TARJETA/OPCIONES_AMBOS_TARJETA (escrito a mano en
// vez de con opcionesEspecialEquipo: aquí hace falta Sí Y No para cada
// equipo, no un único texto por equipo).
function opcionesTarjetaEquipoMitad(prefijoId, etiquetaMitad) {
  return [
    { id: `tarjeta-${prefijoId}-local-si`, texto: (eq) => `${eq.local} recibe tarjeta en la ${etiquetaMitad}: Sí` },
    { id: `tarjeta-${prefijoId}-local-no`, texto: (eq) => `${eq.local} recibe tarjeta en la ${etiquetaMitad}: No` },
    {
      id: `tarjeta-${prefijoId}-visitante-si`,
      texto: (eq) => `${eq.visitante} recibe tarjeta en la ${etiquetaMitad}: Sí`,
    },
    {
      id: `tarjeta-${prefijoId}-visitante-no`,
      texto: (eq) => `${eq.visitante} recibe tarjeta en la ${etiquetaMitad}: No`,
    },
  ];
}
const OPCIONES_TARJETA_EQUIPO_1T = opcionesTarjetaEquipoMitad("1t", "1ª mitad");
const OPCIONES_TARJETA_EQUIPO_2T = opcionesTarjetaEquipoMitad("2t", "2ª mitad");

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
const OPCIONES_ANOTA_PENALTI = [
  { id: "penalti-anota-local", texto: (eq) => `${eq.local} anotará un penalti` },
  { id: "penalti-anota-visitante", texto: (eq) => `${eq.visitante} anotará un penalti` },
];
const OPCIONES_PENALTI_ENCUENTRO = [
  { id: "penalti-encuentro-si", texto: () => "Penalti: Sí" },
  { id: "penalti-encuentro-no", texto: () => "Penalti: No" },
];
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
  { id: "anota-penalti", etiqueta: "Anotará un penalti", opciones: OPCIONES_ANOTA_PENALTI },
  { id: "penalti-encuentro", etiqueta: "Penalti en el encuentro", opciones: OPCIONES_PENALTI_ENCUENTRO },
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
  { id: "equipo-clasifica", etiqueta: "Equipo que clasifica", opciones: OPCIONES_EQUIPO_CLASIFICA },
  {
    id: "metodo-clasificacion",
    etiqueta: "Método de clasificación",
    opciones: [...OPCIONES_METODO_CLASIFICACION_LOCAL, ...OPCIONES_METODO_CLASIFICACION_VISITANTE],
  },
  { id: "ganador-trofeo", etiqueta: "Ganador del trofeo", opciones: OPCIONES_GANADOR_TROFEO },
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
      ...OPCIONES_PORTERIA_CERO_LOCAL,
      ...OPCIONES_PORTERIA_CERO_VISITANTE,
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
    opciones: [
      ...OPCIONES_GOLES_EQUIPO_1T_OVER,
      ...OPCIONES_GOLES_EQUIPO_1T_UNDER,
      ...OPCIONES_GOLES_EQUIPO_2T_OVER,
      ...OPCIONES_GOLES_EQUIPO_2T_UNDER,
    ],
  },
  { id: "mitad-mas-goles", etiqueta: "Mitad con más goles", opciones: OPCIONES_MITAD_MAS_GOLES },
  {
    id: "remates-equipo",
    etiqueta: "Remates",
    opciones: [
      ...REMATES_EQUIPO_TOTAL.over,
      ...REMATES_EQUIPO_TOTAL.under,
      ...REMATES_EQUIPO_LOCAL.over,
      ...REMATES_EQUIPO_LOCAL.under,
      ...REMATES_EQUIPO_VISITANTE.over,
      ...REMATES_EQUIPO_VISITANTE.under,
    ],
  },
  {
    id: "remates-puerta-equipo",
    etiqueta: "Remates a puerta",
    opciones: [
      ...REMATES_PUERTA_EQUIPO_TOTAL.over,
      ...REMATES_PUERTA_EQUIPO_TOTAL.under,
      ...REMATES_PUERTA_EQUIPO_LOCAL.over,
      ...REMATES_PUERTA_EQUIPO_LOCAL.under,
      ...REMATES_PUERTA_EQUIPO_VISITANTE.over,
      ...REMATES_PUERTA_EQUIPO_VISITANTE.under,
    ],
  },
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
      ...OPCIONES_CORNERS_EQUIPO_1T_OVER,
      ...OPCIONES_CORNERS_EQUIPO_1T_UNDER,
      ...OPCIONES_CORNERS_EQUIPO_2T_OVER,
      ...OPCIONES_CORNERS_EQUIPO_2T_UNDER,
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
      ...OPCIONES_TARJETA_EQUIPO_1T,
      ...OPCIONES_TARJETA_EQUIPO_2T,
      ...OPCIONES_PRIMERA_TARJETA,
      ...OPCIONES_AMBOS_TARJETA,
      ...OPCIONES_AMBOS_DOS_TARJETAS,
      ...OPCIONES_EXPULSION,
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
// subcategoría → (si aplica) un nivel más (Local/Visitante, o mitad —
// ver "por-equipo-mitad(es)" de Goles/Córners, que además tienen un 4º
// nivel: mitad → Over/Under). Cada nodo lleva "opciones" (hoja) O
// "subcategorias" (un nivel más), nunca los dos — da igual la
// profundidad, SelectorMercado.jsx soporta hasta 4 niveles fijos
// (categoría → subcategoría → nivel3 → nivel4).
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
    id: "equipo-clasifica",
    etiqueta: "Equipo que clasifica",
    subcategorias: [
      { id: "clasifica", etiqueta: "Clasifica", opciones: OPCIONES_EQUIPO_CLASIFICA },
    ],
  },
  {
    id: "metodo-clasificacion",
    etiqueta: "Método de clasificación",
    subcategorias: [
      { id: "local", etiqueta: "Local", opciones: OPCIONES_METODO_CLASIFICACION_LOCAL },
      { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_METODO_CLASIFICACION_VISITANTE },
    ],
  },
  {
    id: "ganador-trofeo",
    etiqueta: "Ganador del trofeo",
    subcategorias: [{ id: "trofeo", etiqueta: "Trofeo", opciones: OPCIONES_GANADOR_TROFEO }],
  },
  {
    id: "jugador",
    etiqueta: "Jugador",
    requiereJugador: true,
    subcategorias: [
      { id: "goles", etiqueta: "Anotará", opciones: OPCIONES_JUGADOR_GOLES },
      { id: "asistencias", etiqueta: "Asistirá", opciones: OPCIONES_JUGADOR_ASISTENCIAS },
      { id: "anota-o-asiste", etiqueta: "Anotará o Asistirá", opciones: OPCIONES_JUGADOR_ANOTA_O_ASISTE },
      { id: "remates", etiqueta: "Remates", opciones: OPCIONES_JUGADOR_REMATES },
      { id: "remates-puerta", etiqueta: "Remates a puerta", opciones: OPCIONES_JUGADOR_REMATES_PUERTA },
      {
        id: "remates-puerta-cabeza",
        etiqueta: "Remates a puerta de cabeza",
        opciones: OPCIONES_JUGADOR_REMATES_PUERTA_CABEZA,
      },
      {
        id: "remates-puerta-fuera-area",
        etiqueta: "Remates a puerta fuera del área",
        opciones: OPCIONES_JUGADOR_REMATES_PUERTA_FUERA_AREA,
      },
      {
        id: "faltas",
        etiqueta: "Faltas",
        subcategorias: [
          { id: "comete", etiqueta: "Comete", opciones: OPCIONES_JUGADOR_FALTAS_COMETE },
          { id: "recibe", etiqueta: "Recibe", opciones: OPCIONES_JUGADOR_FALTAS_RECIBE },
        ],
      },
      { id: "entradas", etiqueta: "Entradas", opciones: OPCIONES_JUGADOR_ENTRADAS },
      { id: "paradas", etiqueta: "Paradas del portero", opciones: OPCIONES_JUGADOR_PARADAS },
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
      {
        id: "porteria-cero",
        etiqueta: "Portería a cero",
        subcategorias: [
          { id: "local", etiqueta: "Local", opciones: OPCIONES_PORTERIA_CERO_LOCAL },
          { id: "visitante", etiqueta: "Visitante", opciones: OPCIONES_PORTERIA_CERO_VISITANTE },
        ],
      },
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
        etiqueta: "Por equipo y mitad",
        // Petición directa: mitad → equipo (Local/Visitante) → Over/Under,
        // un 5º nivel de navegación (ver rutaEnArbol/SelectorMercado.jsx) —
        // mismo patrón que el 4º, un escalón más abajo.
        subcategorias: [
          {
            id: "1t",
            etiqueta: "1ª mitad",
            subcategorias: [
              {
                id: "local",
                etiqueta: "Local",
                subcategorias: [
                  { id: "over", etiqueta: "Over", opciones: GOLES_EQUIPO_LOCAL_1T.over },
                  { id: "under", etiqueta: "Under", opciones: GOLES_EQUIPO_LOCAL_1T.under },
                ],
              },
              {
                id: "visitante",
                etiqueta: "Visitante",
                subcategorias: [
                  { id: "over", etiqueta: "Over", opciones: GOLES_EQUIPO_VISITANTE_1T.over },
                  { id: "under", etiqueta: "Under", opciones: GOLES_EQUIPO_VISITANTE_1T.under },
                ],
              },
            ],
          },
          {
            id: "2t",
            etiqueta: "2ª mitad",
            subcategorias: [
              {
                id: "local",
                etiqueta: "Local",
                subcategorias: [
                  { id: "over", etiqueta: "Over", opciones: GOLES_EQUIPO_LOCAL_2T.over },
                  { id: "under", etiqueta: "Under", opciones: GOLES_EQUIPO_LOCAL_2T.under },
                ],
              },
              {
                id: "visitante",
                etiqueta: "Visitante",
                subcategorias: [
                  { id: "over", etiqueta: "Over", opciones: GOLES_EQUIPO_VISITANTE_2T.over },
                  { id: "under", etiqueta: "Under", opciones: GOLES_EQUIPO_VISITANTE_2T.under },
                ],
              },
            ],
          },
        ],
      },
      { id: "mitad-mas-goles", etiqueta: "Mitad con más goles", opciones: OPCIONES_MITAD_MAS_GOLES },
    ],
  },
  {
    id: "remates-equipo",
    etiqueta: "Remates",
    subcategorias: [
      {
        id: "totales",
        etiqueta: "Totales",
        subcategorias: [
          { id: "over", etiqueta: "Over", opciones: REMATES_EQUIPO_TOTAL.over },
          { id: "under", etiqueta: "Under", opciones: REMATES_EQUIPO_TOTAL.under },
        ],
      },
      {
        id: "local",
        etiqueta: "Local",
        subcategorias: [
          { id: "over", etiqueta: "Over", opciones: REMATES_EQUIPO_LOCAL.over },
          { id: "under", etiqueta: "Under", opciones: REMATES_EQUIPO_LOCAL.under },
        ],
      },
      {
        id: "visitante",
        etiqueta: "Visitante",
        subcategorias: [
          { id: "over", etiqueta: "Over", opciones: REMATES_EQUIPO_VISITANTE.over },
          { id: "under", etiqueta: "Under", opciones: REMATES_EQUIPO_VISITANTE.under },
        ],
      },
    ],
  },
  {
    id: "remates-puerta-equipo",
    etiqueta: "Remates a puerta",
    subcategorias: [
      {
        id: "totales",
        etiqueta: "Totales",
        subcategorias: [
          { id: "over", etiqueta: "Over", opciones: REMATES_PUERTA_EQUIPO_TOTAL.over },
          { id: "under", etiqueta: "Under", opciones: REMATES_PUERTA_EQUIPO_TOTAL.under },
        ],
      },
      {
        id: "local",
        etiqueta: "Local",
        subcategorias: [
          { id: "over", etiqueta: "Over", opciones: REMATES_PUERTA_EQUIPO_LOCAL.over },
          { id: "under", etiqueta: "Under", opciones: REMATES_PUERTA_EQUIPO_LOCAL.under },
        ],
      },
      {
        id: "visitante",
        etiqueta: "Visitante",
        subcategorias: [
          { id: "over", etiqueta: "Over", opciones: REMATES_PUERTA_EQUIPO_VISITANTE.over },
          { id: "under", etiqueta: "Under", opciones: REMATES_PUERTA_EQUIPO_VISITANTE.under },
        ],
      },
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
          {
            id: "1t",
            etiqueta: "1ª mitad",
            subcategorias: [
              { id: "over", etiqueta: "Over", opciones: OPCIONES_CORNERS_EQUIPO_1T_OVER },
              { id: "under", etiqueta: "Under", opciones: OPCIONES_CORNERS_EQUIPO_1T_UNDER },
            ],
          },
          {
            id: "2t",
            etiqueta: "2ª mitad",
            subcategorias: [
              { id: "over", etiqueta: "Over", opciones: OPCIONES_CORNERS_EQUIPO_2T_OVER },
              { id: "under", etiqueta: "Under", opciones: OPCIONES_CORNERS_EQUIPO_2T_UNDER },
            ],
          },
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
      {
        id: "recibe-tarjeta-mitad",
        etiqueta: "Recibe tarjeta por mitad",
        subcategorias: [
          { id: "1t", etiqueta: "1ª mitad", opciones: OPCIONES_TARJETA_EQUIPO_1T },
          { id: "2t", etiqueta: "2ª mitad", opciones: OPCIONES_TARJETA_EQUIPO_2T },
        ],
      },
      { id: "primera-tarjeta", etiqueta: "Primera tarjeta", opciones: OPCIONES_PRIMERA_TARJETA },
      { id: "ambos-tarjeta", etiqueta: "Ambos reciben tarjeta", opciones: OPCIONES_AMBOS_TARJETA },
      { id: "ambos-2-tarjetas", etiqueta: "Ambos reciben 2 tarjetas", opciones: OPCIONES_AMBOS_DOS_TARJETAS },
      { id: "expulsion", etiqueta: "Expulsión", opciones: OPCIONES_EXPULSION },
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
          return {
            categoriaId: categoria.id,
            subcategoriaId: sub.id,
            nivel3Id: null,
            nivel4Id: null,
            nivel5Id: null,
          };
        }
        continue;
      }
      for (const nivel3 of sub.subcategorias) {
        if (nivel3.opciones) {
          if (nivel3.opciones.some((o) => o.id === opcionId)) {
            return {
              categoriaId: categoria.id,
              subcategoriaId: sub.id,
              nivel3Id: nivel3.id,
              nivel4Id: null,
              nivel5Id: null,
            };
          }
          continue;
        }
        for (const nivel4 of nivel3.subcategorias) {
          if (nivel4.opciones) {
            if (nivel4.opciones.some((o) => o.id === opcionId)) {
              return {
                categoriaId: categoria.id,
                subcategoriaId: sub.id,
                nivel3Id: nivel3.id,
                nivel4Id: nivel4.id,
                nivel5Id: null,
              };
            }
            continue;
          }
          // 5º nivel (Goles "por equipo y mitad": mitad → equipo → Over/Under).
          for (const nivel5 of nivel4.subcategorias) {
            if (nivel5.opciones.some((o) => o.id === opcionId)) {
              return {
                categoriaId: categoria.id,
                subcategoriaId: sub.id,
                nivel3Id: nivel3.id,
                nivel4Id: nivel4.id,
                nivel5Id: nivel5.id,
              };
            }
          }
        }
      }
    }
  }
  return null;
}
