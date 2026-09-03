import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SelectorDesplegable from "./SelectorDesplegable";

const DIAS_SEMANA = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

// Una semana atrás, una semana adelante (15 días en total) — antes solo
// dejaba ayer/hoy/mañana, por una restricción del plan gratuito de
// API-Football (rango corto alrededor de hoy). Comprobado a mano contra
// GOAL API (proveedor actual, ver CLAUDE.md) que no existe esa
// restricción — cualquier fecha responde "success: true", nunca un
// error de "fuera de rango". Petición directa, con la referencia visual
// de Flashscore: escritorio con desplegable para saltar directo a
// cualquier día, móvil con tira deslizable (hoy centrado al abrir).
const DIAS_ATRAS_ADELANTE = 7;

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

export default function SelectorFecha({ valor, onCambiar }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyIso = formatearISO(hoy);

  const dias = Array.from(
    { length: DIAS_ATRAS_ADELANTE * 2 + 1 },
    (_, i) => sumarDias(hoy, i - DIAS_ATRAS_ADELANTE)
  );

  const indiceValor = dias.findIndex((dia) => formatearISO(dia) === valor);

  function ir(offset) {
    const nuevoIndice = (indiceValor === -1 ? DIAS_ATRAS_ADELANTE : indiceValor) + offset;
    if (nuevoIndice >= 0 && nuevoIndice < dias.length) onCambiar(formatearISO(dias[nuevoIndice]));
  }

  const puedeAtras = indiceValor === -1 || indiceValor > 0;
  const puedeAdelante = indiceValor === -1 || indiceValor < dias.length - 1;

  // Tira deslizable en móvil: al abrir, HOY empieza centrada (mismo
  // criterio visual que Flashscore) — solo al montar, para no pelearse
  // con el deslizado a mano del usuario en renders siguientes.
  const scrollRef = useRef(null);
  useEffect(() => {
    const contenedor = scrollRef.current;
    if (!contenedor) return;
    const indiceHoy = dias.findIndex((dia) => formatearISO(dia) === hoyIso);
    const elementoHoy = contenedor.children[indiceHoy];
    elementoHoy?.scrollIntoView({ inline: "center", block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Escritorio: flechas + desplegable para saltar directo a
          cualquiera de los 15 días, sin tener que darle 7 veces a "›". */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => ir(-1)}
          disabled={!puedeAtras}
          aria-label="Día anterior"
          className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="w-44">
          <SelectorDesplegable
            valor={valor}
            placeholder="Elegir fecha"
            onElegir={onCambiar}
            grupos={[
              {
                opciones: dias.map((dia) => {
                  const iso = formatearISO(dia);
                  return {
                    valor: iso,
                    texto: `${iso === hoyIso ? "HOY" : DIAS_SEMANA[dia.getDay()]} · ${String(
                      dia.getDate()
                    ).padStart(2, "0")}/${String(dia.getMonth() + 1).padStart(2, "0")}`,
                    destacado: iso === hoyIso,
                  };
                }),
              },
            ]}
          />
        </div>
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

      {/* Móvil: tira deslizable con el dedo, hoy centrada al abrir —
          mismo mecanismo de scroll horizontal que TabsDesplazables.jsx,
          pero con la celda de dos líneas (día de la semana + fecha) que
          ya tenía esto antes, así que no se reutiliza tal cual. */}
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-oculto sm:hidden snap-x snap-mandatory"
      >
        {dias.map((dia) => {
          const iso = formatearISO(dia);
          const esHoy = iso === hoyIso;
          const seleccionado = iso === valor;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onCambiar(iso)}
              className={`shrink-0 snap-center flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-bold transition-colors ${
                seleccionado ? "text-gold" : "text-ink"
              }`}
            >
              <span>{esHoy ? "HOY" : DIAS_SEMANA[dia.getDay()]}</span>
              <span className={`font-mono ${seleccionado ? "font-bold" : "font-normal"}`}>
                {String(dia.getDate()).padStart(2, "0")}.{String(dia.getMonth() + 1).padStart(2, "0")}.
              </span>
              <span className={`h-0.5 w-6 rounded-full ${seleccionado ? "bg-gold" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
