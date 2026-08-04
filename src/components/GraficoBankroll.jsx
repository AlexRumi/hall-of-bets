import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { calcularSerieBankrollReal } from "../utils/movimientos";

// Recharts pinta con SVG, así que necesita colores hex reales (no puede leer las clases de Tailwind).
const COLORES = { linea: "#D9D2BC", texto: "#6B6357", acento: "#B8934D" };

function formatearFecha(fecha) {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

function TooltipPersonalizado({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { fecha, acumulado } = payload[0].payload;

  return (
    <div className="bg-surface border border-line rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs text-slate">{formatearFecha(fecha)}</p>
      <p
        className={`font-mono text-sm font-medium ${
          acumulado > 0 ? "text-win" : acumulado < 0 ? "text-lose" : "text-ink"
        }`}
      >
        {acumulado > 0 ? "+" : ""}
        {acumulado.toFixed(2)}€
      </p>
    </div>
  );
}

// Bankroll real (dinero de verdad, sumando ingresos/retiradas y beneficio de
// apuestas), no solo el rendimiento apostando. Junta todas las casas y los
// dos bankrolls (Apuestas/Entretenimiento), porque el dinero es el mismo.
export default function GraficoBankroll({ movimientos, apuestas }) {
  const serie = calcularSerieBankrollReal(movimientos, apuestas);

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink mb-4">
        Bankroll real
      </h2>

      {serie.length === 0 ? (
        <p className="text-sm text-slate py-10 text-center">
          Todavía no hay ingresos, retiradas ni apuestas resueltas para graficar.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLORES.linea} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatearFecha}
              tick={{ fill: COLORES.texto, fontSize: 12 }}
              axisLine={{ stroke: COLORES.linea }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}€`}
              tick={{ fill: COLORES.texto, fontSize: 12 }}
              axisLine={{ stroke: COLORES.linea }}
              tickLine={false}
              width={50}
            />
            <ReferenceLine y={0} stroke={COLORES.texto} strokeDasharray="3 3" />
            <Tooltip content={<TooltipPersonalizado />} />
            <Line
              type="monotone"
              dataKey="acumulado"
              stroke={COLORES.acento}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
