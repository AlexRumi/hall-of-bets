export const URL_APP = "https://hall-of-bets.vercel.app";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Compartido por todos los archivos que mandan/editan mensajes de Telegram
// (antes cada uno tenía su propia copia). Siempre comprueba "ok" en la
// respuesta y deja un console.error claro si Telegram rechaza la petición
// — bug real corregido primero solo en api/telegram-avisos.js (un envío
// fallido se trataba como si hubiera funcionado, sin dejar rastro); ahora
// la misma protección aplica en todos los sitios que llaman a Telegram.
export async function tg(method, payload) {
  const respuesta = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const datos = await respuesta.json();
  if (!datos.ok) {
    console.error("telegram: Telegram respondió con error", method, datos);
  }
  return datos;
}

export function escapeHtml(texto = "") {
  return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
