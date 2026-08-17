import { agruparSeleccionesPorPartido, horaInicioPartido, ESTADOS_TERMINADOS_PARTIDO } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { calcularNumerosPorCategoria, ETIQUETAS_CATEGORIA } from "./_lib/numeracion.js";
import { tg, escapeHtml, URL_APP, iconoDeporte } from "./_lib/telegram.js";
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
// descanso) termina sobre los 111-115' desde el inicio — 2h (120 min)
// cubre eso con un margen pequeño, sin la holgura extra para la
// certificación de la API que se probó antes (125 min): petición directa,
// prefieres el aviso algo antes aunque alguna vez toque esperar un tick
// más del cron si la API tarda un poco en certificarlo. Si no ha
// terminado a esa hora (caso raro: prórroga), se sigue revisando cada
// tick del cron hasta que sí lo esté.
const MARGEN_AVISO_MS = 120 * 60 * 1000;

// ESTADOS_TERMINADOS_PARTIDO viene de src/utils/apuestas.js (compartido con
// usePartidoInfo.js), no se reimplementa aquí. La caché de resultados
// (resultados_partidos) sigue siendo por PARTIDO (compartida entre todas
// las apuestas que lo mencionen): un partido en 5 apuestas a la vez sigue
// costando como mucho 1 llamada a la API de fútbol, sea cual sea el número
// de avisos que acabe mandando.
//
// Petición directa: un partido puede estar en varias apuestas pendientes a
// la vez (de la misma categoría o de categorías distintas) — en vez de un
// aviso combinado entre apuestas distintas, se manda un mensaje POR
// APUESTA (con su número, su categoría y el marcador de todos sus
// partidos) — pero uno solo por apuesta, esperando a que TODOS sus
// partidos hayan terminado, no uno por cada partido que va acabando
// (petición directa, tras probarlo en real: avisar partido a partido
// generaba muchos mensajes seguidos en combinadas). "Ya avisado" se
// guarda en la selección líder de cada partido dentro de la apuesta
// (grupo.avisoEnviado), mismo patrón que golesLocalManual — ahora se
// marcan todas las líderes de la apuesta a la vez, en el mismo envío.

// Texto del aviso: uno solo por apuesta, cuando TODOS sus partidos han
// terminado — título genérico ("ya puedes confirmarla") en vez de nombrar
// un partido concreto, y debajo el marcador real de cada uno con el icono
// del deporte de la apuesta (mismo para todos sus partidos, sustituye a
// la bandera de cuadros — petición directa).
function renderAviso(apuesta, grupos, cachePorId, numero) {
  const icono = iconoDeporte(apuesta.deporte);
  const lineas = [
    `🎯 <b>Apuesta nº${numero} · ${ETIQUETAS_CATEGORIA[apuesta.categoria] ?? apuesta.categoria}</b>`,
    "",
    `📝 <b>Ya puedes confirmarla — todos sus partidos han terminado</b>`,
    "",
  ];
  for (const grupo of grupos) {
    const enCache = grupo.partidoId && cachePorId.get(grupo.partidoId);
    if (enCache) {
      lineas.push(`${icono} ${escapeHtml(grupo.evento)} — <b>${enCache.goles_local}-${enCache.goles_visitante}</b>`);
    } else {
      lineas.push(`${icono} ${escapeHtml(grupo.evento)}`);
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
    const gruposConPartido = grupos.filter((g) => g.partidoId);
    // Sin ningún partido enlazado al buscador no hay forma de saber cuándo
    // ha terminado — esta apuesta nunca generará aviso automático.
    if (gruposConPartido.length === 0) continue;
    // Todas las líderes se marcan a la vez (ver más abajo): basta con
    // comprobar la primera para saber si esta apuesta ya se avisó entera.
    if (apuesta.selecciones[grupos[0].indiceLider]?.avisoEnviado) continue;

    const todosTerminados = gruposConPartido.every((g) => cachePorId.has(g.partidoId));
    if (!todosTerminados) continue;

    let enviado;
    try {
      // Sin botón "Ver apuesta" (petición directa: ya no se resuelve desde
      // la Mini App, así que aquí no aportaba nada) — texto plano, igual
      // que el aviso de registro.
      enviado = await tg("sendMessage", {
        chat_id: process.env.TELEGRAM_OWNER_ID,
        text: renderAviso(apuesta, grupos, cachePorId, numerosPorId.get(apuesta.id) ?? "?"),
        parse_mode: "HTML",
      });
    } catch (envioError) {
      console.error("telegram-avisos: fallo de red al enviar", apuesta.id, envioError);
      continue; // no se marca avisoEnviado: se reintenta en el siguiente tick del cron
    }

    // Si Telegram rechazó el mensaje (ok: false), tampoco se marca como
    // enviado — de lo contrario nunca se volvería a intentar y el aviso
    // se perdería para siempre.
    if (!enviado.ok) continue;

    await guardarMensajeApuesta(supabaseAdmin, apuesta.id, process.env.TELEGRAM_OWNER_ID, enviado.result.message_id, "aviso");
    avisados++;

    const indicesLider = new Set(grupos.map((g) => g.indiceLider));
    const selecciones = apuesta.selecciones.map((s, i) => (indicesLider.has(i) ? { ...s, avisoEnviado: true } : s));

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

  res.status(200).json({ comprobados, avisados });
}
