import { agruparSeleccionesPorPartido, derivarResultadoApuesta } from "../../src/utils/apuestas.js";
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

// Mismo efecto que manejarMarcarResultadoPick en src/App.jsx: guarda el
// resultado de un pick concreto (uno de los mercados de un partido dentro
// de la apuesta) y, si con ese cambio la apuesta entera queda decidida de
// verdad, sella también el resultado real con marcarResultadoApuesta. Si da
// "perdida" mátemáticamente pero aún quedan mercados de ESE MISMO multi sin
// marcar, se espera a que estén todos decididos antes de sellarlo (mismo
// criterio que la app: no adelantar la derrota real hasta confirmar el
// resto de mercados de ese partido).
export async function marcarPick(supabaseAdmin, apuesta, indice, resultado) {
  const nuevasSelecciones = apuesta.selecciones.map((seleccion, i) =>
    i === indice ? { ...seleccion, resultado } : seleccion
  );

  await supabaseAdmin
    .from("apuestas")
    .update({ selecciones: nuevasSelecciones })
    .eq("id", apuesta.id);

  if (apuesta.resultado === "cashout") {
    return { selecciones: nuevasSelecciones, resultado: apuesta.resultado };
  }

  const nuevoResultado = derivarResultadoApuesta(agruparSeleccionesPorPartido(nuevasSelecciones));
  const todosDecididos = nuevasSelecciones.every((s) => (s.resultado ?? "pendiente") !== "pendiente");
  if (nuevoResultado === "perdida" && !todosDecididos) {
    return { selecciones: nuevasSelecciones, resultado: apuesta.resultado };
  }
  if (nuevoResultado !== apuesta.resultado) {
    await marcarResultadoApuesta(supabaseAdmin, { ...apuesta, selecciones: nuevasSelecciones }, nuevoResultado);
    return { selecciones: nuevasSelecciones, resultado: nuevoResultado };
  }
  return { selecciones: nuevasSelecciones, resultado: apuesta.resultado };
}
