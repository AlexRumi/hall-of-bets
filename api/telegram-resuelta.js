import { agruparSeleccionesPorPartido, calcularBeneficio, desdeFila } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { calcularNumerosPorCategoria, ETIQUETAS_CATEGORIA } from "./_lib/numeracion.js";
import { tg, escapeHtml, URL_APP, iconoDeporte } from "./_lib/telegram.js";
import { actualizarBotonesApuesta, guardarMensajeSuelto } from "./_lib/telegramMensajes.js";

// Serverless Function que recibe un segundo Database Webhook de Supabase
// (mismo mecanismo que api/telegram-registro.js, mismo REGISTRO_WEBHOOK_SECRET
// — pero evento UPDATE en vez de INSERT): en cuanto una apuesta deja de
// estar "pendiente" (la marcas Ganada/Perdida/Nula/Cash Out, desde donde
// sea — app, Mini App), manda un resumen con el marcador de cada partido y
// el beneficio, y edita el botón "Ver apuesta"/"Abrir apuesta" de todos los
// mensajes ya enviados de esa apuesta (api/_lib/telegramMensajes.js) para
// que reflejen el resultado en vez de quedarse siempre igual.
//
// Bug real: el ticket marca cada partido con una pastilla que cicla
// Pendiente→Ganada→Perdida→Nula (ApuestaItem.jsx) y escribe en Supabase en
// cada clic — como el ciclo siempre pasa primero por "Ganada", este aviso
// (que antes solo miraba la transición pendiente→resuelto) se disparaba con
// el resultado equivocado en el primer clic, y las correcciones
// siguientes (Ganada→Perdida) ya no volvían a avisar. Ahora dispara en
// CUALQUIER cambio de resultado mientras no sea "pendiente" — y en vez de
// mandar un mensaje nuevo cada vez (spam de mensajes contradictorios), EDITA
// el mismo mensaje de esta apuesta si ya existe uno (ver más abajo), así
// solo hay un mensaje que siempre refleja el último resultado.
//
// Petición directa: solo tiene sentido saber "ganada/perdida" DESPUÉS de
// que tú hayas marcado a mano todos los picks (V/X/- en la app o la Mini
// App) — la app nunca deduce sola si un pick acertó o no (la mayoría de
// mercados, tipo "+1.5 remates a puerta", no se pueden derivar del
// marcador final). Por eso este aviso no compite con el de "partido
// terminado" (api/telegram-avisos.js): ese avisa de que YA PUEDES marcar
// los picks; este avisa de que YA HAS TERMINADO de marcarlos.

const ETIQUETAS_RESULTADO = {
  ganada: "✅ ¡Apuesta ganada!",
  perdida: "❌ Apuesta perdida.",
  nula: "➖ Apuesta anulada.",
  cashout: "💰 Cash Out",
};

const TEXTO_BOTON = {
  ganada: "✅ Ganada",
  perdida: "❌ Perdida",
  nula: "➖ Nula",
  cashout: "💰 Cash Out",
};

