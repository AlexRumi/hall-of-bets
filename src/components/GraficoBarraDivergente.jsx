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

// Con muchas barras (p.ej. muchas casas de apuestas) el tooltip grande tapa
// más gráfica, así que se hace algo más compacto en cuanto hay más de 4.
// Además, en móvil (pantalla más pequeña) siempre arranca más pequeño y
// crece un poco a partir de "sm:" (tablet/escritorio).
function crearTooltip(formatoValor, compacto) {
  return function TooltipPersonalizado({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { etiqueta, valor } = payload[0].payload;
    return (
      <div
        className={`bg-surface border border-gold/40 rounded-lg shadow-lg shadow-black/20 ${
          compacto ? "px-2.5 py-1.5 sm:px-3 sm:py-2" : "px-3 py-2 sm:px-4 sm:py-3"
        }`}
      >
        <p
          className={
            compacto ? "text-[11px] sm:text-xs text-slate" : "text-xs sm:text-sm text-slate"
          }
        >
          {etiqueta}
        </p>
        <p
          className={`font-mono font-bold ${
            compacto ? "text-sm sm:text-base" : "text-base sm:text-lg"
          } ${valor > 0 ? "text-win" : valor < 0 ? "text-lose" : "text-ink"}`}
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
  const compacto = datos.length > 4;
  const TooltipPersonalizado = crearTooltip(formatoValor, compacto);

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
            <Tooltip
              content={<TooltipPersonalizado />}
              cursor={false}
              position={{ y: compacto ? 90 : 75 }}
            />
            {/* maxBarSize: sin esto, con pocas categorías (a veces solo una
                — un único deporte, una única casa...) la barra se estira
                para llenar todo el ancho disponible, viéndose como un
                bloque gigante en el contenedor más ancho de Estadísticas
                (petición directa, detectado al probarlo con pocos datos
                de prueba) — con muchas categorías no cambia nada, cada
                barra ya era más estrecha que este máximo. */}
            <Bar dataKey="valor" radius={[4, 4, 4, 4]} maxBarSize={56}>
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
