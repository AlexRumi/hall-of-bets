// Serverless Function de Vercel: se ejecuta en el servidor de Vercel,
// nunca en el navegador, así que aquí sí se puede usar la API key
// secreta de GOAL API sin exponerla. El frontend solo llama a esta ruta
// (/api/partidos?fecha=YYYY-MM-DD), nunca a GOAL API directamente.
//
// Migrado de API-Football a GOAL API el 2026-09-03 (cuenta de
// API-Football suspendida sin fecha de reactivación — ver
// CHANGELOG.md). El código anterior se conserva completo, en pausa, en
// api/_lib/proveedorApiFootball/partidos.js. Mismo contrato de
// respuesta que antes (partidos/fueraDeRango/cuotaAgotada/
// cuentaSuspendida/errorApi) para que usePartidos.js no necesite
// ningún cambio.
//
// Se filtran estas competiciones (LIGAS, en api/_lib/goalApi.js); el
// resto de partidos del mundo que devuelve GOAL API para ese día se
// descartan.
import { goalFetch, LIGAS, estadoCorto } from "./_lib/goalApi.js";
import { permiteLlamadaGoalApi } from "./_lib/limitadorGoalApi.js";

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    res.status(400).json({ error: "Falta el parámetro fecha (YYYY-MM-DD)" });
    return;
  }

  try {
    // GOAL API no filtra por país/liga en el propio endpoint (comprobado
    // a mano: el parámetro "country" no hace nada) — hay que pedir TODOS
    // los partidos del mundo de ese día (from=to=fecha es el único filtro
    // de fecha que de verdad funciona, "date=" no filtra nada) y filtrar
    // aquí por LIGAS, igual que se hacía con API-Football. Son unos
    // 150-200 partidos/día en total, así que hace falta paginar — cada
    // página es una llamada real, así que cada una pasa por el límite
    // propio (ver _lib/limitadorGoalApi.js), no solo la primera.
    let partidosGoal = [];
    let offset = 0;
    const LIMITE_PAGINA = 100;
    // Tope de páginas por si acaso, para no quedarse en un bucle infinito
    // si "hasMore" viniera mal — con ~200 partidos/día, 10 páginas de 100
    // es más que de sobra.
    for (let pagina = 0; pagina < 10; pagina++) {
      if (!(await permiteLlamadaGoalApi())) {
        res.status(200).json({ partidos: [] });
        return;
      }
      const datos = await goalFetch("/fixtures", {
        from: fecha,
        to: fecha,
        limit: LIMITE_PAGINA,
        offset,
      });
      partidosGoal = partidosGoal.concat(datos.data ?? []);
      if (!datos.pagination?.hasMore) break;
      offset += LIMITE_PAGINA;
    }

    const partidos = partidosGoal
      // Orden cronológico (hora de verdad, no solo fecha).
      .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
      .filter((p) => LIGAS[p.leagueId])
      .map((p) => ({
        id: p.id,
        evento: `${p.homeTeamName} - ${p.awayTeamName}`,
        pais: LIGAS[p.leagueId].pais,
        competicion: LIGAS[p.leagueId].competicion,
        temporal: !!LIGAS[p.leagueId].temporal,
        fecha: p.matchDate,
        hora: p.matchTime,
        estado: estadoCorto(p.matchStatus),
        golesLocal: p.homeTeamScore != null ? Number(p.homeTeamScore) : null,
        golesVisitante: p.awayTeamScore != null ? Number(p.awayTeamScore) : null,
        // Ids de equipo (no del partido): alimentan /api/jugadores. Son
        // strings de GOAL, no números como antes con API-Football.
        equipoLocalId: p.homeTeamId,
        equipoVisitanteId: p.awayTeamId,
        // Escudo ya como URL completa (GOAL la da hecha) — a diferencia
        // de API-Football, no hace falta reconstruirla a partir del id.
        escudoLocal: p.teamHomeBadge ?? null,
        escudoVisitante: p.teamAwayBadge ?? null,
      }));

    // Deja que Vercel cachee esta respuesta un rato (misma fecha = mismo
    // resultado), mismo criterio que antes: hoy con caché corta (los
    // partidos de hoy cambian de estado durante el día), otros días con
    // caché larga.
    const hoyMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
    res.setHeader(
      "Cache-Control",
      fecha === hoyMadrid
        ? "s-maxage=120, stale-while-revalidate=300"
        : "s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).json({ partidos });
  } catch (error) {
    // Igual que antes: cualquier error no reconocido se registra y se
    // avisa como genérico en vez de mentir con un motivo concreto.
    console.error("api/partidos: error no identificado de GOAL API", error);
    res.status(200).json({ partidos: [], errorApi: true });
  }
}
