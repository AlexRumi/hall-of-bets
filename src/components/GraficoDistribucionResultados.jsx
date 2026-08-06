import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { coloresGrafico } from "../utils/coloresGrafico";

const ETIQUETAS = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
  cashout: "Cash Out",
};

function TooltipPersonalizado({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { etiqueta, cantidad } = payload[0].payload;
  return (
    <div className="bg-surface border border-gold/40 rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-lg shadow-black/20">
      <p className="text-xs sm:text-sm text-slate">{etiqueta}</p>
      <p className="font-mono text-base sm:text-lg font-bold text-ink">
        {cantidad} {cantidad === 1 ? "apuesta" : "apuestas"}
      </p>
    </div>
  );
}

// Los 4 estados de una apuesta ya tienen colores reservados en toda la app
// (ApuestaItem.jsx): se reutilizan aquí tal cual, no son colores nuevos.
export default function GraficoDistribucionResultados({ apuestas, oscuro }) {
  const colores = coloresGrafico(oscuro);
  const colorPorResultado = {
    pendiente: colores.pending,
    ganada: colores.win,
    perdida: colores.lose,
    nula: colores.void,
    cashout: colores.cashout,
  };

  const datos = Object.keys(ETIQUETAS)
    .map((resultado) => ({
      resultado,
      etiqueta: ETIQUETAS[resultado],
      cantidad: apuestas.filter((a) => a.resultado === resultado).length,
    }))
    .filter((d) => d.cantidad > 0);

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink mb-4">
        Distribución de resultados
      </h2>

      {datos.length === 0 ? (
        <p className="text-sm text-slate py-10 text-center">
          Todavía no hay apuestas registradas.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={180} className="sm:max-w-[180px]">
            <PieChart>
              <Pie
                data={datos}
                dataKey="cantidad"
                nameKey="etiqueta"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {datos.map((d) => (
                  <Cell key={d.resultado} fill={colorPorResultado[d.resultado]} />
                ))}
              </Pie>
              <Tooltip content={<TooltipPersonalizado />} position={{ y: 60 }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-2">
            {datos.map((d) => (
              <div key={d.resultado} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: colorPorResultado[d.resultado] }}
                />
                <span className="text-ink">{d.etiqueta}</span>
                <span className="font-mono text-slate">{d.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
