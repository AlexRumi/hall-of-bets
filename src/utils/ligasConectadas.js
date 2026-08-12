// Agrupación de países/competiciones conectadas para el desplegable de
// BuscadorEvento.jsx: Grandes ligas → Competición Europea → Europa →
// América → Otras ligas (fija al final, siempre visible, la opción
// manual — no vive aquí, es un sentinela aparte en BuscadorEvento.jsx).
// Orden de cada grupo tal cual se pidió (no alfabético en "Grandes
// ligas", alfabético en el resto).
//
// "Competición Europea" es un grupo especial: sus 4 entradas ya son
// competiciones concretas (Champions/Europa/Conference/Supercopa), no
// están organizadas por país, así que lleva "competiciones" directamente
// en vez de "paises" — BuscadorEvento.jsx distingue los dos tipos de
// grupo por qué campo tienen (nunca los dos a la vez), mismo patrón que
// ya usa ARBOL_MERCADOS en utils/mercados.js para "opciones" vs
// "subcategorias".
//
// Los nombres de "pais"/"competicion" tienen que coincidir exactamente
// con los de api/partidos.js. Si algún día se añade o quita una liga
// ahí, hay que actualizar esto también — bug real ya visto una vez
// (Supercopa de Europa añadida en api/partidos.js pero olvidada aquí, así
// que nunca llegaba a aparecer en el desplegable aunque los partidos ya
// se estuvieran trayendo bien).
export const GRUPOS_LIGAS = [
  {
    grupo: "Grandes ligas",
    paises: [
      { pais: "España", competiciones: ["La Liga", "Segunda División", "Copa del Rey"] },
      {
        pais: "Inglaterra",
        competiciones: ["Premier League", "Championship", "FA Cup", "EFL Cup"],
      },
      { pais: "Alemania", competiciones: ["Bundesliga", "2. Bundesliga", "DFB Pokal"] },
      { pais: "Francia", competiciones: ["Ligue 1", "Ligue 2", "Coupe de France"] },
      { pais: "Italia", competiciones: ["Serie A", "Serie B", "Coppa Italia"] },
    ],
  },
  {
    grupo: "Competición Europea",
    icono: "🇪🇺",
    competiciones: ["Champions League", "Europa League", "Conference League", "Supercopa de Europa"],
  },
  {
    grupo: "Europa",
    paises: [
      { pais: "Austria", competiciones: ["Bundesliga austríaca"] },
      { pais: "Bélgica", competiciones: ["Jupiler Pro League"] },
      { pais: "Dinamarca", competiciones: ["Superliga"] },
      { pais: "Holanda", competiciones: ["Eredivisie"] },
      { pais: "Noruega", competiciones: ["Eliteserien"] },
      { pais: "Portugal", competiciones: ["Primeira Liga"] },
      { pais: "Suecia", competiciones: ["Allsvenskan"] },
      { pais: "Suiza", competiciones: ["Super League"] },
      { pais: "Turquía", competiciones: ["Süper Lig"] },
    ],
  },
  {
    grupo: "América",
    paises: [
      { pais: "Argentina", competiciones: ["Liga Profesional"] },
      { pais: "Brasil", competiciones: ["Brasileirão Série A"] },
      { pais: "Estados Unidos", competiciones: ["MLS"] },
      { pais: "México", competiciones: ["Liga MX"] },
    ],
  },
];

// Emoji de bandera por país, para las pestañas de país de
// BuscadorEvento.jsx. Solo se pintan en dispositivos táctiles (ver
// .mq-oculto-raton en index.css) — con ratón se ocultan, porque algunas
// versiones de Windows no renderizan bien los emoji de bandera
// compuestos. "Inglaterra" reutiliza la bandera del Reino Unido a
// propósito: la bandera real de Inglaterra es un emoji "de subdivisión"
// (secuencia de banderas con tags), todavía más compuesta que las
// normales — más probable que falle en Windows, así que se prefiere la
// del Reino Unido como aproximación práctica, aunque no sea exacta.
export const BANDERAS_PAIS = {
  España: "🇪🇸",
  Inglaterra: "🇬🇧",
  Alemania: "🇩🇪",
  Francia: "🇫🇷",
  Italia: "🇮🇹",
  Austria: "🇦🇹",
  Bélgica: "🇧🇪",
  Dinamarca: "🇩🇰",
  Holanda: "🇳🇱",
  Noruega: "🇳🇴",
  Portugal: "🇵🇹",
  Suecia: "🇸🇪",
  Suiza: "🇨🇭",
  Turquía: "🇹🇷",
  Argentina: "🇦🇷",
  Brasil: "🇧🇷",
  "Estados Unidos": "🇺🇸",
  México: "🇲🇽",
};
