import { calcularBeneficio } from "./apuestas";

// El bankroll real de una casa se calcula sobre sus movimientos y apuestas
// — por defecto TODAS, combinando Apuestas y Entretenimiento (así se
// calculaba antes de que movimientos tuviera categoría, y varias pantallas
// siguen queriendo el total combinado: Inicio, el gran total de Casas de
// apuestas). Si se pasa "categoria" ("apuestas" o "entretenimiento"), filtra
// antes de sumar — para cuando cada bankroll se lleva por separado de
// verdad, aunque compartan la misma casa física. Los movimientos sin
// categoría asignada (de antes de esta columna) no cuentan en ningún
// filtro por categoria, solo en el total combinado.
export function calcularBankrollPorCasa(movimientos, apuestas, categoria = null) {
  const movimientosUsados = categoria
    ? movimientos.filter((m) => m.categoria === categoria)
    : movimientos;
  const apuestasUsadas = categoria ? apuestas.filter((a) => a.categoria === categoria) : apuestas;

  const casas = new Set([
    ...movimientosUsados.map((m) => m.casa),
    ...apuestasUsadas.map((a) => a.casa),
  ]);

  return [...casas]
    .map((casa) => {
      const ingresos = movimientosUsados
        .filter((m) => m.casa === casa && m.tipo === "ingreso")
        .reduce((suma, m) => suma + m.cantidad, 0);
      const retiradas = movimientosUsados
        .filter((m) => m.casa === casa && m.tipo === "retirada")
        .reduce((suma, m) => suma + m.cantidad, 0);
      const beneficio = apuestasUsadas
        .filter((a) => a.casa === casa && a.resultado !== "pendiente")
        .reduce((suma, a) => suma + calcularBeneficio(a), 0);

      // Dinero real ya comprometido en apuestas todavía pendientes de esta
      // casa: no cuenta como disponible hasta que se resuelvan (petición
      // directa — antes el bankroll lo seguía contando como si estuviera
      // libre, aunque ya estuviera jugado). En freebet no se resta nada (esa
      // parte nunca fue dinero real: ya se descontó del saldo de freebet al
      // crear la apuesta, ver ajustarSaldoFreebet en useCasas.js); en mixta
      // solo la parte real, "stake" (ver calcularBeneficio/FormularioApuesta.jsx
      // — "stake" siempre es la parte real, incluso en mixta).
      const stakePendienteReal = apuestasUsadas
        .filter((a) => a.casa === casa && a.resultado === "pendiente" && a.tipoFondos !== "freebet")
        .reduce((suma, a) => suma + a.stake, 0);

      return {
        casa,
        ingresos,
        retiradas,
        beneficio,
        stakePendienteReal,
        bankroll: ingresos - retiradas + beneficio - stakePendienteReal,
        roiPct: ingresos ? (beneficio / ingresos) * 100 : 0,
      };
    })
    .sort((a, b) => b.bankroll - a.bankroll);
}
