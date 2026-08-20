import { USER_ID } from "./supabaseAdmin.js";

// Mismo cálculo que ajustarSaldoFreebet en src/hooks/useCasas.js: lee el
// saldo actual de la casa y suma el delta (positivo devuelve freebet,
// negativo lo gasta). Se reimplementa aquí en vez de importar el hook
// porque un hook de React no se puede llamar fuera de un componente — pero
// es la misma fórmula, columna y tabla.
async function ajustarSaldoFreebet(supabaseAdmin, casaNombre, delta, categoria) {
  const columna =
    categoria === "entretenimiento" ? "freebet_saldo_entretenimiento" : "freebet_saldo_apuestas";
  const { data: casaActual } = await supabaseAdmin
    .from("casas")
    .select(columna)
    .eq("user_id", USER_ID)
    .eq("nombre", casaNombre)
    .single();
  if (!casaActual) return;

  const nuevoSaldo = Number(casaActual[columna]) + delta;
  await supabaseAdmin
    .from("casas")
    .update({ [columna]: nuevoSaldo })
    .eq("user_id", USER_ID)
    .eq("nombre", casaNombre);
}

// Cuánto freebet "extra" corresponde a esta apuesta si su resultado fuera
// "resultado" — mismo cálculo (y mismo motivo) que efectoFreebetPorResultado
// en src/App.jsx, reescrito aquí sobre la fila cruda de Supabase (snake_case,
// no se pasa por desdeFila). Función PURA, no toca nada.
function efectoFreebetPorResultado(apuesta, resultado) {
  const reembolsoNula =
    apuesta.tipo_fondos === "freebet"
      ? Number(apuesta.stake)
      : apuesta.tipo_fondos === "mixta"
      ? Number(apuesta.stake_freebet ?? 0)
      : 0;
  let efecto = 0;
  if (resultado === "nula") efecto += reembolsoNula;
  if (resultado === "perdida" && apuesta.seguro_freebet_importe) {
    efecto += Number(apuesta.seguro_freebet_importe);
  }
  return efecto;
}

// Mismo efecto que manejarMarcarResultado en src/App.jsx: guarda el
// resultado real de la apuesta y aplica los ajustes de freebet que le
// correspondan (seguro perdido al perder, devolución del stake al anular).
// Beneficio, yield, racha y trofeos no se guardan en ningún sitio — se
// recalculan solos la próxima vez que se abra la app, a partir de este
// mismo campo "resultado", así que no hace falta tocar nada más aquí.
//
// Bug real (mismo que en App.jsx): antes se sumaba el seguro/reembolso
// cada vez que se marcaba Perdida/Nula, sin importar si ya se había
// marcado así antes — corrigiendo una apuesta de Perdida a Nula y otra
// vez a Perdida duplicaba el seguro. Ahora se aplica la DIFERENCIA entre
// el efecto del resultado anterior (el que traía "apuesta", leído justo
// antes de este cambio) y el nuevo, así que el saldo siempre acaba
// correcto sin importar cuántas veces se haya corregido.
export async function marcarResultadoApuesta(supabaseAdmin, apuesta, resultado, cashoutImporte = null) {
  await supabaseAdmin
    .from("apuestas")
    .update({
      resultado,
      cashout_importe: resultado === "cashout" ? Number(cashoutImporte) : null,
    })
    .eq("id", apuesta.id);

  const delta =
    efectoFreebetPorResultado(apuesta, resultado) - efectoFreebetPorResultado(apuesta, apuesta.resultado);
  if (delta !== 0) {
    await ajustarSaldoFreebet(supabaseAdmin, apuesta.casa, delta, apuesta.categoria);
  }
}
