// Mismas 22 ligas que api/partidos.js (LIGAS), pero agrupadas por país para
// los desplegables de filtro del buscador de partidos (BuscadorEvento.jsx).
// Datos puros, solo para la interfaz — no hace falta llamar a la API para
// saber qué países/competiciones hay conectados. Los nombres de "pais"
// tienen que coincidir exactamente con los de api/partidos.js. Si algún día
// se añade o quita una liga en api/partidos.js, hay que actualizar esto
// también.
export const PAISES_CONECTADOS = [
  { pais: "España", competiciones: ["La Liga", "Segunda División", "Copa del Rey"] },
  {
    pais: "Reino Unido",
    competiciones: ["Premier League", "Championship", "FA Cup", "EFL Cup"],
  },
  { pais: "Alemania", competiciones: ["Bundesliga", "2. Bundesliga", "DFB Pokal"] },
  { pais: "Italia", competiciones: ["Serie A", "Serie B", "Coppa Italia"] },
  { pais: "Francia", competiciones: ["Ligue 1", "Ligue 2", "Coupe de France"] },
  { pais: "Portugal", competiciones: ["Primeira Liga"] },
  { pais: "Holanda", competiciones: ["Eredivisie"] },
  { pais: "Bélgica", competiciones: ["Jupiler Pro League"] },
  {
    pais: "Competición Europea",
    competiciones: ["Champions League", "Europa League", "Conference League"],
  },
  { pais: "Austria", competiciones: ["Bundesliga austríaca"] },
  { pais: "Dinamarca", competiciones: ["Superliga"] },
  { pais: "Suiza", competiciones: ["Super League"] },
  { pais: "Turquía", competiciones: ["Süper Lig"] },
  { pais: "Noruega", competiciones: ["Eliteserien"] },
  { pais: "Suecia", competiciones: ["Allsvenskan"] },
  { pais: "Argentina", competiciones: ["Liga Profesional"] },
  { pais: "Brasil", competiciones: ["Brasileirão Série A"] },
  { pais: "México", competiciones: ["Liga MX"] },
  { pais: "Estados Unidos", competiciones: ["MLS"] },
];

// Emoji de bandera por país, para las pestañas de BuscadorEvento.jsx
// (mismo orden de PAISES_CONECTADOS). Solo se pintan en dispositivos
// táctiles (ver .mq-oculto-raton en index.css) — con ratón se ocultan,
// porque algunas versiones de Windows no renderizan bien los emoji de
// bandera compuestos. "Otras ligas" no es un país real, no lleva bandera.
export const BANDERAS_PAIS = {
  España: "🇪🇸",
  "Reino Unido": "🇬🇧",
  Alemania: "🇩🇪",
  Italia: "🇮🇹",
  Francia: "🇫🇷",
  Portugal: "🇵🇹",
  Holanda: "🇳🇱",
  Bélgica: "🇧🇪",
  "Competición Europea": "🇪🇺",
  Austria: "🇦🇹",
  Dinamarca: "🇩🇰",
  Suiza: "🇨🇭",
  Turquía: "🇹🇷",
  Noruega: "🇳🇴",
  Suecia: "🇸🇪",
  Argentina: "🇦🇷",
  Brasil: "🇧🇷",
  México: "🇲🇽",
  "Estados Unidos": "🇺🇸",
};
