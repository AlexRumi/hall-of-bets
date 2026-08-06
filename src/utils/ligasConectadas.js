// Mismas 21 ligas que api/partidos.js (LIGAS), pero agrupadas por país para
// los desplegables de filtro del buscador de partidos (BuscadorEvento.jsx).
// Datos puros, solo para la interfaz — no hace falta llamar a la API para
// saber qué países/competiciones hay conectados. Si algún día se añade o
// quita una liga en api/partidos.js, hay que actualizar esto también.
export const PAISES_CONECTADOS = [
  { pais: "España", competiciones: ["La Liga", "Segunda División", "Copa del Rey"] },
  { pais: "Italia", competiciones: ["Serie A", "Serie B", "Coppa Italia"] },
  { pais: "Francia", competiciones: ["Ligue 1", "Ligue 2", "Coupe de France"] },
  { pais: "Alemania", competiciones: ["Bundesliga", "2. Bundesliga", "DFB Pokal"] },
  {
    pais: "Inglaterra",
    competiciones: ["Premier League", "Championship", "FA Cup", "EFL Cup"],
  },
  { pais: "Europa", competiciones: ["Champions League", "Europa League", "Conference League"] },
  { pais: "Portugal", competiciones: ["Primeira Liga"] },
  { pais: "Países Bajos", competiciones: ["Eredivisie"] },
];
