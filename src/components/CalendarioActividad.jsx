import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const CLASES_NIVEL = [
  "bg-paperDim",
  "bg-gold/25",
  "bg-gold/50",
  "bg-gold/70",
  "bg-gold/90",
];

function nivelIntensidad(cantidad, maxCantidad) {
  if (cantidad === 0) return 0;
  if (maxCantidad <= 1) return 4;
  const proporcion = cantidad / maxCantidad;
  if (proporcion > 0.75) return 4;
  if (proporcion > 0.5) return 3;
  if (proporcion > 0.25) return 2;
  return 1;
}

function formatearMesAnio(fecha) {
  const texto = fecha.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Calendario mensual normal (no la tira estilo GitHub de antes): más fácil
// de leer día a día. Abre siempre en el mes en curso; con las flechas se
// puede ir hacia atrás, pero no más adelante del mes actual (no tiene
// sentido "actividad futura").
export default function CalendarioActividad({ apuestas }) {
  const hoy = new Date();
  const [mesVisto, setMesVisto] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );

  const anio = mesVisto.getFullYear();
  const mes = mesVisto.getMonth();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();
  const prefijo = `${anio}-${String(mes + 1).padStart(2, "0")}`;

  const conteo = new Map();
  for (const apuesta of apuestas) {
    if (apuesta.fecha.startsWith(prefijo)) {
      conteo.set(apuesta.fecha, (conteo.get(apuesta.fecha) ?? 0) + 1);
    }
  }

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offsetInicio = (new Date(anio, mes, 1).getDay() + 6) % 7; // 0 = lunes
  const celdas = [
    ...Array.from({ length: offsetInicio }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const cantidades = [...conteo.values()];
  const maxCantidad = Math.max(...cantidades, 1);
  const totalMes = cantidades.reduce((suma, c) => suma + c, 0);

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-semibold text-ink">
          Calendario de actividad
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMesVisto(new Date(anio, mes - 1, 1))}
            aria-label="Mes anterior"
            className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-ink w-32 text-center">
            {formatearMesAnio(mesVisto)}
          </span>
          <button
            type="button"
            onClick={() => !esMesActual && setMesVisto(new Date(anio, mes + 1, 1))}
            disabled={esMesActual}
            aria-label="Mes siguiente"
            className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate mb-4">
        {totalMes} {totalMes === 1 ? "apuesta" : "apuestas"} este mes
      </p>

      <div className="grid grid-cols-7 gap-1.5">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="text-center text-xs text-slate font-medium"
          >
            {dia}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={i} />;
          const clave = `${prefijo}-${String(dia).padStart(2, "0")}`;
          const cantidad = conteo.get(clave) ?? 0;
          return (
            <div
              key={i}
              title={`${clave}: ${cantidad} ${
                cantidad === 1 ? "apuesta" : "apuestas"
              }`}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-mono ${
                CLASES_NIVEL[nivelIntensidad(cantidad, maxCantidad)]
              } ${cantidad > 0 ? "text-ink font-medium" : "text-slate"}`}
            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
}
