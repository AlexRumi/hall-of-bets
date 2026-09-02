import { crearSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { permiteLlamadaApiFootball } from "./_lib/limitadorApiFootball.js";

// Serverless Function de Vercel, mismo motivo que api/partidos.js: la key
// de API-Football es secreta y aquí sí se puede usar sin exponerla. Sirve
// la plantilla de un equipo (players/squads) para el desplegable de
// jugador de la categoría "Jugador" en SelectorMercado.jsx.
//
// Caché compartida en Supabase (tabla "plantillas_equipos") — mismo
// patrón que "resultados_partidos" para el marcador final de un partido:
// una vez pedida la de un equipo, nadie —ni tú, ni tu amigo, ni un
// dispositivo nuevo— vuelve a gastar una llamada real por ese mismo
// equipo hasta que la caché caduque. Antes esto solo se cacheaba en
// memoria del navegador (usePlantilla.js), es decir, por PESTAÑA: cada
// dispositivo/sesión nueva la volvía a pedir de cero.
//
// Caduca a los 30 días (no es permanente del todo): un equipo puede
// fichar o vender jugadores en el mercado de invierno/verano, y una
// plantilla desactualizada para siempre sería un problema real para
// apostar (un jugador que ya no está en el equipo seguiría apareciendo
// como opción). 30 días sigue siendo una llamada insignificante al mes
// por equipo, muy lejos de cualquier límite.
const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const { equipo } = req.query;

  if (!equipo || !/^\d+$/.test(equipo)) {
    res.status(400).json({ error: "Falta el parámetro equipo (id numérico)" });
    return;
  }

  const equipoId = Number(equipo);
  const supabaseAdmin = crearSupabaseAdmin();

  const { data: enCache } = await supabaseAdmin
    .from("plantillas_equipos")
    .select("jugadores, actualizado_en")
    .eq("equipo_id", equipoId)
    .maybeSingle();

  const cacheValida =
    enCache && Date.now() - new Date(enCache.actualizado_en).getTime() < TREINTA_DIAS_MS;

  if (cacheValida) {
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ jugadores: enCache.jugadores });
    return;
  }

  // Límite propio antes de gastar cuota real (ver _lib/limitadorApiFootball.js)
  // — nunca deja salir más de 8 peticiones/minuto a la API de verdad, pase
  // lo que pase en el resto del código (esto es justo lo que faltaba
  // cuando una docena de tarjetas de mercado pedían la misma plantilla a
  // la vez).
  if (!(await permiteLlamadaApiFootball())) {
    res.status(200).json({ jugadores: [] });
    return;
  }

  try {
    const respuesta = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${equipoId}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
    );

    if (!respuesta.ok) {
      res.status(502).json({ error: "No se pudo consultar API-Football" });
      return;
    }

    const datos = await respuesta.json();
    // "position" ya viene en la misma respuesta de /players/squads (no
    // cuesta ninguna llamada aparte) — se expone como "posicion" para que
    // SelectorMercado.jsx pueda excluir/mostrar solo porteros según el
    // mercado (Paradas del portero vs Remates/Faltas/Entradas/Anotará...).
    // Valor tal cual lo da API-Football (en inglés, "Goalkeeper" para
    // porteros) — sin verificar a mano contra la cuenta real todavía.
    const jugadores = (datos.response?.[0]?.players ?? []).map((j) => ({
      id: j.id,
      nombre: j.name,
      posicion: j.position ?? null,
    }));

    // Se guarda en la caché compartida (con la fecha de hoy, para que la
    // caducidad de 30 días cuente desde AHORA, no desde la primera vez que
    // se guardó) — la próxima vez que alguien pida este equipo, ya no hace
    // falta ninguna llamada nueva hasta que vuelva a caducar. Si vino
    // vacío (equipo sin datos en API-Football) no se guarda, para
    // reintentarlo más adelante.
    if (jugadores.length > 0) {
      await supabaseAdmin
        .from("plantillas_equipos")
        .upsert({ equipo_id: equipoId, jugadores, actualizado_en: new Date().toISOString() });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ jugadores });
  } catch {
    res.status(502).json({ error: "No se pudo consultar API-Football" });
  }
}
