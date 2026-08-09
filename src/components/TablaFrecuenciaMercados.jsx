// Cuántas veces se ha usado cada tipo de mercado (utils/mercados.js),
// contando cada selección de cada apuesta por separado — a diferencia de
// TablaEstadisticasMercado.jsx (dinero exacto, una sola categoría por
// apuesta), aquí un mismo mercado "secundario" de una combinada o de un
// bet builder también cuenta, aunque sin dinero asociado. Mismo patrón de
// tabla que TablaEstadisticasMercado.jsx.
export default function TablaFrecuenciaMercados({ datos }) {
  if (datos.length === 0) {
    return (
      <p className="text-sm text-slate py-6 text-center">
        Todavía no hay mercados registrados.
      </p>
    );
  }

  const maximo = Math.max(...datos.map((d) => d.veces));

  return (
    <div className="space-y-2">
      {datos.map((m) => (
        <div key={m.categoriaId} className="flex items-center gap-3">
          <span className="w-36 sm:w-44 shrink-0 text-sm text-ink truncate">{m.etiqueta}</span>
          <div className="flex-1 h-2 rounded-full bg-paperDim overflow-hidden">
            <div
              className="h-full bg-gold rounded-full"
              style={{ width: `${(m.veces / maximo) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-sm text-ink">{m.veces}</span>
        </div>
      ))}
    </div>
  );
}
