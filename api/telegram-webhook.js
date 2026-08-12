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
// todo el mensaje). Una apuesta simple (o un "multi" con varios mercados
// del mismo partido) cabe entera en un único mensaje; una combinada de
// varios partidos manda un mensaje por partido (petición directa: con 5
// partidos y 10-12 mercados, un solo mensaje con todo apilado se hacía
// interminable) — así cada botón solo reedita el mensaje de SU partido, sin
// arrastrar el resto.

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

function estadoTextoDe(apuesta) {
  return apuesta.resultado === "cashout"
    ? `💰 Cash Out${apuesta.cashout_importe != null ? " · " + Number(apuesta.cashout_importe).toFixed(2) + "€" : ""}`
    : ETIQUETAS_ESTADO[apuesta.resultado] ?? apuesta.resultado;
}

// Filas de texto + botones de los picks de UN partido — bloque reutilizado
// tanto en la apuesta simple (todo en un mensaje) como en cada mensaje
// suelto de una combinada.
function lineasYFilasDeGrupo(apuesta, grupo, { numerar }) {
  const lineas = [];
  const filas = [];
  const cabecera = [grupo.competicion, grupo.pais].filter(Boolean).join(" · ");
  lineas.push(`<b>${escapeHtml(grupo.evento)}</b>${cabecera ? ` <i>(${escapeHtml(cabecera)})</i>` : ""}`);

  let contador = 0;
  for (const pick of grupo.selecciones) {
    contador++;
    const marca = { ganada: "✅", perdida: "❌", nula: "➖" }[pick.resultado] ?? "⏺️";
    const texto = escapeHtml(pick.apuesta ?? pick.evento);
    const textoFormateado =
      pick.resultado === "ganada" ? `<b>${texto}</b>` : pick.resultado === "perdida" ? `<s>${texto}</s>` : texto;
    lineas.push(`${numerar ? `${contador}. ` : ""}${marca} ${textoFormateado}`);

    // Mismos emoji que "marca" arriba, para que los botones se parezcan a
    // los iconos de colores que ya usa ApuestaItem.jsx — Telegram no admite
    // iconos SVG propios en un botón, solo texto/emoji. Sin número delante:
    // cada fila de botones sale en el mismo orden que su pick en el texto
    // (Telegram no deja pegar botones a cada línea), la posición ya basta.
    const base = `p|${apuesta.id}|${pick.indice}|`;
    filas.push([
      { text: "✅", callback_data: base + "g" },
      { text: "❌", callback_data: base + "x" },
      { text: "➖", callback_data: base + "n" },
    ]);
  }
  return { lineas, filas };
}

// Apuesta con un solo partido (simple, o un "multi" con varios mercados del
// mismo partido): todo cabe en un único mensaje sin que se haga interminable.
function renderApuestaSimple(apuesta, grupos) {
  const lineas = [`<b>${estadoTextoDe(apuesta)}</b>`];
  lineas.push(
    `${apuesta.fecha} · ${escapeHtml(apuesta.casa)} · Simple · ${
      apuesta.tipo_fondos === "freebet" ? "Freebet" : "Real"
    }`
  );
  lineas.push("");

  const { lineas: lineasGrupo, filas } = lineasYFilasDeGrupo(apuesta, grupos[0], { numerar: true });
  lineas.push(...lineasGrupo);

  if (apuesta.resultado === "pendiente") {
    filas.push([{ text: "💰 Cash Out", callback_data: `c|${apuesta.id}` }]);
  }

  return { texto: lineas.join("\n").trim(), teclado: { inline_keyboard: filas } };
}

// Combinada de varios partidos (petición directa: con 5 partidos y 10-12
// mercados, un solo mensaje con todo apilado se hacía interminable). Se
// manda una "cabecera" (estado + Cash Out) y LUEGO un mensaje suelto por
// partido, cada uno con solo sus propios botones — así cada mensaje se
// puede editar por separado al tocar un botón, sin arrastrar el resto.
function renderCabeceraCombinada(apuesta, grupos) {
  const lineas = [`<b>${estadoTextoDe(apuesta)}</b>`];
  lineas.push(
    `${apuesta.fecha} · ${escapeHtml(apuesta.casa)} · Combinada (${grupos.length} partidos) · ${
      apuesta.tipo_fondos === "freebet" ? "Freebet" : "Real"
    }`
  );
  const filas = [];
  if (apuesta.resultado === "pendiente") {
    filas.push([{ text: "💰 Cash Out", callback_data: `c|${apuesta.id}` }]);
  }
  return { texto: lineas.join("\n"), teclado: { inline_keyboard: filas } };
}

