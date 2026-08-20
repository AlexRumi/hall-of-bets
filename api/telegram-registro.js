import { agruparSeleccionesPorPartido } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { calcularNumerosPorCategoria, ETIQUETAS_CATEGORIA } from "./_lib/numeracion.js";
import { tg, escapeHtml } from "./_lib/telegram.js";
import { guardarMensajeSuelto } from "./_lib/telegramMensajes.js";

// Serverless Function que recibe un Database Webhook de Supabase (Database >
// Webhooks, configurado a mano en el panel — no hay forma de crearlo desde
// aquí) cada vez que se inserta una fila nueva en "apuestas": manda un
// mensaje de Telegram confirmando el registro, con el nº de apuesta (mismo
// cálculo que /pendientes) y el nombre de cada partido. La app web no puede
// avisar ella sola (el token del bot es secreto, no puede vivir en el
// navegador) — por eso lo dispara Supabase directamente al escribir la fila,
// no una llamada aparte desde el frontend: funciona pase lo que pase cómo se
// haya creado la apuesta (app, bot, un futuro import...).
//
// Protegido con REGISTRO_WEBHOOK_SECRET (cabecera HTTP personalizada,
// configurada al crear el webhook en Supabase) — distinto del secret_token
// de Telegram y del AVISOS_CRON_SECRET: aquí quien llama es Supabase, no
// Telegram ni cron-job.org. El mismo secreto y el mismo mecanismo (Database
// Webhook) los reutiliza api/telegram-resuelta.js, con evento UPDATE en vez
// de INSERT.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  if (req.headers["x-registro-secret"] !== process.env.REGISTRO_WEBHOOK_SECRET) {
    res.status(401).end();
    return;
  }

  const fila = req.body?.record;
  if (!fila || fila.user_id !== USER_ID) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const supabaseAdmin = crearSupabaseAdmin();
    const numerosPorId = await calcularNumerosPorCategoria(supabaseAdmin);
    const numero = numerosPorId.get(fila.id) ?? "?";
    const grupos = agruparSeleccionesPorPartido(fila.selecciones);

    const lineas = [
      `🎯 <b>Apuesta nº${numero} · ${ETIQUETAS_CATEGORIA[fila.categoria] ?? fila.categoria}</b>`,
      ...(fila.titulo ? [`🏷 ${escapeHtml(fila.titulo)}`] : []),
      "",
      ...grupos.map((grupo) => escapeHtml(grupo.evento)),
      "",
      "✅ Registrada correctamente.",
    ];

    const enviado = await tg("sendMessage", {
      chat_id: process.env.TELEGRAM_OWNER_ID,
      text: lineas.join("\n"),
      parse_mode: "HTML",
    });
    // tipo "registro": la limpieza diaria (api/telegram-limpieza.js) lo
    // borra siempre, no tiene un estado "pendiente" que respetar como los
    // mensajes con botón "Ver apuesta".
    if (enviado.ok) {
      await guardarMensajeSuelto(supabaseAdmin, process.env.TELEGRAM_OWNER_ID, enviado.result.message_id, "registro", fila.id);
    }
  } catch (error) {
    console.error("telegram-registro", error);
  }

  res.status(200).json({ ok: true });
}
