import { agruparSeleccionesPorPartido } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { marcarPick, marcarResultadoApuesta } from "./_lib/apuestasResueltas.js";

// Serverless Function de Vercel, webhook del bot de Telegram: permite
// resolver apuestas pendientes (Ganada/Perdida/Nula por mercado, o Cash
// Out) desde el móvil sin abrir la app. Registrado con setWebhook (ver
// CLAUDE.md) usando un secret_token propio de Telegram, comprobado en cada
// petición junto con tu ID de usuario — cualquier otra petición se
// descarta antes de tocar Supabase. Escribe con la service role key
// (api/_lib/supabaseAdmin.js), no con la clave del navegador: un webhook no
// tiene sesión de usuario con la que cumplir el RLS.
//
// Cada botón V/X/- escribe al instante (igual que ApuestaItem.jsx: no hay
// paso de "guardar" aparte) reutilizando exactamente la misma lógica de
// derivación que la app — api/_lib/apuestasResueltas.js importa
// agruparSeleccionesPorPartido/derivarResultadoApuesta de
// src/utils/apuestas.js en vez de reescribirlas, para que resolver desde
// Telegram tenga siempre el mismo efecto que resolver desde la app.
//
// Telegram no permite texto de color personalizado (a diferencia de la
// maqueta HTML de referencia): el estado de cada pick se muestra con un
// emoji + negrita/tachado (parse_mode HTML), y los botones no pueden
// colocarse pegados a cada línea de texto (el teclado siempre va debajo de
// todo el mensaje) — por eso cada pick va numerado y su fila de botones
// lleva el mismo número.

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

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

const ETIQUETAS_ESTADO = {
  pendiente: "⏳ Pendiente",
  ganada: "✅ Ganada",
  perdida: "❌ Perdida",
  nula: "➖ Nula",
};

const CODIGO_A_RESULTADO = { g: "ganada", x: "perdida", n: "nula" };

// Reconstruye el mensaje (texto + teclado) a partir del estado actual de la
// apuesta — se llama tanto para el mensaje inicial de /pendientes como
// después de cada botón pulsado, siempre a partir de datos frescos de
// Supabase (sin guardar nada de estado en el propio bot).
function renderApuesta(apuesta) {
  const grupos = agruparSeleccionesPorPartido(apuesta.selecciones);
  const lineas = [];
  const filas = [];
  let contador = 0;

  const estadoTexto =
    apuesta.resultado === "cashout"
      ? `💰 Cash Out${apuesta.cashout_importe != null ? " · " + Number(apuesta.cashout_importe).toFixed(2) + "€" : ""}`
      : ETIQUETAS_ESTADO[apuesta.resultado] ?? apuesta.resultado;

  lineas.push(`<b>${estadoTexto}</b>`);
  lineas.push(
    `${apuesta.fecha} · ${escapeHtml(apuesta.casa)} · ${
      grupos.length > 1 ? `Combinada (${grupos.length} partidos)` : "Simple"
    } · ${apuesta.tipo_fondos === "freebet" ? "Freebet" : "Real"}`
  );
  lineas.push("");

  for (const grupo of grupos) {
    const cabecera = [grupo.competicion, grupo.pais].filter(Boolean).join(" · ");
    lineas.push(
      `<b>${escapeHtml(grupo.evento)}</b>${cabecera ? ` <i>(${escapeHtml(cabecera)})</i>` : ""}`
    );

    for (const pick of grupo.selecciones) {
      contador++;
      const marca = { ganada: "✅", perdida: "❌", nula: "➖" }[pick.resultado] ?? "⏺️";
      const texto = escapeHtml(pick.apuesta ?? pick.evento);
      const textoFormateado =
        pick.resultado === "ganada"
          ? `<b>${texto}</b>`
          : pick.resultado === "perdida"
          ? `<s>${texto}</s>`
          : texto;
      lineas.push(`${contador}. ${marca} ${textoFormateado}`);

      const base = `p|${apuesta.id}|${pick.indice}|`;
      filas.push([
        { text: `${contador}) V`, callback_data: base + "g" },
        { text: `${contador}) X`, callback_data: base + "x" },
        { text: `${contador}) -`, callback_data: base + "n" },
      ]);
    }
    lineas.push("");
  }

  if (apuesta.resultado === "pendiente") {
    filas.push([{ text: "💰 Cash Out", callback_data: `c|${apuesta.id}` }]);
  }

  return { texto: lineas.join("\n").trim(), teclado: { inline_keyboard: filas } };
}

async function enviarPendientes(supabaseAdmin, chatId) {
  const { data: pendientes, error } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("user_id", USER_ID)
    .eq("resultado", "pendiente")
    .order("fecha", { ascending: true });

  if (error || !pendientes?.length) {
    await tg("sendMessage", { chat_id: chatId, text: "No tienes apuestas pendientes 🎉" });
    return;
  }

  for (const apuesta of pendientes) {
    const { texto, teclado } = renderApuesta(apuesta);
    await tg("sendMessage", {
      chat_id: chatId,
      text: texto,
      parse_mode: "HTML",
      reply_markup: teclado,
    });
  }
}

