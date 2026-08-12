import { USER_ID } from "./supabaseAdmin.js";

export const ETIQUETAS_CATEGORIA = { apuestas: "Apuestas", entretenimiento: "Entretenimiento" };

// Nº de una apuesta dentro de su propia categoría (Apuestas/Entretenimiento),
// por orden de creación — la primera que se registró ahí es la nº1. Se
// calcula al vuelo (sin guardar nada nuevo en Supabase) contando cuántas
// apuestas de esa categoría se crearon antes o al mismo tiempo que ella; si
// alguna vez se borra una apuesta antigua, los números posteriores se
// recolocan solos (detalle cosmético, no afecta a nada más). Compartido por
// api/telegram-webhook.js, api/telegram-registro.js y api/telegram-avisos.js
// — los tres mensajes de Telegram muestran el mismo número para la misma
// apuesta.
export async function calcularNumerosPorCategoria(supabaseAdmin) {
  const { data: todas } = await supabaseAdmin
    .from("apuestas")
    .select("id, categoria, creado_en")
    .eq("user_id", USER_ID)
    .order("creado_en", { ascending: true });

  const contadores = {};
  const numeroPorId = new Map();
  for (const fila of todas ?? []) {
    contadores[fila.categoria] = (contadores[fila.categoria] ?? 0) + 1;
    numeroPorId.set(fila.id, contadores[fila.categoria]);
  }
  return numeroPorId;
}
