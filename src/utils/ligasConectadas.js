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
];

// Solo para agrupar visualmente el desplegable de País en
// BuscadorEvento.jsx (Portugal/Holanda/Bélgica bajo un mismo grupo
// "Europa"); no afecta al filtrado en sí, que sigue comparando por el
// nombre de país normal de PAISES_CONECTADOS.
export const PAISES_GRUPO_EUROPA = ["Portugal", "Holanda", "Bélgica"];