// El mensaje suelto de UN partido dentro de una combinada — se reconstruye
// también tras cada botón pulsado, para editar solo este mensaje.
function renderGrupoMensaje(apuesta, grupo) {
  const { lineas, filas } = lineasYFilasDeGrupo(apuesta, grupo, { numerar: grupo.selecciones.length > 1 });
  return { texto: lineas.join("\n"), teclado: { inline_keyboard: filas } };
}

async function enviarPendientes(supabaseAdmin, chatId) {
  const { data: pendientes, error } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("user_id", USER_ID)
    .eq("resultado", "pendiente")
    .order("fecha", { ascending: true });

  if (error) {
    console.error("telegram-webhook /pendientes", error);
    await tg("sendMessage", {
      chat_id: chatId,
      text: `⚠️ Error consultando Supabase: ${error.message}`,
    });
    return;
  }
  if (!pendientes?.length) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: `No tienes apuestas pendientes 🎉 (consultado con user_id ${USER_ID})`,
    });
    return;
  }

  for (const apuesta of pendientes) {
    const grupos = agruparSeleccionesPorPartido(apuesta.selecciones);
    if (grupos.length === 1) {
      const { texto, teclado } = renderApuestaSimple(apuesta, grupos);
      await tg("sendMessage", { chat_id: chatId, text: texto, parse_mode: "HTML", reply_markup: teclado });
      continue;
    }

    const { texto: textoCabecera, teclado: tecladoCabecera } = renderCabeceraCombinada(apuesta, grupos);
    await tg("sendMessage", {
      chat_id: chatId,
      text: textoCabecera,
      parse_mode: "HTML",
      reply_markup: tecladoCabecera,
    });
    for (const grupo of grupos) {
      const { texto, teclado } = renderGrupoMensaje(apuesta, grupo);
      await tg("sendMessage", { chat_id: chatId, text: texto, parse_mode: "HTML", reply_markup: teclado });
    }
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

  // La cabecera de una combinada ya no se reedita al marcar picks (cada
  // partido tiene su propio mensaje), así que el botón de Cash Out puede
  // quedar visible aunque la apuesta ya se haya sellado sola — se comprueba
  // aquí en vez de fiarse de que el botón haya desaparecido.
  if (apuesta.resultado !== "pendiente") {
    await tg("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "Esta apuesta ya está resuelta.",
    });
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

  const gruposAntes = agruparSeleccionesPorPartido(apuesta.selecciones);
  const actualizada = await marcarPick(supabaseAdmin, apuesta, indice, nuevo);
  const apuestaActualizada = { ...apuesta, selecciones: actualizada.selecciones, resultado: actualizada.resultado };

  if (gruposAntes.length === 1) {
    // Apuesta simple: todo vive en un único mensaje, se reedita entero.
    const { texto, teclado } = renderApuestaSimple(
      apuestaActualizada,
      agruparSeleccionesPorPartido(actualizada.selecciones)
    );
    await tg("editMessageText", {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id,
      text: texto,
      parse_mode: "HTML",
      reply_markup: teclado,
    });
  } else {
    // Combinada: solo se reedita el mensaje del partido al que pertenece
    // este pick — la cabecera y el resto de partidos no se tocan.
    const gruposDespues = agruparSeleccionesPorPartido(actualizada.selecciones);
    const grupo = gruposDespues.find((g) => g.selecciones.some((s) => s.indice === indice));
    const { texto, teclado } = renderGrupoMensaje(apuestaActualizada, grupo);
    await tg("editMessageText", {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id,
      text: texto,
      parse_mode: "HTML",
      reply_markup: teclado,
    });

    // Si con este pick la apuesta entera queda sellada (o se deshace un
    // sello anterior), la cabecera no se reedita — se avisa con un mensaje
    // nuevo en vez de intentar localizar y editar aquel otro mensaje.
    if (actualizada.resultado !== apuesta.resultado) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `<b>${estadoTextoDe(apuestaActualizada)}</b> — apuesta actualizada.`,
        parse_mode: "HTML",
      });
    }
  }

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
