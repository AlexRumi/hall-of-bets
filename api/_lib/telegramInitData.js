import { createHmac, timingSafeEqual } from "node:crypto";

// Cuánto se deja vivir un initData antes de considerarlo caducado (evita que
// alguien reutilice para siempre una URL vieja capturada de algún sitio) —
// Telegram lo regenera cada vez que se abre la Mini App, así que un margen
// amplio no molesta en el uso normal.
const MAX_ANTIGUEDAD_MS = 24 * 60 * 60 * 1000;

// Verifica la firma HMAC del initData que manda el SDK de Telegram Web App
// (algoritmo oficial: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
// Sin esto, cualquiera con la URL de la Mini App (que no es secreta de
// verdad — puede filtrarse en una captura, un reenvío, etc.) podría abrirla
// haciéndose pasar por ti; el initData solo lo puede haber generado Telegram
// firmando con el token del bot, que nunca sale del servidor.
export function verificarInitData(initDataRaw, botToken) {
  if (!initDataRaw || !botToken) return { ok: false, error: "Falta initData o token" };

  const params = new URLSearchParams(initDataRaw);
  const hashRecibido = params.get("hash");
  if (!hashRecibido) return { ok: false, error: "Sin hash" };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, valor]) => `${clave}=${valor}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hashCalculado = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const bufferRecibido = Buffer.from(hashRecibido, "hex");
  const bufferCalculado = Buffer.from(hashCalculado, "hex");
  const firmaValida =
    bufferRecibido.length === bufferCalculado.length && timingSafeEqual(bufferRecibido, bufferCalculado);
  if (!firmaValida) return { ok: false, error: "Firma inválida" };

  const authDate = Number(params.get("auth_date")) * 1000;
  if (!authDate || Date.now() - authDate > MAX_ANTIGUEDAD_MS) {
    return { ok: false, error: "initData caducado" };
  }

  let usuario;
  try {
    usuario = JSON.parse(params.get("user") ?? "null");
  } catch {
    usuario = null;
  }
  if (!usuario?.id) return { ok: false, error: "Sin usuario" };

  return { ok: true, telegramUserId: String(usuario.id) };
}
