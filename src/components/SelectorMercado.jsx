import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIAS_MERCADO, equiposDesdeEvento } from "../utils/mercados";

const OTRO = "otro";

function buscarOpcion(valor) {
  const [catId, opId] = valor.split("|");
  return CATEGORIAS_MERCADO.find((c) => c.id === catId)?.opciones.find((o) => o.id === opId) ?? null;
}

// Si el texto ya guardado en "Apuesta" coincide con una opción del
// catálogo para este evento, la deja preseleccionada (para poder editar
// una apuesta ya creada); si no coincide con nada (apuestas de antes de
// este desplegable, o texto libre), abre directamente en "Otro mercado"
// para no esconder lo que ya había escrito.
function seleccionInicial(valorApuesta, equipos) {
  if (!valorApuesta) return "";
  for (const categoria of CATEGORIAS_MERCADO) {
    for (const opcion of categoria.opciones) {
      if (opcion.texto(equipos) === valorApuesta) return `${categoria.id}|${opcion.id}`;
    }
  }
  return OTRO;
}

function etiquetaSeleccion(seleccion, equipos) {
  if (seleccion === OTRO) return "Otro mercado";
  const opcion = buscarOpcion(seleccion);
  return opcion ? opcion.texto(equipos) : "Selecciona un mercado";
}

// Campo "Apuesta" de una selección (ver FormularioApuesta.jsx): desplegable
// propio (no un <select> nativo) para poder diferenciar de verdad la
// cabecera de cada categoría de sus opciones — un <select> con <optgroup>
// en móvil lo pinta el sistema operativo entero, sin dejar aplicar ningún
// estilo. Mismo patrón de "click fuera para cerrar" que BuscadorEvento.jsx.
export default function SelectorMercado({ evento, valor, onCambiar }) {
  const equipos = equiposDesdeEvento(evento);
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(valor, equipos));
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  function elegir(nuevaSeleccion) {
    setSeleccion(nuevaSeleccion);
    setAbierto(false);
    if (nuevaSeleccion === OTRO) return;
    const opcion = buscarOpcion(nuevaSeleccion);
    if (opcion) onCambiar(opcion.texto(equipos));
  }

  return (
    <div ref={contenedorRef} className="relative space-y-2">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="w-full flex items-center justify-between gap-2 border border-line rounded-lg px-3 py-2 text-sm bg-surface text-left"
      >
        <span
          className={`truncate ${!seleccion ? "text-slate" : seleccion === OTRO ? "font-bold text-ink" : "text-ink"}`}
        >
          {etiquetaSeleccion(seleccion, equipos)}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="absolute z-20 w-full bg-surface border border-line rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {CATEGORIAS_MERCADO.map((categoria) => (
            <div key={categoria.id}>
              <p className="sticky top-0 z-10 bg-felt px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                {categoria.etiqueta}
              </p>
              {categoria.opciones.map((opcion) => {
                const valorOpcion = `${categoria.id}|${opcion.id}`;
                return (
                  <button
                    key={opcion.id}
                    type="button"
                    onClick={() => elegir(valorOpcion)}
                    className={`w-full text-left px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors ${
                      seleccion === valorOpcion
                        ? "bg-gold/10 text-gold font-medium"
                        : "text-ink hover:bg-paperDim"
                    }`}
                  >
                    {opcion.texto(equipos)}
                  </button>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            onClick={() => elegir(OTRO)}
            className={`w-full text-left px-3 py-2.5 text-sm font-bold border-t-2 border-gold/50 transition-colors ${
              seleccion === OTRO ? "bg-gold/10 text-gold" : "text-ink hover:bg-paperDim"
            }`}
          >
            Otro mercado
          </button>
        </div>
      )}

      {seleccion === OTRO && (
        <input
          type="text"
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder="Ej. Gana Real Madrid"
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
