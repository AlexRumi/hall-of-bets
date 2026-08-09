import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calcularBeneficio } from "../utils/apuestas";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function formatearMesAnio(fecha) {
  const texto = fecha.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Color de cada día según su beneficio neto (suma de calcularBeneficio de
// todas sus apuestas, pendientes incluidas — que aportan 0), no según
// cuántas apuestas hubo (a diferencia del mapa de calor por volumen de
// antes): verde con beneficio, rojo con pérdidas, un tercer color neutral
// si el día tiene apuestas pero se queda justo en 0 (p.ej. solo pendientes,
// o ganancias y pérdidas que se cancelan). Sin apuestas ese día, gris claro
// como siempre.
function clasesDia(cantidad, beneficio) {
  if (cantidad === 0) return "bg-paperDim text-slate";
  if (beneficio > 0) return "bg-win/20 text-win font-semibold";
  if (beneficio < 0) return "bg-lose/20 text-lose font-semibold";
  return "bg-void/20 text-void font-semibold";
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

  const porDia = new Map();
  for (const apuesta of apuestas) {
    if (apuesta.fecha.startsWith(prefijo)) {
      const actual = porDia.get(apuesta.fecha) ?? { cantidad: 0, beneficio: 0 };
      actual.cantidad += 1;
      actual.beneficio += calcularBeneficio(apuesta);
      porDia.set(apuesta.fecha, actual);
    }
  }

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offsetInicio = (new Date(anio, mes, 1).getDay() + 6) % 7; // 0 = lunes
  const celdas = [
    ...Array.from({ length: offsetInicio }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const totalMes = [...porDia.values()].reduce((suma, d) => suma + d.cantidad, 0);

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
          const datosDia = porDia.get(clave);
          const cantidad = datosDia?.cantidad ?? 0;
          const beneficio = datosDia?.beneficio ?? 0;
          return (
            <div
              key={i}
              title={`${clave}: ${cantidad} ${cantidad === 1 ? "apuesta" : "apuestas"}${
                cantidad > 0 ? ` · ${beneficio > 0 ? "+" : ""}${beneficio.toFixed(2)}€` : ""
              }`}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-mono ${clasesDia(
                cantidad,
                beneficio
              )}`}
            >
              {dia}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-line">
        <span className="flex items-center gap-1.5 text-xs text-slate">
          <span className="w-3 h-3 rounded bg-win/50" />
          Beneficio
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate">
          <span className="w-3 h-3 rounded bg-lose/50" />
          Pérdida
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate">
          <span className="w-3 h-3 rounded bg-void/50" />
          Neutral
        </span>
      </div>
    </div>
  );
}
