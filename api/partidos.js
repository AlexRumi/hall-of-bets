// Serverless Function de Vercel (no del propio Vite): se ejecuta en el
// servidor de Vercel, nunca en el navegador, así que aquí sí se puede usar
// la API key secreta de API-Football sin exponerla. El frontend solo llama
// a esta ruta (/api/partidos?fecha=YYYY-MM-DD), nunca a API-Football
// directamente.
//
// Solo se filtran estas 22 competiciones (las que se pidió conectar); el
// resto de partidos del mundo que devuelve API-Football para ese día se
// descartan. IDs verificados a mano en el panel de API-Football del usuario
// el 2026-08-06 — si algún día cambian de nombre de patrocinador (ya pasó
// con "LaLiga Hypermotion" y "Carabao Cup"), el id numérico no cambia.
// "pais" tiene que coincidir exactamente con el desplegable de
// src/components/BuscadorEvento.jsx (mismos nombres: "Reino Unido" en vez
// de "Inglaterra", "Holanda" en vez de "Países Bajos", "Competición
// Europea" en vez de "Europa" — para no confundirlo con el país).
const LIGAS = {
  140: { pais: "España", competicion: "La Liga" },
  141: { pais: "España", competicion: "Segunda División" },
  143: { pais: "España", competicion: "Copa del Rey" },
  39: { pais: "Reino Unido", competicion: "Premier League" },
  40: { pais: "Reino Unido", competicion: "Championship" },
  45: { pais: "Reino Unido", competicion: "FA Cup" },
  48: { pais: "Reino Unido", competicion: "EFL Cup" },
  78: { pais: "Alemania", competicion: "Bundesliga" },
  79: { pais: "Alemania", competicion: "2. Bundesliga" },
  81: { pais: "Alemania", competicion: "DFB Pokal" },
  135: { pais: "Italia", competicion: "Serie A" },
  136: { pais: "Italia", competicion: "Serie B" },
  137: { pais: "Italia", competicion: "Coppa Italia" },
  61: { pais: "Francia", competicion: "Ligue 1" },
  62: { pais: "Francia", competicion: "Ligue 2" },
  66: { pais: "Francia", competicion: "Coupe de France" },
  94: { pais: "Portugal", competicion: "Primeira Liga" },
  88: { pais: "Holanda", competicion: "Eredivisie" },
  144: { pais: "Bélgica", competicion: "Jupiler Pro League" },
  2: { pais: "Competición Europea", competicion: "Champions League" },
  3: { pais: "Competición Europea", competicion: "Europa League" },
  848: { pais: "Competición Europea", competicion: "Conference League" },
};

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    res.status(400).json({ error: "Falta el parámetro fecha (YYYY-MM-DD)" });
    return;
  }

  try {
    const respuesta = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${fecha}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
    );

    if (!respuesta.ok) {
      res.status(502).json({ error: "No se pudo consultar API-Football" });
      return;
    }

    const datos = await respuesta.json();

    // El plan gratuito de API-Football solo deja consultar un rango corto
    // alrededor de hoy (~ayer/hoy/mañana, comprobado a mano el 2026-08-07:
    // pedir una fecha fuera de rango responde 200 con datos.errors.plan en
    // vez de un código de error HTTP — mismo patrón que ya pasó con la key
    // que falta). Se lo decimos al frontend en vez de devolver una lista
    // vacía indistinguible de "no hay partidos ese día".
    if (datos.errors?.plan) {
      res.status(200).json({ partidos: [], fueraDeRango: true });
      return;
    }

    const partidos = (datos.response ?? [])
      .filter((p) => LIGAS[p.league.id])
      .map((p) => ({
        id: p.fixture.id,
        evento: `${p.teams.home.name} - ${p.teams.away.name}`,
        pais: LIGAS[p.league.id].pais,
        competicion: LIGAS[p.league.id].competicion,
        fecha: p.fixture.date.slice(0, 10),
      }));

    // Deja que Vercel cachee esta respuesta un rato (misma fecha = mismo
    // resultado): así, aunque dos pestañas o dos visitas distintas pidan el
    // mismo día, no hace falta llamar otra vez a API-Football.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ partidos });
  } catch {
    res.status(502).json({ error: "No se pudo consultar API-Football" });
  }
}
