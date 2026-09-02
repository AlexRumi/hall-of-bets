import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase con la service role key: salta las políticas de Row
// Level Security (pensadas para el navegador, con sesión de usuario propia).
// Las Serverless Functions de api/ (limitador y caché de plantillas de
// API-Football) no tienen sesión de navegador, así que necesitan esta vía
// — nunca se expone al frontend. VITE_SUPABASE_URL no es secreta (ya viaja
// en el bundle del navegador), así que se reutiliza tal cual también aquí.
export function crearSupabaseAdmin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
