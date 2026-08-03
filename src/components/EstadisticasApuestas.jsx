import { calcularEstadisticas } from "../utils/apuestas";

export default function EstadisticasApuestas({ apuestas }) {
  const stats = calcularEstadisticas(apuestas);

  const tiles = [
    { etiqueta: "Nº apuestas", valor: stats.numApuestas },
    { etiqueta: "Stake medio", valor: `${stats.stakeMedio.toFixed(2)}€` },
    { etiqueta: "Cuota media", valor: stats.cuotaMedia.toFixed(2) },
    { etiqueta: "Stake total", valor: `${stats.stakeTotalReal.toFixed(2)}€` },
    {
      etiqueta: "Beneficio",
      valor: `${stats.beneficio > 0 ? "+" : ""}${stats.beneficio.toFixed(2)}€`,
      color:
        stats.beneficio > 0
          ? "text-win"
          : stats.beneficio < 0
          ? "text-lose"
          : "text-ink",
    },
    {
      etiqueta: "Yield",
      valor: `${stats.yieldPct > 0 ? "+" : ""}${stats.yieldPct.toFixed(2)}%`,
      color:
        stats.yieldPct > 0
          ? "text-win"
          : stats.yieldPct < 0
          ? "text-lose"
          : "text-ink",
    },
    { etiqueta: "% Acierto", valor: `${stats.aciertoPct.toFixed(0)}%` },
  ];

  return (
    <div className="bg-white border border-line rounded-xl p-5 sm:p-6">
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

      {stats.stakeTotalFreebet > 0 && (
        <p className="text-xs text-slate mt-4 pt-4 border-t border-line">
          Además, {stats.stakeTotalFreebet.toFixed(2)}€ en stake de freebets
          (no cuenta en el stake total ni en el yield).
        </p>
      )}
    </div>
  );
}
