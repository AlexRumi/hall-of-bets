import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIAS_MERCADO, equiposDesdeEvento, buscarMercadoPorTexto } from "../utils/mercados";
import { usePosicionDesplegable } from "../hooks/usePosicionDesplegable";

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
  const encontrado = buscarMercadoPorTexto(valorApuesta, equipos);
  return encontrado ? `${encontrado.categoriaId}|${encontrado.opcionId}` : OTRO;
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
// z-50 (Fase E): con z-20 el panel quedaba tapado por la barra inferior
// móvil (z-40, BarraInferiorMovil.jsx) al abrirse cerca del final de la
// pantalla — no llegaba a verse "Otro mercado". usePosicionDesplegable.js
// decide además si abre hacia abajo o hacia arriba según el hueco libre.
export default function SelectorMercado({ evento, valor, onCambiar }) {
  const equipos = equiposDesdeEvento(evento);
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(valor, equipos));
  const [abierto, setAbierto] = useState(false);
  // Acordeón: una sola categoría abierta a la vez, para que el panel no sea
  // tan largo — al abrir, empieza expandida la categoría de la selección
  // actual (si hay una), para no esconder lo ya elegido.
  const [categoriaAbierta, setCategoriaAbierta] = useState(() =>
    seleccion && seleccion !== OTRO ? seleccion.split("|")[0] : null
  );
  const contenedorRef = useRef(null);
  const posicion = usePosicionDesplegable(abierto, contenedorRef);

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
    <div ref={contenedorRef} className="relative">
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
        <div
          className={`absolute z-50 w-full bg-surface border border-line rounded-lg shadow-lg overflow-y-auto ${
            posicion.arriba ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{ maxHeight: posicion.maxAltura }}
        >
          {CATEGORIAS_MERCADO.map((categoria) => {
            const categoriaExpandida = categoriaAbierta === categoria.id;
            return (
              <div key={categoria.id}>
                <button
                  type="button"
                  onClick={() =>
                    setCategoriaAbierta((actual) => (actual === categoria.id ? null : categoria.id))
                  }
                  className="sticky top-0 z-10 w-full flex items-center justify-between gap-2 bg-felt px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold"
                >
                  {categoria.etiqueta}
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform ${categoriaExpandida ? "rotate-180" : ""}`}
                  />
                </button>
                {categoriaExpandida &&
                  categoria.opciones.map((opcion) => {
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
            );
          })}
          <button
            type="button"
            onClick={() => elegir(OTRO)}
            className={`w-full text-left px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-t border-gold/30 transition-colors ${
              seleccion === OTRO ? "bg-gold text-felt" : "bg-felt text-gold hover:bg-feltDark"
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
          className="w-full border border-line rounded-lg px-3 py-2 text-sm mt-2"
        />
      )}
    </div>
  );
}
