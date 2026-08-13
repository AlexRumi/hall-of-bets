import { agruparSeleccionesPorPartido, horaInicioPartido, ESTADOS_TERMINADOS_PARTIDO } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { calcularNumerosPorCategoria, ETIQUETAS_CATEGORIA } from "./_lib/numeracion.js";
import { tg, escapeHtml, URL_APP } from "./_lib/telegram.js";
import { guardarMensajeApuesta } from "./_lib/telegramMensajes.js";

// Serverless Function pensada para un cron EXTERNO (cron-job.org, cada 15
// min recomendado) — Vercel Hobby solo deja programar sus propios cron
// jobs una vez al día, insuficiente para avisar poco después de que
// termine un partido. Nada le impide a un servicio externo llamar a esta
// URL con más frecuencia; Vercel no distingue esa petición de cualquier
// visita normal. Protegida con AVISOS_CRON_SECRET (query param) en vez de
// TELEGRAM_OWNER_ID/secret_token del webhook, porque quien llama no es
// Telegram.
//
// Margen propio, más corto que el de la app (2,5h en usePartidoInfo.js):
// ahí da igual tardar más porque solo se consulta cuando el usuario abre el
// detalle a mano, pero aquí sí importa avisar pronto. Un partido normal
// (90 min + 1-2' de añadido en la 1ª parte + 5-6' en la 2ª + 15-17' de
// descanso) termina sobre los 111-115' desde el inicio, más 1-5' que suele
// tardar la propia API-Football en certificar el estado "terminado" tras
// el pitido final — 2h05 (125 min) cubre ambas cosas con un poco de aire,
// sin disparar una segunda llamada de más en la mayoría de los casos. Si
// no ha terminado a esa hora (caso raro: prórroga, sin partidos así por
// ahora), se sigue revisando cada tick del cron hasta que sí lo esté —
// igual que ya pasaba antes, solo que empezando antes.
const MARGEN_AVISO_MS = 125 * 60 * 1000;

// ESTADOS_TERMINADOS_PARTIDO viene de src/utils/apuestas.js (compartido con
// usePartidoInfo.js), no se reimplementa aquí. La caché de resultados
// (resultados_partidos) sigue siendo por PARTIDO (compartida entre todas
// las apuestas que lo mencionen): un partido en 5 apuestas a la vez sigue
// costando como mucho 1 llamada a la API de fútbol, sea cual sea el número
// de avisos que acabe mandando.
//
// Petición directa: un partido puede estar en varias apuestas pendientes a
// la vez (de la misma categoría o de categorías distintas) — en vez de un
// aviso combinado, se manda un mensaje POR APUESTA, centrado en ella (con
// su número, su categoría, y la lista completa de sus partidos marcando
// cuáles ya han terminado). Por eso "ya avisado" ya no se puede guardar
// solo por partido (un partido puede necesitar avisar a varias apuestas
// distintas) — se guarda en la propia selección líder de cada partido
// dentro de cada apuesta (grupo.avisoEnviado), mismo patrón que
// golesLocalManual: un campo más en el jsonb, sin migración de esquema.

