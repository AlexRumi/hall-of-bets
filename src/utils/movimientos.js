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

// Evolución del bankroll real a lo largo del tiempo: dinero de verdad que
// tienes en las casas (ingresos - retiradas + beneficio de apuestas), sumado
// entre TODAS las casas y bankrolls (Apuestas/Entretenimiento). A diferencia
// del gráfico de "Beneficio acumulado", aquí sí cuentan los ingresos/retiradas.
export function calcularSerieBankrollReal(movimientos, apuestas) {
  const cronologico = (lista) => [...lista].reverse(); // las listas guardan lo más nuevo primero

  const eventos = [
    ...cronologico(movimientos).map((m) => ({
      fecha: m.fecha,
      variacion: m.tipo === "ingreso" ? m.cantidad : -m.cantidad,
    })),
    ...cronologico(apuestas.filter((a) => a.resultado !== "pendiente")).map(
      (a) => ({ fecha: a.fecha, variacion: calcularBeneficio(a) })
    ),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha)); // sort estable: mantiene el orden anterior dentro del mismo día

  let acumulado = 0;
  return eventos.map((evento) => {
    acumulado += evento.variacion;
    return { fecha: evento.fecha, acumulado };
  });
}
