import { tg, URL_APP } from "./telegram.js";

// Guarda qué mensaje de Telegram (chat + id del mensaje) lleva el botón
// "Ver apuesta"/"Abrir apuesta" de una apuesta concreta — puede haber
// varios por apuesta (uno de /pendientes, uno por cada partido que va
// terminando en una combinada...). Sirve para poder editar ese botón más
// tarde, cuando la apuesta quede resuelta, sin tener que volver a mandar
// nada nuevo.
export async function guardarMensajeApuesta(supabaseAdmin, apuestaId, chatId, messageId) {
  const { error } = await supabaseAdmin
    .from("telegram_mensajes")
    .insert({ apuesta_id: apuestaId, chat_id: chatId, message_id: messageId });
  if (error) {
    console.error("telegramMensajes: no se pudo guardar el mensaje", apuestaId, error);
  }
}

// Edita el botón de TODOS los mensajes guardados de una apuesta (petición
// directa: que refleje el resultado en vez de seguir diciendo siempre "Ver
// apuesta") y, una vez editados, borra las filas — ya no hacen falta.
export async function actualizarBotonesApuesta(supabaseAdmin, apuestaId, textoBoton) {
  const { data: mensajes } = await supabaseAdmin
    .from("telegram_mensajes")
    .select("chat_id, message_id")
    .eq("apuesta_id", apuestaId);

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

  await supabaseAdmin.from("telegram_mensajes").delete().eq("apuesta_id", apuestaId);
}