// Texto del aviso de UNA apuesta: título con el partido que acaba de
// disparar este mensaje en concreto, y debajo la lista de TODOS los
// partidos de la apuesta — 🏁 + marcador los que ya se sabe que han
// terminado (incluidos los detectados en avisos anteriores, no solo el
// nuevo), 🕐 + hora de inicio los demás. Así cada mensaje dice a la vez
// "qué ha cambiado" y "cómo va todo", sin tener que abrir la apuesta para
// saberlo. Petición directa: mostrar el marcador real (no solo "terminado")
// y la hora de los que faltan por jugar, en vez de solo el icono suelto.
function renderAviso(apuesta, grupos, grupoDisparador, cachePorId, numero) {
  const lineas = [
    `🎯 <b>Apuesta nº${numero} · ${ETIQUETAS_CATEGORIA[apuesta.categoria] ?? apuesta.categoria}</b>`,
    `⚽ <b>${escapeHtml(grupoDisparador.evento)} ha terminado</b>`,
    "",
  ];
  for (const grupo of grupos) {
    const enCache = grupo.partidoId && cachePorId.get(grupo.partidoId);
    if (enCache) {
      lineas.push(
        `🏁 ${escapeHtml(grupo.evento)} — <b>${enCache.goles_local}-${enCache.goles_visitante}</b>`
      );
    } else {
      lineas.push(`🕐 ${escapeHtml(grupo.evento)}${grupo.hora ? ` — ${escapeHtml(grupo.hora)}` : ""}`);
    }
  }
  return lineas.join("\n");
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
  if (!pendientes?.length) {
    res.status(200).json({ comprobados: 0, avisados: 0 });
    return;
  }

  // Grupos por apuesta (una sola vez), más el conjunto de todos los
  // partidoId referenciados (para pedir su caché de golpe) y cuáles de
  // ellos ya han pasado el margen (candidatos a comprobar de verdad).
  const gruposPorApuesta = new Map();
  const idsPartidosTotales = new Set();
  const idsElegibles = new Set();
  const ahora = Date.now();

  for (const apuesta of pendientes) {
    const grupos = agruparSeleccionesPorPartido(apuesta.selecciones);
    gruposPorApuesta.set(apuesta.id, grupos);
    for (const grupo of grupos) {
      if (!grupo.partidoId) continue;
      idsPartidosTotales.add(grupo.partidoId);
      const horaInicioMs = horaInicioPartido(grupo.fecha ?? apuesta.fecha, grupo.hora);
      if (horaInicioMs && ahora >= horaInicioMs + MARGEN_AVISO_MS) {
        idsElegibles.add(grupo.partidoId);
      }
    }
  }

  if (idsPartidosTotales.size === 0) {
    res.status(200).json({ comprobados: 0, avisados: 0 });
    return;
  }

  const { data: enCache } = await supabaseAdmin
    .from("resultados_partidos")
    .select("partido_id, estado, goles_local, goles_visitante")
    .in("partido_id", [...idsPartidosTotales]);
  // Solo se guardan aquí partidos ya terminados (ver usePartidoInfo.js), así
  // que estar en esta caché ya implica "terminado" — no hace falta volver a
  // comprobar el estado.
  const cachePorId = new Map((enCache ?? []).map((fila) => [fila.partido_id, fila]));

  let comprobados = 0;
  for (const partidoId of idsElegibles) {
    if (cachePorId.has(partidoId)) continue;
    comprobados++;
    try {
      const respuesta = await fetch(`${URL_APP}/api/partido?id=${partidoId}`);
      const datos = respuesta.ok ? await respuesta.json() : { partido: null };
      const info = datos.partido;
      if (info && ESTADOS_TERMINADOS_PARTIDO.has(info.estado)) {
        await supabaseAdmin.from("resultados_partidos").upsert({
          partido_id: partidoId,
          estado: info.estado,
          goles_local: info.golesLocal,
          goles_visitante: info.golesVisitante,
        });
        cachePorId.set(partidoId, {
          partido_id: partidoId,
          estado: info.estado,
          goles_local: info.golesLocal,
          goles_visitante: info.golesVisitante,
        });
      }
    } catch (fetchError) {
      console.error("telegram-avisos /api/partido", partidoId, fetchError);
    }
  }

  const numerosPorId = await calcularNumerosPorCategoria(supabaseAdmin);
  let avisados = 0;

  for (const apuesta of pendientes) {
    const grupos = gruposPorApuesta.get(apuesta.id);
    let selecciones = apuesta.selecciones;
    let cambiada = false;

    for (const grupo of grupos) {
      if (!grupo.partidoId || !cachePorId.has(grupo.partidoId)) continue;
      if (selecciones[grupo.indiceLider]?.avisoEnviado) continue;

      let enviado;
      try {
        enviado = await tg("sendMessage", {
          chat_id: process.env.TELEGRAM_OWNER_ID,
          text: renderAviso(apuesta, grupos, grupo, cachePorId, numerosPorId.get(apuesta.id) ?? "?"),
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📱 Ver apuesta", web_app: { url: `${URL_APP}/telegram/apuesta/${apuesta.id}` } }],
            ],
          },
        });
      } catch (envioError) {
        console.error("telegram-avisos: fallo de red al enviar", apuesta.id, grupo.partidoId, envioError);
        continue; // no se marca avisoEnviado: se reintenta en el siguiente tick del cron
      }

      // Si Telegram rechazó el mensaje (ok: false), tampoco se marca como
      // enviado — de lo contrario nunca se volvería a intentar y el aviso
      // se perdería para siempre.
      if (!enviado.ok) continue;

      await guardarMensajeApuesta(supabaseAdmin, apuesta.id, process.env.TELEGRAM_OWNER_ID, enviado.result.message_id);

      selecciones = selecciones.map((s, i) => (i === grupo.indiceLider ? { ...s, avisoEnviado: true } : s));
      cambiada = true;
      avisados++;
    }

    if (cambiada) {
      // Si esto falla, el mensaje ya se envió pero "avisoEnviado" no queda
      // guardado — el siguiente tick lo reintentaría y llegaría un aviso
      // duplicado. Poco probable, pero mejor dejarlo en el log que
      // tragárselo en silencio.
      const { error: errorGuardado } = await supabaseAdmin
        .from("apuestas")
        .update({ selecciones })
        .eq("id", apuesta.id);
      if (errorGuardado) {
        console.error("telegram-avisos: no se pudo guardar avisoEnviado", apuesta.id, errorGuardado);
      }
    }
  }

  res.status(200).json({ comprobados, avisados });
}
