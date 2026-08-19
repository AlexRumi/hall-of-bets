import { crearSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { tg } from "./_lib/telegram.js";

// Serverless Function pensada para un cron EXTERNO (cron-job.org, cada 15
// min — mismo mecanismo que api/telegram-avisos.js, con su propio secreto,
// LIMPIEZA_CRON_SECRET, distinto de AVISOS_CRON_SECRET). Petición directa:
// "autoeliminar" el chat de Telegram cada mañana a las 9:00 (hora de
// España), conservando solo lo que sigue siendo útil.
//
// Un bot solo puede borrar SUS PROPIOS mensajes (nunca lo que escribe el
// usuario, ni los toques a los botones del teclado) — así que "se elimina
// el chat" es en la práctica "se eliminan todos los mensajes que manda el
// bot", excepto:
// - tipo "start" (la confirmación de /start): NUNCA se borra — borrarlo
//   colapsaría el teclado personalizado (Telegram vincula qué teclado se
//   muestra al mensaje más reciente que lo trajo consigo).
// - tipo "listado" (los mensajes con botón "Ver apuesta" de /pendientes y
//   de los botones Todas/Apuestas/Entretenimiento, de una apuesta que SIGUE
//   pendiente): se conservan mientras lo esté, para que esos botones del
//   teclado se refieran a algo real. En cuanto la apuesta se resuelve
//   (actualizarBotonesApuesta, en api/_lib/telegramMensajes.js, marca
//   "resuelta_en" en vez de borrar la fila como hacía antes) quedan libres
//   para la limpieza.
// - tipo "aviso"/"registro"/"resuelta": siempre libres, no tienen un estado
//   "pendiente" que respetar — decidido con el usuario (AskUserQuestion):
//   se borran igual que el resto, el chat queda limpio de verdad cada
//   mañana; los datos reales siguen intactos en la app, esto es solo el
//   canal de avisos. "aviso" ya no lleva botón "Ver apuesta" (petición
//   directa, texto plano igual que "registro"), así que tampoco tiene ya
//   sentido esperar a que se resuelva para poder borrarlo.
export default async function handler(req, res) {
  if (req.query.secret !== process.env.LIMPIEZA_CRON_SECRET) {
    res.status(401).end();
    return;
  }

  // Solo actúa dentro de la franja 9:00-9:59 hora de Madrid — cualquier
  // otro tic del cron (cada 15 min, las 24h) responde sin tocar nada. Con
  // un cron de 15 en 15 min no se puede clavar el minuto exacto (9:00:00),
  // pero sí asegurar que caiga dentro de esa hora. No hace falta guardar
  // "ya se limpió hoy": tras la primera pasada de la mañana no queda nada
  // elegible, así que las siguientes 3 pasadas de esa misma hora no
  // encuentran nada que borrar.
  //
  // "forzar=1" salta esta comprobación de hora — solo para probarlo a mano
  // (con el secreto en la URL, así que sigue protegido); el cron de verdad
  // nunca lo manda.
  const horaMadrid = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  if (horaMadrid !== 9 && req.query.forzar !== "1") {
    res.status(200).json({ ventana: false });
    return;
  }

  const supabaseAdmin = crearSupabaseAdmin();

  // Dos consultas simples (en vez de una sola con un filtro OR/AND
  // combinado a mano) para no depender de acertar una sintaxis de filtro
  // compuesta sin poder probarla antes de desplegar. "chat_id" no se
  // filtra por USER_ID (esa columna es de la tabla "apuestas", no de
  // "telegram_mensajes") — pero al ser un bot de un solo usuario, todo lo
  // que hay aquí es siempre del mismo chat.
  const columnas = "id, chat_id, message_id, tipo";
  const { data: sinEstado, error: errorSinEstado } = await supabaseAdmin
    .from("telegram_mensajes")
    .select(columnas)
    .in("tipo", ["aviso", "registro", "resuelta"]);
  const { data: resueltos, error: errorResueltos } = await supabaseAdmin
    .from("telegram_mensajes")
    .select(columnas)
    .eq("tipo", "listado")
    .not("resuelta_en", "is", null);

  const error = errorSinEstado ?? errorResueltos;
  if (error) {
    console.error("telegram-limpieza", error);
    res.status(500).json({ error: error.message });
    return;
  }
  const mensajes = [...(sinEstado ?? []), ...(resueltos ?? [])];
  if (mensajes.length === 0) {
    res.status(200).json({ ventana: true, comprobados: 0, borrados: 0, detalle: [] });
    return;
  }

  let borrados = 0;
  const idsProcesados = [];
  // "detalle": diagnóstico temporal (petición directa, mensajes de varios
  // días sin borrarse pese al cron en verde) — para ver por qué falla cada
  // uno sin tener acceso directo a Supabase.
  const detalle = [];
  for (const { id, chat_id, message_id, tipo } of mensajes) {
    let enviado;
    try {
      enviado = await tg("deleteMessage", { chat_id, message_id });
    } catch (fetchError) {
      // Fallo de red: se deja la fila para reintentarlo en el siguiente
      // tic (todavía dentro de la misma hora 8).
      console.error("telegram-limpieza: fallo de red al borrar", message_id, fetchError);
      detalle.push({ tipo, ok: false, motivo: "fallo_red" });
      continue;
    }
    // Un rechazo de Telegram (ok: false — p.ej. mensaje ya borrado a mano,
    // o con más de 48h, límite de la propia API para borrar) también se
    // marca como procesado: reintentarlo no serviría de nada, casi siempre
    // significa que ya no existe. Solo se cuenta en "borrados" lo que de
    // verdad se borró.
    if (enviado.ok) {
      borrados++;
    } else {
      detalle.push({ tipo, ok: false, motivo: enviado.description ?? "rechazado_telegram" });
    }
    idsProcesados.push(id);
  }

  if (idsProcesados.length > 0) {
    await supabaseAdmin.from("telegram_mensajes").delete().in("id", idsProcesados);
  }

  res.status(200).json({ ventana: true, comprobados: mensajes.length, borrados, detalle });
}
