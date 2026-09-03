import { crearSupabaseAdmin } from "./supabaseAdmin.js";

// Red de seguridad para GOAL API, distinta a la de API-Football
// (limitadorApiFootball.js): el problema de antes era la RÁFAGA por
// minuto — con GOAL ya se comprobó a mano que 8 llamadas casi
// simultáneas no tienen ningún problema (~200/min de margen real,
// visto en sus cabeceras ratelimit-*), así que no hace falta espaciado
// artificial aquí. Lo único que sí importa con este proveedor es no
// acercarse a las 1000 peticiones/día por un bug futuro (el mismo tipo
// de bug que causó la suspensión de API-Football) — de ahí un simple
// contador diario atómico, sin reintentos: si hoy ya se gastaron 900,
// esperar no libera nada hasta que cambie el día en UTC, así que se
// deniega directamente.
const LIMITE_DIARIO = 900;

export async function permiteLlamadaGoalApi() {
  const supabaseAdmin = crearSupabaseAdmin();

  const { data, error } = await supabaseAdmin.rpc("reservar_llamada_goal_api", {
    p_limite_diario: LIMITE_DIARIO,
  });

  if (error) {
    // Mismo criterio que limitadorApiFootball.js: si el limitador en sí
    // falla, no se bloquea la app entera por esto.
    console.error("permiteLlamadaGoalApi: no se pudo consultar el limitador", error);
    return true;
  }

  if (!data) {
    console.warn("permiteLlamadaGoalApi: límite diario alcanzado, se deniega la llamada");
  }

  return data;
}
