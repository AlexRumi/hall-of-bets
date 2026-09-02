import { crearSupabaseAdmin } from "./supabaseAdmin.js";

// Límite propio, compartido por TODAS las funciones que llaman a
// API-Football (partidos, jugadores, partido, cuotas) — un único punto de
// control antes de cualquier llamada real a la API. Vive en una fila de
// Supabase, no en memoria: cada invocación de una función serverless de
// Vercel puede correr en una instancia distinta, así que un contador en
// memoria de JS no se compartiría entre ellas (justo lo que dejó pasar la
// ráfaga original de usePlantilla.js, ya arreglada por su lado, pero esto
// es la red de seguridad para cualquier otro bug futuro parecido).
//
// 8, no 10: deja margen bajo el límite real de API-Football (10
// peticiones/minuto en el plan gratuito) para no rozarlo justo.
//
// Además del tope por minuto, un espaciado mínimo (300ms) entre llamadas
// permitidas consecutivas: el tope por sí solo no evita que esas 8 salgan
// casi todas en el mismo instante (una ráfaga más pequeña, pero ráfaga) —
// justo el patrón que más se parece a tráfico sospechoso, aparte de la
// cantidad total. Con la caché de plantillas ya puesta, este caso (varios
// equipos NUEVOS a la vez) debería ser rarísimo, pero de gratis, mejor
// cubrirlo también.
//
// Requiere la función de Postgres "reservar_llamada_api_football" (ver
// migración en el mismo commit) — usa SELECT ... FOR UPDATE para que dos
// invocaciones a la vez no puedan colarse las dos por encima del límite.
//
// Una denegación case casi siempre es por el espaciado (300ms desde la
// anterior), no por tener ya las 8 gastadas — descartar la llamada sin
// más ahí sería un hueco real: el usuario vería una plantilla o un
// partido vacío por una espera de milisegundos, no por falta de cuota de
// verdad. Por eso se reintenta unas pocas veces con una pausa corta antes
// de rendirse, en vez de fallar a la primera — "encolar y servir en
// cuanto haya hueco", no "descartar". El límite de reintentos acota la
// espera a ~2s como mucho (bien dentro del tiempo de una función de
// Vercel) — si de verdad están las 8 gastadas, esperar más no ayudaría
// (la ventana tarda hasta 60s en liberarse), así que ahí sí se acaba
// devolviendo denegado, como antes.
const ESPACIADO_MS = 300;
const REINTENTOS_MAXIMOS = 6;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function permiteLlamadaApiFootball() {
  const supabaseAdmin = crearSupabaseAdmin();

  for (let intento = 0; intento < REINTENTOS_MAXIMOS; intento++) {
    const { data, error } = await supabaseAdmin.rpc("reservar_llamada_api_football", {
      p_limite: 8,
      p_ventana_segundos: 60,
      p_espaciado_ms: ESPACIADO_MS,
    });

    if (error) {
      // Si el limitador en sí falla (tabla/función no creada todavía,
      // Supabase caído...), no se bloquea la app entera por esto — se
      // deja pasar la llamada, confiando en el límite real de la API
      // como red de seguridad de todos modos.
      console.error("permiteLlamadaApiFootball: no se pudo consultar el limitador", error);
      return true;
    }

    if (data) return true;
    if (intento < REINTENTOS_MAXIMOS - 1) await esperar(ESPACIADO_MS + 50);
  }

  // Agotados los reintentos sin hueco: de verdad hay 8 llamadas gastadas
  // en el último minuto (esperar más no ayudaría, la ventana tarda hasta
  // 60s en liberarse). Sin este log, un partido/plantilla vacío por esto
  // es indistinguible de "no hay datos" — con él, se puede diferenciar en
  // los logs de Vercel "estamos realmente saturados" de "hay un bug
  // nuevo generando llamadas de más".
  console.warn("permiteLlamadaApiFootball: sin hueco tras agotar los reintentos, se deniega la llamada");
  return false;
}
