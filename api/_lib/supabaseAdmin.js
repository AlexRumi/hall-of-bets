import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase con la service role key: salta las políticas de Row
// Level Security (pensadas para el navegador, con sesión de usuario propia).
// El bot de Telegram no tiene sesión de navegador, así que necesita esta vía
// — nunca se expone al frontend, solo la usan las Serverless Functions
// dentro de api/. VITE_SUPABASE_URL no es secreta (ya viaja en el bundle del
// navegador), así que se reutiliza tal cual también aquí.
export function crearSupabaseAdmin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Filtro explícito por user_id en cada consulta del bot, aunque la service
// role key ya salta el RLS: barato de escribir y evita que un futuro cambio
// (otro usuario, datos de prueba) exponga apuestas de otra cuenta por error.
export const USER_ID = process.env.SUPABASE_USER_ID;
