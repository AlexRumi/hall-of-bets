import { goalFetch, estadoCorto, fechaHoraMadrid } from "./_lib/goalApi.js";
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

  // Bug real (2026-09-03): los ids de GOAL son cuids alfanuméricos; un id
  // puramente numérico solo puede venir de una apuesta guardada ANTES de
  // la migración (fixture de API-Football). GOAL API reutiliza esos
  // mismos números como su propio campo interno "apiId" — comprobado a
  // mano que un id así puede "acertar" por pura coincidencia un partido
  // de GOAL sin relación ninguna con el real, y devolver su resultado
  // como si fuera el bueno. Mejor no preguntar nada que arriesgarse a
  // devolver un marcador falso (frontend ya filtra esto también, en
  // usePartidoInfo.js, pero conviene que este endpoint no dependa solo
  // de que el frontend lo haga bien).
  if (/^\d+$/.test(id)) {
    res.status(200).json({ partido: null });
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
        hora: fechaHoraMadrid(partido.kickoffUtc).hora,
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
