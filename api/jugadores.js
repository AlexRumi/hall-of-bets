import { crearSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { goalFetch } from "./_lib/goalApi.js";
import { permiteLlamadaGoalApi } from "./_lib/limitadorGoalApi.js";

// Serverless Function de Vercel, mismo motivo que api/partidos.js: la
// key de GOAL API es secreta y aquí sí se puede usar sin exponerla.
// Sirve la plantilla de un equipo para el desplegable de jugador de la
// categoría "Jugador" en SelectorMercado.jsx.
//
// Migrado de API-Football a GOAL API el 2026-09-03 (ver
// api/partidos.js y CHANGELOG.md). Código anterior conservado en
// api/_lib/proveedorApiFootball/jugadores.js. Mismo contrato de
// respuesta ({ jugadores }) y misma caché compartida en Supabase
// ("plantillas_equipos") que antes — el "equipo" ahora es un id-string
// de GOAL en vez de un número, por eso la columna equipo_id pasó a
// "text" (ver supabase-setup.sql).
//
// Caduca a los 30 días, mismo motivo que antes: un equipo puede fichar
// o vender jugadores en el mercado de invierno/verano.
const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const { equipo } = req.query;

  if (!equipo) {
    res.status(400).json({ error: "Falta el parámetro equipo (id de GOAL API)" });
    return;
  }

  const supabaseAdmin = crearSupabaseAdmin();

  const { data: enCache } = await supabaseAdmin
    .from("plantillas_equipos")
    .select("jugadores, actualizado_en")
    .eq("equipo_id", equipo)
    .maybeSingle();

  const cacheValida =
    enCache && Date.now() - new Date(enCache.actualizado_en).getTime() < TREINTA_DIAS_MS;

  if (cacheValida) {
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ jugadores: enCache.jugadores });
    return;
  }

  // Límite propio antes de gastar cuota real (ver _lib/limitadorGoalApi.js).
  if (!(await permiteLlamadaGoalApi())) {
    res.status(200).json({ jugadores: [] });
    return;
  }

  try {
    const datos = await goalFetch(`/teams/${equipo}/players`);

    // "type" ya viene en la misma respuesta (no cuesta ninguna llamada
    // aparte) — se expone como "posicion" para que SelectorMercado.jsx
    // pueda excluir/mostrar solo porteros según el mercado. Valor tal
    // cual lo da GOAL API (en inglés, "Goalkeepers" para porteros) — sin
    // verificar a mano contra todos los casos todavía, mismo criterio de
    // cautela que ya tenía esto con API-Football.
    const jugadores = (datos.data ?? []).map((j) => ({
      id: j.id,
      nombre: j.name,
      posicion: j.type ?? null,
    }));

    // Se guarda en la caché compartida (con la fecha de hoy, para que la
    // caducidad de 30 días cuente desde AHORA) — si vino vacío (equipo
    // sin datos en GOAL API) no se guarda, para reintentarlo más adelante.
    if (jugadores.length > 0) {
      await supabaseAdmin
        .from("plantillas_equipos")
        .upsert({ equipo_id: equipo, jugadores, actualizado_en: new Date().toISOString() });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ jugadores });
  } catch (error) {
    console.error("api/jugadores: error no identificado de GOAL API", error);
    res.status(502).json({ error: "No se pudo consultar GOAL API" });
  }
}
