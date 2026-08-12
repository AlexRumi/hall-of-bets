import { agruparSeleccionesPorPartido, horaInicioPartido, MARGEN_RESULTADO_MS, ESTADOS_TERMINADOS_PARTIDO } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";

// Serverless Function pensada para un cron EXTERNO (cron-job.org, cada 15
// min recomendado) — Vercel Hobby solo deja programar sus propios cron
// jobs una vez al día, insuficiente para avisar poco después de que
// termine un partido. Nada le impide a un servicio externo llamar a esta
// URL con más frecuencia; Vercel no distingue esa petición de cualquier
// visita normal. Protegida con AVISOS_CRON_SECRET (query param) en vez de
// TELEGRAM_OWNER_ID/secret_token del webhook, porque quien llama no es
// Telegram.
//
// Mismo criterio que usePartidoInfo.js para decidir cuándo mirar (margen
// de 2,5h tras la hora de inicio) y qué guardar en la caché compartida
// (resultados_partidos) — MARGEN_RESULTADO_MS/ESTADOS_TERMINADOS_PARTIDO
// vienen de src/utils/apuestas.js, no se reimplementan aquí. La única
// pieza nueva es la columna "notificado" de esa misma tabla, para saber
// si ya se mandó el aviso de un partido y no repetirlo en cada revisión.
//
// Un partido puede estar en varias apuestas pendientes a la vez (petición
// directa: "algunos partidos repetidos entre apuestas") — se agrupa por
// partidoId para gastar como mucho 1 llamada a la API de fútbol por
// partido y mandar un único aviso con un botón por cada apuesta afectada,
// no un aviso repetido por cada una.

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const URL_APP = "https://hall-of-bets.vercel.app";

async function tg(method, payload) {
  const respuesta = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return respuesta.json();
}

function escapeHtml(texto = "") {
  return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default async function handler(req, res) {
  if (req.query.secret !== process.env.AVISOS_CRON_SECRET) {
    res.status(401).end();
    return;
  }

  const supabaseAdmin = crearSupabaseAdmin();

  const { data: pendientes, error } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("user_id", USER_ID)
    .eq("resultado", "pendiente");

  if (error) {
    console.error("telegram-avisos", error);
    res.status(500).json({ error: error.message });
    return;
  }

  // Un partido → todas las apuestas pendientes (con su evento) que lo
  // referencian y cuyo margen ya ha pasado. Si el mismo partido aparece en
  // varias apuestas, todas se agrupan bajo el mismo partidoId.
  const partidosPorId = new Map();
  const ahora = Date.now();
  for (const apuesta of pendientes ?? []) {
    for (const grupo of agruparSeleccionesPorPartido(apuesta.selecciones)) {
      if (!grupo.partidoId) continue;
      const horaInicioMs = horaInicioPartido(grupo.fecha ?? apuesta.fecha, grupo.hora);
      if (!horaInicioMs || ahora < horaInicioMs + MARGEN_RESULTADO_MS) continue;
      if (!partidosPorId.has(grupo.partidoId)) partidosPorId.set(grupo.partidoId, []);
      partidosPorId.get(grupo.partidoId).push({ apuestaId: apuesta.id, evento: grupo.evento });
    }
  }

  if (partidosPorId.size === 0) {
    res.status(200).json({ comprobados: 0, avisados: 0 });
    return;
  }

  const idsPartidos = [...partidosPorId.keys()];
  const { data: enCache } = await supabaseAdmin
    .from("resultados_partidos")
    .select("partido_id, estado, notificado")
    .in("partido_id", idsPartidos);
  const cachePorId = new Map((enCache ?? []).map((fila) => [fila.partido_id, fila]));

  let avisados = 0;

  for (const [partidoId, referencias] of partidosPorId) {
    const cacheado = cachePorId.get(partidoId);
    if (cacheado?.notificado) continue;

    let estado = cacheado?.estado;
    let golesLocal;
    let golesVisitante;

    if (!cacheado) {
      try {
        const respuesta = await fetch(`${URL_APP}/api/partido?id=${partidoId}`);
        const datos = respuesta.ok ? await respuesta.json() : { partido: null };
        const info = datos.partido;
        if (!info || !ESTADOS_TERMINADOS_PARTIDO.has(info.estado)) continue;
        estado = info.estado;
        golesLocal = info.golesLocal;
        golesVisitante = info.golesVisitante;
      } catch (fetchError) {
        console.error("telegram-avisos /api/partido", partidoId, fetchError);
        continue;
      }
    }

    // Marca este partido como avisado (y guarda el resultado si es la
    // primera vez que se detecta terminado) — para no volver a preguntar
    // ni a avisar de él nunca más.
    await supabaseAdmin.from("resultados_partidos").upsert({
      partido_id: partidoId,
      estado,
      ...(golesLocal !== undefined ? { goles_local: golesLocal, goles_visitante: golesVisitante } : {}),
      notificado: true,
    });

    const filas = referencias.map((r) => [
      { text: `📱 ${r.evento}`, web_app: { url: `${URL_APP}/telegram/apuesta/${r.apuestaId}` } },
    ]);
    await tg("sendMessage", {
      chat_id: process.env.TELEGRAM_OWNER_ID,
      text: `⚽ <b>${escapeHtml(referencias[0].evento)}</b> ha terminado.\nYa puedes confirmar tu apuesta.`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: filas },
    });
    avisados++;
  }

  res.status(200).json({ comprobados: partidosPorId.size, avisados });
}
