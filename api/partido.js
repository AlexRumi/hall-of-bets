import { goalFetch, estadoCorto } from "./_lib/goalApi.js";
import { permiteLlamadaGoalApi } from "./_lib/limitadorGoalApi.js";

// Serverless Function de Vercel, mismo motivo que api/partidos.js y
// api/jugadores.js. Da la hora/estado/resultado de UN partido concreto
// (por su id, ya guardado en cada selección elegida desde el buscador),
// para pintarlo en la esquina del detalle de la apuesta
// (ApuestaItem.jsx), estilo "ticket" de casa de apuestas.
//
// Migrado de API-Football a GOAL API el 2026-09-03 (ver api/partidos.js
// y CHANGELOG.md). Código anterior conservado en
// api/_lib/proveedorApiFootball/partido.js. Mismo contrato de
// respuesta ({ partido }) que antes — GOAL API no tiene la restricción
// de rango de fechas que sí tenía el plan gratuito de API-Football para
// pedir por id, así que esto sigue funcionando para cualquier apuesta
// con partido conectado, sea de la fecha que sea.
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: "Falta el parámetro id (id de GOAL API)" });
    return;
  }

  // Límite propio antes de gastar cuota real (ver _lib/limitadorGoalApi.js).
  if (!(await permiteLlamadaGoalApi())) {
    res.status(200).json({ partido: null });
    return;
  }

  try {
    const datos = await goalFetch(`/fixtures/${id}`);
    const partido = datos.data;

    if (!partido) {
      res.status(200).json({ partido: null });
      return;
    }

    // usePartidoInfo.js ya solo pide una vez por partido y visita (sin
    // "en directo") — esta caché es solo para que recargar la página o
    // abrir el detalle en otra pestaña poco después no cuente como una
    // petición nueva.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    res.status(200).json({
      partido: {
        hora: partido.matchTime,
        estado: estadoCorto(partido.matchStatus),
        golesLocal: partido.homeTeamScore != null ? Number(partido.homeTeamScore) : null,
        golesVisitante: partido.awayTeamScore != null ? Number(partido.awayTeamScore) : null,
      },
    });
  } catch (error) {
    console.error("api/partido: error no identificado de GOAL API", error);
    res.status(200).json({ partido: null });
  }
}
