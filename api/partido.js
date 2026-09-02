import { permiteLlamadaApiFootball } from "./_lib/limitadorApiFootball.js";

// Serverless Function de Vercel, mismo motivo que api/partidos.js y
// api/jugadores.js: la key de API-Football es secreta y aquí sí se puede
// usar sin exponerla. Da la hora/estado/resultado de UN partido concreto
// (por su id, ya guardado en cada selección elegida desde el buscador —
// ver ConstructorPartido.jsx), para pintarlo en la esquina del detalle de
// la apuesta (ApuestaItem.jsx), estilo "ticket" de casa de apuestas.
//
// A diferencia de api/partidos.js (que pide por fecha, y el plan gratuito
// solo deja consultar un rango corto alrededor de hoy), pedir por id
// directamente NO tiene esa restricción — comprobado a mano el
// 2026-08-10: un partido de dos días antes del rango permitido respondió
// sin "errors.plan". Así que esto funciona para cualquier apuesta con
// partido conectado, sea de la fecha que sea (mientras API-Football siga
// teniendo el partido en su base de datos).
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || !/^\d+$/.test(id)) {
    res.status(400).json({ error: "Falta el parámetro id (numérico)" });
    return;
  }

  // Límite propio antes de gastar cuota real (ver _lib/limitadorApiFootball.js).
  if (!(await permiteLlamadaApiFootball())) {
    res.status(200).json({ partido: null });
    return;
  }

  try {
    const respuesta = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${id}&timezone=Europe/Madrid`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
    );

    if (!respuesta.ok) {
      res.status(502).json({ error: "No se pudo consultar API-Football" });
      return;
    }

    const datos = await respuesta.json();
    const partido = datos.response?.[0];

    if (!partido) {
      res.status(200).json({ partido: null });
      return;
    }

    // usePartidoInfo.js ya solo pide una vez por partido y visita (sin
    // "en directo", se descartó por cuota) — esta caché es solo para que
    // recargar la página o abrir el detalle en otra pestaña poco después
    // no cuente como una petición nueva a API-Football.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    res.status(200).json({
      partido: {
        hora: partido.fixture.date.slice(11, 16),
        estado: partido.fixture.status.short,
        golesLocal: partido.goals.home,
        golesVisitante: partido.goals.away,
      },
    });
  } catch {
    res.status(502).json({ error: "No se pudo consultar API-Football" });
  }
}