function renderResuelta(apuestaCamel, grupos, cachePorId, numero) {
  const estadoTexto =
    apuestaCamel.resultado === "cashout" && apuestaCamel.cashoutImporte != null
      ? `${ETIQUETAS_RESULTADO.cashout}: ${apuestaCamel.cashoutImporte.toFixed(2)}€`
      : ETIQUETAS_RESULTADO[apuestaCamel.resultado] ?? apuestaCamel.resultado;
  const icono = iconoDeporte(apuestaCamel.deporte);

  const lineas = [
    `🎯 <b>Apuesta nº${numero} · ${ETIQUETAS_CATEGORIA[apuestaCamel.categoria] ?? apuestaCamel.categoria}</b>`,
    ...(apuestaCamel.titulo ? [`🏷 ${escapeHtml(apuestaCamel.titulo)}`] : []),
    "",
    `<b>${estadoTexto}</b>`,
    "",
    `${apuestaCamel.fecha} · ${escapeHtml(apuestaCamel.casa)} · ${
      grupos.length > 1 ? `Combinada (${grupos.length} partidos)` : "Simple"
    } · ${
      apuestaCamel.tipoFondos === "freebet"
        ? "Freebet"
        : apuestaCamel.tipoFondos === "mixta"
        ? "Mixta"
        : "Real"
    }`,
    "",
  ];

  for (const grupo of grupos) {
    const enCache = grupo.partidoId && cachePorId.get(grupo.partidoId);
    const hayManual = grupo.golesLocalManual != null && grupo.golesVisitanteManual != null;
    if (enCache) {
      lineas.push(`🏁 ${escapeHtml(grupo.evento)} — <b>${enCache.goles_local}-${enCache.goles_visitante}</b>`);
    } else if (hayManual) {
      lineas.push(`🏁 ${escapeHtml(grupo.evento)} — <b>${grupo.golesLocalManual}-${grupo.golesVisitanteManual}</b>`);
    } else {
      // Sin marcador (raro: solo si nunca se consultó/guardó el resultado
      // del partido) — no tiene sentido un reloj de "pendiente" aquí, la
      // apuesta ya está decidida; se enseña el icono del deporte en su
      // lugar (petición directa, detectado al probarlo de verdad).
      lineas.push(`${icono} ${escapeHtml(grupo.evento)}`);
    }
  }

  if (apuestaCamel.resultado !== "cashout") {
    const beneficio = calcularBeneficio(apuestaCamel);
    lineas.push("", `Beneficio: <b>${beneficio > 0 ? "+" : ""}${beneficio.toFixed(2)}€</b>`);
  }

  return lineas.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  if (req.headers["x-registro-secret"] !== process.env.REGISTRO_WEBHOOK_SECRET) {
    res.status(401).end();
    return;
  }

  const { record: fila, old_record: filaAnterior } = req.body ?? {};
  if (!fila || fila.user_id !== USER_ID) {
    res.status(200).json({ ok: true });
    return;
  }

  // Dispara en cualquier cambio de resultado mientras no sea "pendiente" —
  // no solo en la primera transición pendiente→resuelto (ver comentario de
  // arriba), pero tampoco en un UPDATE que no toca el resultado (editar la
  // apuesta ya resuelta, por ejemplo).
  if (fila.resultado === "pendiente" || fila.resultado === filaAnterior?.resultado) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const supabaseAdmin = crearSupabaseAdmin();
    const apuestaCamel = desdeFila(fila);
    const grupos = agruparSeleccionesPorPartido(apuestaCamel.selecciones);

    const idsPartidos = grupos.map((g) => g.partidoId).filter(Boolean);
    let cachePorId = new Map();
    if (idsPartidos.length > 0) {
      const { data: enCache } = await supabaseAdmin
        .from("resultados_partidos")
        .select("partido_id, goles_local, goles_visitante")
        .in("partido_id", idsPartidos);
      cachePorId = new Map((enCache ?? []).map((f) => [f.partido_id, f]));
    }

    const numerosPorId = await calcularNumerosPorCategoria(supabaseAdmin);
    const numero = numerosPorId.get(fila.id) ?? "?";

    const texto = renderResuelta(apuestaCamel, grupos, cachePorId, numero);
    const replyMarkup = {
      inline_keyboard: [[{ text: "📱 Ver apuesta", web_app: { url: `${URL_APP}/telegram/apuesta/${fila.id}` } }]],
    };

    // ¿Ya se había mandado un mensaje de "resuelta" para esta apuesta (una
    // corrección posterior, ver comentario de arriba)? Si sí, se EDITA en
    // vez de mandar uno nuevo — un solo mensaje por apuesta, siempre con el
    // último resultado.
    const { data: previo } = await supabaseAdmin
      .from("telegram_mensajes")
      .select("id, chat_id, message_id")
      .eq("apuesta_id", fila.id)
      .eq("tipo", "resuelta")
      .maybeSingle();

    let editadoOk = false;
    if (previo) {
      const editado = await tg("editMessageText", {
        chat_id: previo.chat_id,
        message_id: previo.message_id,
        text: texto,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      });
      editadoOk = editado.ok;
      if (!editado.ok) {
        // El mensaje ya no existe (borrado a mano, o por la limpieza
        // diaria) — se manda uno nuevo abajo y se sustituye el rastro.
        await supabaseAdmin.from("telegram_mensajes").delete().eq("id", previo.id);
      }
    }

    if (!editadoOk) {
      const enviado = await tg("sendMessage", {
        chat_id: process.env.TELEGRAM_OWNER_ID,
        text: texto,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      });
      // tipo "resuelta": la limpieza diaria (api/telegram-limpieza.js) lo
      // borra siempre — su botón nunca lo toca actualizarBotonesApuesta
      // (esa función solo gestiona los mensajes "listado" de cuando la
      // apuesta seguía pendiente), así que no necesita quedarse.
      if (enviado.ok) {
        await guardarMensajeSuelto(supabaseAdmin, process.env.TELEGRAM_OWNER_ID, enviado.result.message_id, "resuelta", fila.id);
      }
    }

    await actualizarBotonesApuesta(
      supabaseAdmin,
      fila.id,
      TEXTO_BOTON[fila.resultado] ?? "✅ Confirmada"
    );
  } catch (error) {
    console.error("telegram-resuelta", error);
  }

  res.status(200).json({ ok: true });
}
