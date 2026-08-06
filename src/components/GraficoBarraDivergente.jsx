import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { coloresGrafico } from "../utils/coloresGrafico";

function crearTooltip(formatoValor) {
  return function TooltipPersonalizado({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { etiqueta, valor } = payload[0].payload;
    return (
      <div className="bg-surface border border-line rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs text-slate">{etiqueta}</p>
        <p
          className={`font-mono text-sm font-medium ${
            valor > 0 ? "text-win" : valor < 0 ? "text-lose" : "text-ink"
          }`}
        >
          {formatoValor(valor)}
        </p>
      </div>
    );
  };
}

// Barras que pueden ser positivas o negativas (beneficio mensual, ROI por
// deporte/casa, beneficio por rango de cuota): el color dice el signo
// (verde/rojo), nunca la categoría — el nombre va en el eje X. Un solo
// componente reutilizado en los cuatro sitios en vez de cuatro casi iguales.
export default function GraficoBarraDivergente({
  titulo,
  datos,
  oscuro,
  formatoValor = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}€`,
  mensajeVacio = "Todavía no hay datos suficientes.",
}) {
  const colores = coloresGrafico(oscuro);
  const TooltipPersonalizado = crearTooltip(formatoValor);

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink mb-4">
        {titulo}
      </h2>

      {datos.length === 0 ? (
        <p className="text-sm text-slate py-10 text-center">{mensajeVacio}</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={colores.linea} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tick={{ fill: colores.texto, fontSize: 12 }}
              axisLine={{ stroke: colores.linea }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatoValor(v)}
              tick={{ fill: colores.texto, fontSize: 11 }}
              axisLine={{ stroke: colores.linea }}
              tickLine={false}
              width={60}
            />
            <ReferenceLine y={0} stroke={colores.texto} />
            <Tooltip content={<TooltipPersonalizado />} />
            <Bar dataKey="valor" radius={[4, 4, 4, 4]}>
              {datos.map((d, i) => (
                <Cell key={i} fill={d.valor >= 0 ? colores.win : colores.lose} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
