import { useState } from "react";
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
import { calcularSerieAcumulada } from "../utils/apuestas";
import { filtrarPorVentana } from "../utils/estadisticas";
import { coloresGrafico } from "../utils/coloresGrafico";

const VENTANAS = [
  { id: "7d", etiqueta: "7d" },
  { id: "30d", etiqueta: "30d" },
  { id: "90d", etiqueta: "90d" },
  { id: "anio", etiqueta: "Año" },
  { id: "todo", etiqueta: "Histórico" },
];

function formatearFecha(fecha) {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

function crearTooltip() {
  return function TooltipPersonalizado({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { fecha, acumulado } = payload[0].payload;
    return (
      <div className="bg-surface border border-gold/40 rounded-lg px-4 py-3 shadow-lg shadow-black/20">
        <p className="text-sm text-slate">{formatearFecha(fecha)}</p>
        <p
          className={`font-mono text-lg font-bold ${
            acumulado > 0 ? "text-win" : acumulado < 0 ? "text-lose" : "text-ink"
          }`}
        >
          {acumulado > 0 ? "+" : ""}
          {acumulado.toFixed(2)}€
        </p>
      </div>
    );
  };
}

// Beneficio acumulado dentro de la ventana elegida (empieza en 0 al
// principio de esa ventana, no es el acumulado histórico recortado).
export default function GraficoEvolucion({ apuestas, oscuro }) {
  const [ventana, setVentana] = useState("30d");
  const colores = coloresGrafico(oscuro);
  const serie = calcularSerieAcumulada(filtrarPorVentana(apuestas, ventana));
  const TooltipPersonalizado = crearTooltip();

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">Evolución</h2>
        <div className="flex gap-1 flex-wrap">
          {VENTANAS.map(({ id, etiqueta }) => (
            <button
              key={id}
              type="button"
              onClick={() => setVentana(id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                ventana === id ? "bg-felt text-paper" : "text-slate hover:text-ink"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {serie.length === 0 ? (
        <p className="text-sm text-slate py-10 text-center">
          Todavía no hay apuestas resueltas en este periodo.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={colores.linea} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatearFecha}
              tick={{ fill: colores.texto, fontSize: 12 }}
              axisLine={{ stroke: colores.linea }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}€`}
              tick={{ fill: colores.texto, fontSize: 12 }}
              axisLine={{ stroke: colores.linea }}
              tickLine={false}
              width={50}
            />
            <ReferenceLine y={0} stroke={colores.texto} strokeDasharray="3 3" />
            <Tooltip content={<TooltipPersonalizado />} position={{ y: 70 }} />
            <Line
              type="monotone"
              dataKey="acumulado"
              stroke={colores.gold}
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
