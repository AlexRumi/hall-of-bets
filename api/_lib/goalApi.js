// Helper compartido por los 3 endpoints activos (partidos/jugadores/
// partido) que llaman a GOAL API — centraliza la URL base, el header de
// autenticación y el criterio de "esto es un error" para no repetirlo
// tres veces. GOAL API responde siempre 200 con { success: false, code,
// category, message } en caso de error (comprobado a mano con una key
// inválida) — no hay que fiarse solo del status HTTP.
const BASE_URL = "https://api.goal-api.com/v1";

export async function goalFetch(ruta, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${ruta}${query ? `?${query}` : ""}`;

  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.GOAL_API_KEY}` },
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok || !datos || datos.success === false) {
    const error = new Error(datos?.message ?? `GOAL API respondió ${respuesta.status}`);
    error.category = datos?.category ?? null;
    error.code = datos?.code ?? null;
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

// Mapeo de las 45 competiciones conectadas hoy (mismos país/competición
// exactos que el "LIGAS" original de API-Football, para no tener que
// tocar BuscadorEvento.jsx, CODIGOS_BANDERA ni
// ORDEN_COMPETICIONES_POR_PAIS de PanelPartidos.jsx) — verificado uno a
// uno contra GOAL API (GET /leagues?search=..., comprobando que
// countryName coincide y descartando ediciones femeninas/juveniles/de
// filial que comparten nombre parecido) el 2026-09-03, mismo día de la
// migración. Los ids son strings (formato cuid de GOAL), no los
// números de API-Football — si algún día hace falta re-verificar
// alguno, repetir esa misma búsqueda contra /leagues.
export const LIGAS = {
  "cmr77dvnt006nrx063v3w622e": { pais: "España", competicion: "La Liga" },
  "cmr77dvnt006orx06io7l06lv": { pais: "España", competicion: "Segunda División" },
  "cmr77dvnt006mrx06cxed28bn": { pais: "España", competicion: "Copa del Rey" },
  // Añadidas el 2026-09-04 (petición directa): RFEF (3ª, 4ª y 5ª
  // división) y fútbol femenino, verificadas contra GOAL API con el
  // mismo método que el resto de esta lista (leagues?search=...,
  // country coincidente).
  "cmr77dvnt006srx06wvufgrxh": { pais: "España", competicion: "Primera RFEF" },
  "cmr77dvnt006trx06u0gch19o": { pais: "España", competicion: "Segunda RFEF" },
  "cmr77dvnt006vrx060c2vb6f4": { pais: "España", competicion: "Tercera RFEF" },
  "cmr77dvnt006rrx062u7wzuzi": { pais: "España", competicion: "Primera División Femenina" },
  "cmr77dvkr005nrx06lp7rvp49": { pais: "Inglaterra", competicion: "Premier League" },
  "cmr77dvkr005hrx068xaahpuh": { pais: "Inglaterra", competicion: "Championship" },
  "cmr77dvkr005jrx06moiox5oh": { pais: "Inglaterra", competicion: "FA Cup" },
  "cmr77dvkr005krx069ypbvs0i": { pais: "Inglaterra", competicion: "EFL Cup" },
  "cmr77dvgm0002rx06rt2uqxii": { pais: "Alemania", competicion: "Bundesliga" },
  "cmr77dvgm0001rx060h6ivt4p": { pais: "Alemania", competicion: "2. Bundesliga" },
  "cmr77dvgm0003rx06nnbqia6t": { pais: "Alemania", competicion: "DFB Pokal" },
  "cmr77dvpd006yrx06zig7907g": { pais: "Italia", competicion: "Serie A" },
  "cmr77dvpd006zrx06dmggkel8": { pais: "Italia", competicion: "Serie B" },
  "cmr77dvpd006xrx068552obpr": { pais: "Italia", competicion: "Coppa Italia" },
  "cmr77dvqg007crx06q1kaceyo": { pais: "Francia", competicion: "Ligue 1" },
  "cmr77dvqg007drx06q6y56j5u": { pais: "Francia", competicion: "Ligue 2" },
  "cmr77dvqg007brx06kxzw78vu": { pais: "Francia", competicion: "Coupe de France" },
  "cmr77dvun00adrx06xz20yfxe": { pais: "Portugal", competicion: "Primeira Liga" },
  "cmr77dvrh007vrx0664phtxs5": { pais: "Holanda", competicion: "Eredivisie" },
  "cmr77dw9g00gvrx06jlglb47m": { pais: "Bélgica", competicion: "Jupiler Pro League" },
  "cmr77dw3900f5rx06j05wgzv4": { pais: "Competición Europea", competicion: "Champions League" },
  "cmr77dw3900f6rx06tuqwft2d": { pais: "Competición Europea", competicion: "Europa League" },
  "cmr77dw3900f9rx06laad8onf": { pais: "Competición Europea", competicion: "Conference League" },
  "cmr77dw4800fhrx065oy5co7g": { pais: "Competición Europea", competicion: "Supercopa de Europa", temporal: true },
  // Añadidas el 2026-09-04 (petición directa): Nations League (temporada
  // regular, no "temporal"), clasificatorias (fase larga, tampoco
  // "temporal") y las dos fases finales (Mundial/Eurocopa, solo cada 4
  // años — sí "temporal", para que no se queden colgadas en el
  // desplegable el resto de años sin partidos).
  "cmr77dw4800fgrx06rwmig2h8": { pais: "Competición Europea", competicion: "Nations League" },
  "cmr77dw4800ffrx06n12x8vzf": { pais: "Competición Europea", competicion: "Clasificación Eurocopa" },
  "cmr77dw3900f7rx06p5hrzt3h": { pais: "Competición Europea", competicion: "Clasificación Mundial" },
  "cmr77dw4800ferx06u57oohrh": { pais: "Competición Europea", competicion: "Eurocopa", temporal: true },
  "cmr77dw4s00fmrx069yvhf8ce": { pais: "Mundial", competicion: "Copa del Mundo", temporal: true },
  "cmr77dvhg001brx066q5nrpxb": { pais: "Competición Europea", competicion: "Champions League Femenina" },
  "cmr77dvmv006erx06bv7j5r71": { pais: "Sudamérica", competicion: "Clasificación Mundial" },
  // Añadida el 2026-09-04: "CONMEBOL Copa America" tal cual la llama
  // GOAL API (país "intl" en su respuesta) — torneo corto y no anual,
  // igual que Mundial/Eurocopa, así que también "temporal".
  "cmr77dvhg0018rx06z11d3k9z": { pais: "Sudamérica", competicion: "Copa América", temporal: true },
  "cmr77dvjm005brx062i1cpb4k": { pais: "Austria", competicion: "Bundesliga austríaca" },
  "cmr77dw1z00exrx062x6co26u": { pais: "Dinamarca", competicion: "Superliga" },
  "cmr77dvyx00egrx06pta3wmnc": { pais: "Suiza", competicion: "Super League" },
  "cmr77dw0q00eprx06rqew3m48": { pais: "Turquía", competicion: "Süper Lig" },
  "cmr77dvr3007lrx061vsn0yjt": { pais: "Noruega", competicion: "Eliteserien" },
  "cmr77dvit0052rx06pj7safds": { pais: "Suecia", competicion: "Allsvenskan" },
  "cmr77dvtc0093rx0667jirsnv": { pais: "Argentina", competicion: "Liga Profesional" },
  "cmr77dvww00bfrx061thkr8z4": { pais: "Brasil", competicion: "Brasileirão Série A" },
  "cmr77dvsv008srx06mier6t7r": { pais: "México", competicion: "Liga MX" },
  "cmr77dvtx009krx06tw1t8obh": { pais: "Estados Unidos", competicion: "MLS" },
  "cmr77dwe100j5rx064jkxo63c": { pais: "Escocia", competicion: "Premiership" },
  "cmr77dwfb00jmrx06oapyzogf": { pais: "Grecia", competicion: "Super League" },
  "cmr77dw8j00gerx06xvshbkow": { pais: "Polonia", competicion: "Ekstraklasa" },
  "cmr77dwa300hcrx06k4a5z7z4": { pais: "Croacia", competicion: "HNL" },
  "cmr77dw9200gmrx06o9tqq555": { pais: "República Checa", competicion: "Czech Liga" },
  "cmr77dvw600b9rx06euixf818": { pais: "Arabia Saudí", competicion: "Pro League" },
  "cmr77dvv600aprx06o7y7lnfu": { pais: "Colombia", competicion: "Primera A" },
  "cmr77dvvh00avrx06jb5gtua7": { pais: "Chile", competicion: "Primera División" },
  // Japón, Corea del Sur, Australia y Uruguay quitadas el 2026-09-04
  // (petición directa) — eran las menos usadas de las 12 añadidas el
  // 2026-08-31.
};

// GOAL API da "matchDate"/"matchTime" en UTC (comprobado a mano:
// coinciden exactamente con la hora de "kickoffUtc") — a diferencia de
// API-Football, a quien se le podía pedir directamente en hora de
// España con "timezone=Europe/Madrid". Sin esto, la hora que ve el
// usuario iría 1-2h por detrás de la real (según CET/CEST). Se
// reconstruye fecha/hora en Europe/Madrid a partir de "kickoffUtc", el
// único campo fiable.
const FORMATO_FECHA_MADRID = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const FORMATO_HORA_MADRID = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function fechaHoraMadrid(kickoffUtc) {
  const fechaUtc = new Date(kickoffUtc);
  return {
    fecha: FORMATO_FECHA_MADRID.format(fechaUtc),
    hora: FORMATO_HORA_MADRID.format(fechaUtc),
  };
}

// Traduce el "matchStatus" de GOAL API a los mismos códigos cortos que
// ya usaba API-Football (NS/1H/FT...) — así el frontend (PanelPartidos.jsx,
// usePartidoInfo.js, ESTADOS_TERMINADOS_PARTIDO en utils/apuestas.js) no
// necesita ningún cambio, solo entiende esos códigos de siempre. Solo se
// han visto SCHEDULED/LIVE/FINISHED en las pruebas; cualquier valor no
// reconocido se traduce a "1H" (en juego) en vez de "FT", para no marcar
// nunca por error como terminado algo que no lo está — igual de
// conservador que el criterio de antes.
export function estadoCorto(matchStatus) {
  if (matchStatus === "FINISHED") return "FT";
  if (matchStatus === "SCHEDULED") return "NS";
  return "1H";
}
