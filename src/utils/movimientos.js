import { calcularBeneficio } from "./apuestas";

// El bankroll real de una casa es el mismo dinero, lo uses para apostar en
// serio o para entretenimiento: se calcula sobre TODAS las apuestas de esa
// casa, sin filtrar por bankroll (a diferencia del resto de estadísticas).
export function calcularBankrollPorCasa(movimientos, apuestas) {
  const casas = new Set([
    ...movimientos.map((m) => m.casa),
    ...apuestas.map((a) => a.casa),
  ]);

  return [...casas]
    .map((casa) => {
      const ingresos = movimientos
        .filter((m) => m.casa === casa && m.tipo === "ingreso")
        .reduce((suma, m) => suma + m.cantidad, 0);
      const retiradas = movimientos
        .filter((m) => m.casa === casa && m.tipo === "retirada")
        .reduce((suma, m) => suma + m.cantidad, 0);
      const beneficio = apuestas
        .filter((a) => a.casa === casa && a.resultado !== "pendiente")
        .reduce((suma, a) => suma + calcularBeneficio(a), 0);

      return {
        casa,
        ingresos,
        retiradas,
        beneficio,
        bankroll: ingresos - retiradas + beneficio,
        roiPct: ingresos ? (beneficio / ingresos) * 100 : 0,
      };
    })
    .sort((a, b) => b.bankroll - a.bankroll);
}
