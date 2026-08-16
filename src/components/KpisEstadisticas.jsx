import { calcularEstadisticas, filtrarPorPeriodo } from "../utils/apuestas";
import BotonInfoConcepto from "./BotonInfoConcepto";

function Tile({ etiqueta, valor, color, conceptoId }) {
  return (
    <div>
      <p className="text-xs text-slate flex items-center gap-1">
        {etiqueta}
        <BotonInfoConcepto conceptoId={conceptoId} etiqueta={etiqueta} />
      </p>
      <p className={`font-mono text-lg font-medium ${color ?? "text-ink"}`}>{valor}</p>
    </div>
  );
}

// KPIs combinando Apuestas + Entretenimiento. "ROI" (beneficio / ingresos
// depositados) es distinto de "Yield" (beneficio / stake apostado) — la app
// ya usa ambas fórmulas por separado (ROI en Casas de apuestas, Yield en
// Estadísticas de cada bankroll). "Bankroll" se quitó de aquí (petición
// directa): ahora tiene su propia tarjeta aparte, con el desglose real/
// freebets — ver TarjetaBankroll en EstadisticasDashboard.jsx.
export default function KpisEstadisticas({ apuestas, movimientos }) {
  const stats = calcularEstadisticas(apuestas);
  const statsMes = calcularEstadisticas(filtrarPorPeriodo(apuestas, "mes"));
  const ingresosTotal = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((suma, m) => suma + m.cantidad, 0);
  const roiPct = ingresosTotal ? (stats.beneficio / ingresosTotal) * 100 : 0;

  // Primeras dos filas (4 columnas cada una); el Beneficio va aparte, en
  // su propia fila centrada más abajo — petición directa, para que
  // destaque del resto en vez de ser una pastilla más de la cuadrícula.
  const tilesPrincipales = [
    {
      etiqueta: "ROI",
      valor: `${roiPct > 0 ? "+" : ""}${roiPct.toFixed(2)}%`,
      color: roiPct > 0 ? "text-win" : roiPct < 0 ? "text-lose" : "text-ink",
      conceptoId: "roi",
    },
    {
      etiqueta: "Yield",
      valor: `${stats.yieldPct > 0 ? "+" : ""}${stats.yieldPct.toFixed(2)}%`,
      color: stats.yieldPct > 0 ? "text-win" : stats.yieldPct < 0 ? "text-lose" : "text-ink",
      conceptoId: "yield",
    },
    { etiqueta: "% Acierto", valor: `${stats.aciertoPct.toFixed(0)}%`, conceptoId: "win-rate" },
    { etiqueta: "Cuota media", valor: stats.cuotaMedia.toFixed(2), conceptoId: "cuota" },
    { etiqueta: "Nº apuestas", valor: stats.numApuestas },
    { etiqueta: "Media apostada", valor: `${stats.stakeMedio.toFixed(2)}€`, conceptoId: "stake" },
    {
      etiqueta: "Total apostado",
      valor: `${stats.stakeTotalReal.toFixed(2)}€`,
      conceptoId: "stake",
    },
    {
      etiqueta: "En juego",
      valor: `${stats.stakePendienteReal.toFixed(2)}€`,
      color: stats.stakePendienteReal > 0 ? "text-gold" : "text-ink",
    },
  ];

  const tilesBeneficio = [
    {
      etiqueta: "Beneficio",
      valor: `${stats.beneficio > 0 ? "+" : ""}${stats.beneficio.toFixed(2)}€`,
      color: stats.beneficio > 0 ? "text-win" : stats.beneficio < 0 ? "text-lose" : "text-ink",
    },
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
        {tilesPrincipales.map((tile) => (
          <Tile key={tile.etiqueta} {...tile} />
        ))}
      </div>

      <div className="flex justify-center gap-10 sm:gap-16 pt-4 mt-4 border-t border-line">
        {tilesBeneficio.map((tile) => (
          <Tile key={tile.etiqueta} {...tile} />
        ))}
      </div>

      {stats.stakeTotalFreebet > 0 && (
        <p className="text-xs text-slate mt-4 pt-4 border-t border-line">
          Además, {stats.stakeTotalFreebet.toFixed(2)}€ en stake de freebets
          (no cuenta en el stake total ni en el yield).
        </p>
      )}
    </div>
  );
}