async function manejarCashOutSolicitado(supabaseAdmin, callbackQuery, chatId, apuestaId) {
  const { data: apuesta } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("id", apuestaId)
    .eq("user_id", USER_ID)
    .single();

  if (!apuesta) {
    await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id, text: "No encontrada" });
    return;
  }

  const primerEvento = apuesta.selecciones[0]?.evento ?? "esta apuesta";
  // El id de la apuesta viaja en el propio texto del mensaje (no hay ningún
  // sitio donde guardar estado entre mensajes de Telegram): al llegar la
  // respuesta, se recupera de ahí con una expresión regular en vez de con
  // una tabla nueva de "sesiones pendientes".
  await tg("sendMessage", {
    chat_id: chatId,
    text: `💰 ¿Importe cobrado (€) por el Cash Out de «${escapeHtml(primerEvento)}»?\n\nRef: ${apuesta.id}`,
    reply_markup: { force_reply: true },
  });
  await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id });
}

async function manejarPickPulsado(supabaseAdmin, callbackQuery, chatId, apuestaId, indiceStr, codigo) {
  const indice = Number(indiceStr);
  const { data: apuesta } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("id", apuestaId)
    .eq("user_id", USER_ID)
    .single();

  if (!apuesta) {
    await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id, text: "No encontrada" });
    return;
  }

  const resultadoPulsado = CODIGO_A_RESULTADO[codigo];
  const actual = apuesta.selecciones[indice]?.resultado ?? "pendiente";
  // Mismo ciclo que marcarPick en ApuestaItem.jsx: tocar el mismo botón
  // otra vez deshace el pick (vuelve a pendiente).
  const nuevo = actual === resultadoPulsado ? "pendiente" : resultadoPulsado;

  const actualizada = await marcarPick(supabaseAdmin, apuesta, indice, nuevo);

  const { texto, teclado } = renderApuesta({
    ...apuesta,
    selecciones: actualizada.selecciones,
    resultado: actualizada.resultado,
  });

  await tg("editMessageText", {
    chat_id: chatId,
    message_id: callbackQuery.message.message_id,
    text: texto,
    parse_mode: "HTML",
    reply_markup: teclado,
  });
  await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id });
}

async function manejarCallback(supabaseAdmin, callbackQuery, chatId) {
  const [tipo, ...resto] = (callbackQuery.data ?? "").split("|");

  if (tipo === "c") {
    await manejarCashOutSolicitado(supabaseAdmin, callbackQuery, chatId, resto[0]);
    return;
  }
  if (tipo === "p") {
    await manejarPickPulsado(supabaseAdmin, callbackQuery, chatId, resto[0], resto[1], resto[2]);
    return;
  }
  await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id });
}

async function manejarRespuestaCashOut(supabaseAdmin, message, chatId) {
  const referencia = message.reply_to_message?.text?.match(/Ref: ([0-9a-f-]{36})/i);
  if (!referencia) return;

  const importe = Number(String(message.text).trim().replace(",", "."));
  if (!Number.isFinite(importe) || importe < 0) {
    await tg("sendMessage", { chat_id: chatId, text: "Escribe solo el número del importe (ej: 12.50)." });
    return;
  }

  const apuestaId = referencia[1];
  const { data: apuesta } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("id", apuestaId)
    .eq("user_id", USER_ID)
    .single();
  if (!apuesta) return;

  await marcarResultadoApuesta(supabaseAdmin, apuesta, "cashout", importe);
  await tg("sendMessage", { chat_id: chatId, text: `💰 Cash Out registrado: ${importe.toFixed(2)}€` });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  // El secret_token solo lo conoce Telegram (se fija al registrar el
  // webhook con setWebhook) — cualquier petición sin él, o con otro valor,
  // se descarta antes de leer o tocar nada de Supabase.
  const secretoRecibido = req.headers["x-telegram-bot-api-secret-token"];
  if (secretoRecibido !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(401).end();
    return;
  }

  const update = req.body ?? {};
  const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
  const fromId = update.message?.from?.id ?? update.callback_query?.from?.id;

  // Bot de un solo usuario: aunque alguien encuentre el bot y adivine tu ID
  // de Telegram (no es un dato realmente secreto), esto descarta cualquier
  // mensaje que no sea tuyo antes de leer o tocar ninguna apuesta.
  if (!fromId || String(fromId) !== process.env.TELEGRAM_OWNER_ID) {
    res.status(200).json({ ok: true });
    return;
  }

  const supabaseAdmin = crearSupabaseAdmin();

  try {
    if (update.callback_query) {
      await manejarCallback(supabaseAdmin, update.callback_query, chatId);
    } else if (update.message?.text?.startsWith("/pendientes")) {
      await enviarPendientes(supabaseAdmin, chatId);
    } else if (update.message?.text?.startsWith("/start")) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Hall of Bets Bot listo. Usa /pendientes para ver tus apuestas sin resolver.",
      });
    } else if (update.message?.reply_to_message && update.message?.text) {
      await manejarRespuestaCashOut(supabaseAdmin, update.message, chatId);
    }
  } catch (error) {
    console.error("telegram-webhook", error);
  }

  res.status(200).json({ ok: true });
}
