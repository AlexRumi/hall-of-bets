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

// Mismo efecto que manejarMarcarResultado en src/App.jsx: guarda el
// resultado real de la apuesta y aplica los ajustes de freebet que le
// correspondan (seguro perdido al perder, devolución del stake al anular).
// Beneficio, yield, racha y trofeos no se guardan en ningún sitio — se
// recalculan solos la próxima vez que se abra la app, a partir de este
// mismo campo "resultado", así que no hace falta tocar nada más aquí.
export async function marcarResultadoApuesta(supabaseAdmin, apuesta, resultado, cashoutImporte = null) {
  await supabaseAdmin
    .from("apuestas")
    .update({
      resultado,
      cashout_importe: resultado === "cashout" ? Number(cashoutImporte) : null,
    })
    .eq("id", apuesta.id);

  if (resultado === "perdida" && apuesta.seguro_freebet_importe) {
    await ajustarSaldoFreebet(
      supabaseAdmin,
      apuesta.casa,
      Number(apuesta.seguro_freebet_importe),
      apuesta.categoria
    );
  }
  if (resultado === "nula" && apuesta.tipo_fondos === "freebet") {
    await ajustarSaldoFreebet(supabaseAdmin, apuesta.casa, Number(apuesta.stake), apuesta.categoria);
  }
}
