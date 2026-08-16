import { tg, URL_APP } from "./telegram.js";

// Guarda qué mensaje de Telegram (chat + id del mensaje) lleva el botón
// "Ver apuesta"/"Abrir apuesta" de una apuesta concreta — puede haber
// varios por apuesta (uno de /pendientes, uno por cada partido que va
// terminando en una combinada...). Sirve para poder editar ese botón más
// tarde, cuando la apuesta quede resuelta, sin tener que volver a mandar
// nada nuevo — y, junto con "tipo", para que api/telegram-limpieza.js sepa
// qué puede borrar cada mañana y qué no (ver esa función más abajo).
export async function guardarMensajeApuesta(supabaseAdmin, apuestaId, chatId, messageId, tipo) {
  const { error } = await supabaseAdmin
    .from("telegram_mensajes")
    .insert({ apuesta_id: apuestaId, chat_id: chatId, message_id: messageId, tipo });
  if (error) {
    console.error("telegramMensajes: no se pudo guardar el mensaje", apuestaId, error);
  }
}

// Igual que guardarMensajeApuesta, pero para mensajes que no llevan botón
// que editar más tarde (el registro de una apuesta nueva, el resumen final
// al resolverla, la confirmación de /start) — se guardan igual, solo para
// que la limpieza diaria (api/telegram-limpieza.js) sepa que existen y
// pueda borrarlos cuando toque. "apuestaId" es opcional (la confirmación de
// /start no tiene apuesta asociada).
export async function guardarMensajeSuelto(supabaseAdmin, chatId, messageId, tipo, apuestaId = null) {
  const { error } = await supabaseAdmin
    .from("telegram_mensajes")
    .insert({ apuesta_id: apuestaId, chat_id: chatId, message_id: messageId, tipo });
  if (error) {
    console.error("telegramMensajes: no se pudo guardar el mensaje suelto", tipo, error);
  }
}

// Edita el botón de TODOS los mensajes guardados de una apuesta (petición
// directa: que refleje el resultado en vez de seguir diciendo siempre "Ver
// apuesta"). Antes, una vez editados, se borraban las filas — ahora se
// marcan con "resuelta_en" en su lugar (sin borrar), para que
// api/telegram-limpieza.js sepa que esos mensajes ya no hacen falta y
// pueda borrarlos de verdad en su siguiente pasada, en vez de perder el
// rastro de a qué mensajes de Telegram habría que ir a borrar.
export async function actualizarBotonesApuesta(supabaseAdmin, apuestaId, textoBoton) {
  const { data: mensajes } = await supabaseAdmin
    .from("telegram_mensajes")
    .select("chat_id, message_id")
    .eq("apuesta_id", apuestaId)
    .is("resuelta_en", null);

  if (!mensajes?.length) return;

  for (const { chat_id, message_id } of mensajes) {
    try {
      await tg("editMessageReplyMarkup", {
        chat_id,
        message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: textoBoton, web_app: { url: `${URL_APP}/telegram/apuesta/${apuestaId}` } }],
          ],
        },
      });
    } catch (error) {
      // Un mensaje borrado por el usuario, o fuera de la ventana de 48h que
      // deja editar Telegram, no debe impedir que se editen los demás.
      console.error("telegramMensajes: fallo al editar botón", apuestaId, message_id, error);
    }
  }

  await supabaseAdmin
    .from("telegram_mensajes")
    .update({ resuelta_en: new Date().toISOString() })
    .eq("apuesta_id", apuestaId)
    .is("resuelta_en", null);
}
