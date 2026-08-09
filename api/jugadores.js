// Serverless Function de Vercel, mismo motivo que api/partidos.js: la key
// de API-Football es secreta y aquí sí se puede usar sin exponerla. Sirve
// la plantilla de un equipo (players/squads) para el desplegable de
// jugador de la categoría "Jugador" en SelectorMercado.jsx.
//
// A diferencia de los partidos (que cambian cada día), una plantilla
// apenas cambia entre visitas, así que aquí no hace falta ninguna lógica
// de "fuera de rango" ni de refresco diario: se pide sin más y se deja
// que tanto Vercel (Cache-Control) como el navegador (usePlantilla.js)
// la guarden bastante tiempo.
export default async function handler(req, res) {
  const { equipo } = req.query;

  if (!equipo || !/^\d+$/.test(equipo)) {
    res.status(400).json({ error: "Falta el parámetro equipo (id numérico)" });
    return;
  }

  try {
    const respuesta = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${equipo}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
    );

    if (!respuesta.ok) {
      res.status(502).json({ error: "No se pudo consultar API-Football" });
      return;
    }

    const datos = await respuesta.json();
    const jugadores = (datos.response?.[0]?.players ?? []).map((j) => ({
      id: j.id,
      nombre: j.name,
    }));

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ jugadores });
  } catch {
    res.status(502).json({ error: "No se pudo consultar API-Football" });
  }
}
