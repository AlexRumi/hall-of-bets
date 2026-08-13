import { agruparSeleccionesPorPartido } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { calcularNumerosPorCategoria, ETIQUETAS_CATEGORIA } from "./_lib/numeracion.js";
import { tg, escapeHtml, URL_APP, iconoDeporte } from "./_lib/telegram.js";
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
//
// Teclado personalizado (petición directa — "categorías debajo del nombre
// del canal" no es posible, Telegram no deja a los bots tocar esa zona;
// esto es lo más parecido: botones fijos justo encima de donde se escribe,
// siempre a la vista) — se fija una vez al mandar /start y se queda puesto
// en el chat para las respuestas siguientes, sin tener que reenviarlo cada
// vez (independiente del botón "Abrir apuesta" de cada mensaje, que es un
// teclado en línea aparte, no compite con este).
const TECLADO_CATEGORIAS = {
  keyboard: [["📋 Todas", "💼 Apuestas", "🎮 Entretenimiento"]],
  resize_keyboard: true,
};
const CATEGORIA_POR_BOTON = {
  "📋 Todas": null,
  "💼 Apuestas": "apuestas",
  "🎮 Entretenimiento": "entretenimiento",
};

// Resumen de texto de una apuesta (sin botones de pick: solo para ver de un
// vistazo qué es, antes de abrir el ticket con "Abrir apuesta"). Petición
// directa: más aire entre bloques (estado/meta/cada partido con sus
// mercados) e icono del deporte junto al nombre de cada partido, en vez de
// todo pegado sin distinguir dónde empieza cada cosa.
function renderResumen(apuesta, numero) {
  const grupos = agruparSeleccionesPorPartido(apuesta.selecciones);
  const icono = iconoDeporte(apuesta.deporte);
  const lineas = [
    `🎯 <b>Apuesta nº${numero} · ${ETIQUETAS_CATEGORIA[apuesta.categoria] ?? apuesta.categoria}</b>`,
    "",
    `⏳ <b>Pendiente</b>`,
    "",
    `${apuesta.fecha} · ${escapeHtml(apuesta.casa)} · ${
      grupos.length > 1 ? `Combinada (${grupos.length} partidos)` : "Simple"
    } · ${apuesta.tipo_fondos === "freebet" ? "Freebet" : "Real"}`,
  ];

  for (const grupo of grupos) {
    const cabecera = [grupo.competicion, grupo.pais].filter(Boolean).join(" · ");
    lineas.push(
      "",
      `${icono} <b>${escapeHtml(grupo.evento)}</b>${cabecera ? ` <i>(${escapeHtml(cabecera)})</i>` : ""}`,
      ""
    );
    for (const pick of grupo.selecciones) {
      lineas.push(`· ${escapeHtml(pick.apuesta ?? pick.evento)}`);
    }
  }

  return lineas.join("\n").trim();
}

// "categoria" es opcional (null = todas, "apuestas"/"entretenimiento" =
// solo ese bankroll) — viene de los botones del teclado personalizado.
async function enviarPendientes(supabaseAdmin, chatId, categoria) {
  let consulta = supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("user_id", USER_ID)
    .eq("resultado", "pendiente")
    .order("fecha", { ascending: true });
  if (categoria) consulta = consulta.eq("categoria", categoria);

  const { data: pendientes, error } = await consulta;

  if (error) {
    console.error("telegram-webhook /pendientes", error);
    await tg("sendMessage", {
      chat_id: chatId,
      text: `⚠️ Error consultando Supabase: ${error.message}`,
    });
    return;
  }
  if (!pendientes?.length) {
    const etiqueta = categoria ? ` en ${ETIQUETAS_CATEGORIA[categoria] ?? categoria}` : "";
    await tg("sendMessage", { chat_id: chatId, text: `No tienes apuestas pendientes${etiqueta} 🎉` });
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

  const texto = update.message?.text;

  try {
    if (texto?.startsWith("/pendientes")) {
      await enviarPendientes(supabaseAdmin, chatId, null);
    } else if (texto in CATEGORIA_POR_BOTON) {
      await enviarPendientes(supabaseAdmin, chatId, CATEGORIA_POR_BOTON[texto]);
    } else if (texto?.startsWith("/start")) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Hall of Bets Bot listo. Usa los botones de abajo (o /pendientes) para ver tus apuestas sin resolver.",
        reply_markup: TECLADO_CATEGORIAS,
      });
    }
  } catch (error) {
    console.error("telegram-webhook", error);
  }

  res.status(200).json({ ok: true });
}
