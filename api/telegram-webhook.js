import { agruparSeleccionesPorPartido } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { calcularNumerosPorCategoria, ETIQUETAS_CATEGORIA } from "./_lib/numeracion.js";
import { tg, escapeHtml, URL_APP } from "./_lib/telegram.js";
import { guardarMensajeApuesta } from "./_lib/telegramMensajes.js";

// Serverless Function de Vercel, webhook del bot de Telegram: permite abrir
// tus apuestas pendientes desde el móvil sin abrir la app entera. Registrado
// con setWebhook (ver CLAUDE.md) usando un secret_token propio de Telegram,
// comprobado en cada petición junto con tu ID de usuario — cualquier otra
// petición se descarta antes de tocar Supabase.
//
// /pendientes manda un resumen de texto por apuesta (sin botones de
// V/X/-/Cash Out: eso se resuelve ahora en la Mini App, ver
// src/components/TelegramMiniApp.jsx) con un único botón "web_app" que
// abre esa apuesta con el diseño de ticket. La Mini App lee/escribe con su
// propio endpoint (api/telegram-apuesta.js), verificando el initData del
// SDK de Telegram en vez del secret_token/ID de chat que usa este webhook.
// El id de cada mensaje se guarda (api/_lib/telegramMensajes.js) para que
// api/telegram-resuelta.js pueda editar el botón más tarde, cuando la
// apuesta quede resuelta.

// Resumen de texto de una apuesta (sin botones de pick: solo para ver de un
// vistazo qué es, antes de abrir el ticket con "Abrir apuesta").
function renderResumen(apuesta, numero) {
  const grupos = agruparSeleccionesPorPartido(apuesta.selecciones);
  const lineas = [
    `🎯 <b>Apuesta nº${numero} · ${ETIQUETAS_CATEGORIA[apuesta.categoria] ?? apuesta.categoria}</b>`,
    `⏳ <b>Pendiente</b>`,
    `${apuesta.fecha} · ${escapeHtml(apuesta.casa)} · ${
      grupos.length > 1 ? `Combinada (${grupos.length} partidos)` : "Simple"
    } · ${apuesta.tipo_fondos === "freebet" ? "Freebet" : "Real"}`,
    "",
  ];

  for (const grupo of grupos) {
    const cabecera = [grupo.competicion, grupo.pais].filter(Boolean).join(" · ");
    lineas.push(`<b>${escapeHtml(grupo.evento)}</b>${cabecera ? ` <i>(${escapeHtml(cabecera)})</i>` : ""}`);
    for (const pick of grupo.selecciones) {
      lineas.push(`· ${escapeHtml(pick.apuesta ?? pick.evento)}`);
    }
  }

  return lineas.join("\n").trim();
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
    await tg("sendMessage", { chat_id: chatId, text: "No tienes apuestas pendientes 🎉" });
    return;
  }

  const numerosPorId = await calcularNumerosPorCategoria(supabaseAdmin);

  for (const apuesta of pendientes) {
    const enviado = await tg("sendMessage", {
      chat_id: chatId,
      text: renderResumen(apuesta, numerosPorId.get(apuesta.id) ?? "?"),
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Abrir apuesta", web_app: { url: `${URL_APP}/telegram/apuesta/${apuesta.id}` } }],
        ],
      },
    });
    if (enviado.ok) {
      await guardarMensajeApuesta(supabaseAdmin, apuesta.id, chatId, enviado.result.message_id);
    }
  }
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
  const chatId = update.message?.chat?.id;
  const fromId = update.message?.from?.id;

  // Bot de un solo usuario: aunque alguien encuentre el bot y adivine tu ID
  // de Telegram (no es un dato realmente secreto), esto descarta cualquier
  // mensaje que no sea tuyo antes de leer o tocar ninguna apuesta.
  if (!fromId || String(fromId) !== process.env.TELEGRAM_OWNER_ID) {
    res.status(200).json({ ok: true });
    return;
  }

  const supabaseAdmin = crearSupabaseAdmin();

  try {
    if (update.message?.text?.startsWith("/pendientes")) {
      await enviarPendientes(supabaseAdmin, chatId);
    } else if (update.message?.text?.startsWith("/start")) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Hall of Bets Bot listo. Usa /pendientes para ver tus apuestas sin resolver.",
      });
    }
  } catch (error) {
    console.error("telegram-webhook", error);
  }

  res.status(200).json({ ok: true });
}
