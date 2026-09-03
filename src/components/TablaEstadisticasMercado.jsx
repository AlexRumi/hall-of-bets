// Tabla de apoyo al gráfico "ROI por tipo de mercado" (EstadisticasDashboard.jsx):
// el gráfico solo puede enseñar un número por barra (el yield), así que
// esta tabla completa el resto de columnas que pidió el usuario (nº
// apuestas, stake, beneficio, % acierto) sin necesitar una gráfica por
// cada una. Filas alternas con bg-paperDim, sin depender de colores de
// recharts.
export default function TablaEstadisticasMercado({ datos }) {
  if (datos.length === 0) {
    return (
      <p className="text-sm text-slate py-6 text-center">
        Todavía no hay suficientes apuestas por tipo de mercado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-xs text-slate text-left border-b border-line">
            <th className="py-1.5 font-medium">Mercado</th>
            <th className="py-1.5 font-medium text-right">Apuestas</th>
            <th className="py-1.5 font-medium text-right">Stake</th>
            <th className="py-1.5 font-medium text-right">Beneficio</th>
            <th className="py-1.5 font-medium text-right">Yield</th>
            <th className="py-1.5 font-medium text-right">Acierto</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((m, i) => (
            <tr
              key={m.categoriaId}
              className={`border-b border-line last:border-b-0 ${i % 2 === 0 ? "bg-paperDim" : ""}`}
            >
              <td className="py-2 px-2 text-ink font-medium">{m.etiqueta}</td>
              <td className="py-2 px-2 text-right font-mono text-ink">{m.numApuestas}</td>
              <td className="py-2 px-2 text-right font-mono text-ink">
                {m.stakeTotalReal.toFixed(2)}€
              </td>
              <td
                className={`py-2 px-2 text-right font-mono font-semibold ${
                  m.beneficio > 0 ? "text-win" : m.beneficio < 0 ? "text-lose" : "text-ink"
                }`}
              >
                {m.beneficio > 0 ? "+" : ""}
                {m.beneficio.toFixed(2)}€
              </td>
              <td
                className={`py-2 px-2 text-right font-mono ${
                  m.yieldPct > 0 ? "text-win" : m.yieldPct < 0 ? "text-lose" : "text-ink"
                }`}
              >
                {m.yieldPct > 0 ? "+" : ""}
                {m.yieldPct.toFixed(2)}%
              </td>
              <td className="py-2 px-2 text-right font-mono text-ink">
                {m.aciertoPct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
