import { calcularEstadisticas, filtrarPorPeriodo } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";

// KPIs combinando Apuestas + Entretenimiento. "ROI" (beneficio / ingresos
// depositados) es distinto de "Yield" (beneficio / stake apostado) — la app
// ya usa ambas fórmulas por separado (ROI en Casas de apuestas, Yield en
// Estadísticas de cada bankroll).
export default function KpisEstadisticas({ apuestas, movimientos }) {
  const stats = calcularEstadisticas(apuestas);
  const statsMes = calcularEstadisticas(filtrarPorPeriodo(apuestas, "mes"));
  const bankrollTotal = calcularBankrollPorCasa(movimientos, apuestas).reduce(
    (suma, b) => suma + b.bankroll,
    0
  );
  const ingresosTotal = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((suma, m) => suma + m.cantidad, 0);
  const roiPct = ingresosTotal ? (stats.beneficio / ingresosTotal) * 100 : 0;

  const tiles = [
    {
      etiqueta: "Beneficio",
      valor: `${stats.beneficio > 0 ? "+" : ""}${stats.beneficio.toFixed(2)}€`,
      color:
        stats.beneficio > 0 ? "text-win" : stats.beneficio < 0 ? "text-lose" : "text-ink",
    },
    {
      etiqueta: "ROI",
      valor: `${roiPct > 0 ? "+" : ""}${roiPct.toFixed(2)}%`,
      color: roiPct > 0 ? "text-win" : roiPct < 0 ? "text-lose" : "text-ink",
    },
    {
      etiqueta: "Yield",
      valor: `${stats.yieldPct > 0 ? "+" : ""}${stats.yieldPct.toFixed(2)}%`,
      color: stats.yieldPct > 0 ? "text-win" : stats.yieldPct < 0 ? "text-lose" : "text-ink",
    },
    { etiqueta: "% Acierto", valor: `${stats.aciertoPct.toFixed(0)}%` },
    { etiqueta: "Bankroll", valor: `${bankrollTotal.toFixed(2)}€`, color: "text-goldDark" },
    { etiqueta: "Cuota media", valor: stats.cuotaMedia.toFixed(2) },
    { etiqueta: "Nº apuestas", valor: stats.numApuestas },
    {
      etiqueta: "Beneficio (mes)",
      valor: `${statsMes.beneficio > 0 ? "+" : ""}${statsMes.beneficio.toFixed(2)}€`,
      color:
        statsMes.beneficio > 0
          ? "text-win"
          : statsMes.beneficio < 0
          ? "text-lose"
          : "text-ink",
    },
  ];

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tiles.map(({ etiqueta, valor, color }) => (
          <div key={etiqueta}>
            <p className="text-xs text-slate">{etiqueta}</p>
            <p className={`font-mono text-lg font-medium ${color ?? "text-ink"}`}>
              {valor}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
