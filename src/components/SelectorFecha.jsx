import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DIAS_SEMANA = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

function formatearISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
    fecha.getDate()
  ).padStart(2, "0")}`;
}

function sumarDias(fecha, dias) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

// Sustituye al <input type="date"> nativo que tenía el campo "Fecha" del
// formulario de apuesta (petición directa): el buscador de partidos
// (ConstructorPartido.jsx → BuscadorEvento.jsx) solo encuentra partidos en
// ayer/hoy/mañana (límite del plan gratuito de API-Football, ver
// api/partidos.js) — un calendario libre dejaba elegir cualquier fecha,
// aunque estuviera garantizado que no iba a traer ningún partido. Muestra 7
// días (3 antes de hoy, hoy, 3 después): solo esos tres centrales se pueden
// elegir, el resto se ven pero no se pueden tocar, para que la razón sea
// visible en vez de parecer un fallo. Al ser el único campo de fecha que
// tiene la apuesta, se acepta perder la posibilidad de ponerle una fecha más
// antigua a mano (petición directa, no se usa para anotar apuestas
// atrasadas) — si "valor" ya viene de fuera de estos 7 días (editando una
// apuesta vieja sin tocar su fecha), simplemente no se resalta ningún día,
// sin forzar ningún cambio mientras no se toque la tira.
export default function SelectorFecha({ valor, onCambiar }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i - 3));
  const habilitados = new Set(dias.slice(2, 5).map(formatearISO)); // ayer, hoy, mañana
  const hoyIso = formatearISO(hoy);

  const indiceValor = dias.findIndex((dia) => formatearISO(dia) === valor);
  const diaActual = indiceValor >= 0 ? dias[indiceValor] : hoy;

  function ir(offset) {
    const iso = formatearISO(sumarDias(diaActual, offset));
    if (habilitados.has(iso)) onCambiar(iso);
  }

  const puedeAtras = habilitados.has(formatearISO(sumarDias(diaActual, -1)));
  const puedeAdelante = habilitados.has(formatearISO(sumarDias(diaActual, 1)));

  return (
    <div>
      {/* Escritorio: flechas compactas, mismo patrón que el navegador de
          periodo de Informe (InformeProfesional.jsx). */}
      <div className="hidden sm:flex items-center justify-center gap-3 border border-line rounded-lg px-3 py-2 bg-surface">
        <button
          type="button"
          onClick={() => ir(-1)}
          disabled={!puedeAtras}
          aria-label="Día anterior"
          className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="flex items-center gap-2 text-sm font-medium text-ink font-mono">
          <Calendar size={14} className="text-slate shrink-0" />
          {String(diaActual.getDate()).padStart(2, "0")}/{String(diaActual.getMonth() + 1).padStart(2, "0")}{" "}
          {formatearISO(diaActual) === hoyIso ? "HOY" : DIAS_SEMANA[diaActual.getDay()]}
        </span>
        <button
          type="button"
          onClick={() => ir(1)}
          disabled={!puedeAdelante}
          aria-label="Día siguiente"
          className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Móvil: tira de 7 días (DO/LU/MA/HOY/JU/VI/SA + fecha) — sin
          recuadro, solo texto (petición directa, según captura de
          referencia): el día elegido se distingue en dorado con una rayita
          debajo, el resto en un solo tono salvo los que no se pueden tocar
          (más tenues todavía, para no parecer clicables). */}
      <div className="grid grid-cols-7 gap-1 sm:hidden">
        {dias.map((dia) => {
          const iso = formatearISO(dia);
          const activo = habilitados.has(iso);
          const esHoy = iso === hoyIso;
          const seleccionado = iso === valor;
          return (
            <button
              key={iso}
              type="button"
              disabled={!activo}
              onClick={() => onCambiar(iso)}
              className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-colors ${
                !activo ? "text-slate/40 cursor-not-allowed" : seleccionado ? "text-goldDark" : "text-ink"
              }`}
            >
              <span>{esHoy ? "HOY" : DIAS_SEMANA[dia.getDay()]}</span>
              <span className={`font-mono ${seleccionado ? "font-bold" : "font-normal"}`}>
                {String(dia.getDate()).padStart(2, "0")}.{String(dia.getMonth() + 1).padStart(2, "0")}.
              </span>
              <span className={`h-0.5 w-6 rounded-full ${seleccionado ? "bg-goldDark" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
