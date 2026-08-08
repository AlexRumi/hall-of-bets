import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePosicionDesplegable } from "../hooks/usePosicionDesplegable";

// Desplegable propio (botón + panel), no un <select> nativo — mismo motivo
// que ya llevó a construir SelectorMercado.jsx así: en móvil, un <select>
// con <optgroup> lo pinta el sistema operativo entero, sin dejar aplicar
// ningún estilo (las categorías se veían casi igual que las opciones).
// Reutilizado por CampoCasa.jsx y los selects de País/Competición de
// BuscadorEvento.jsx.
//
// "grupos" es un array de { etiqueta?, opciones: [{ valor, texto, destacado? }] }.
// Un grupo sin "etiqueta" no lleva cabecera (lista plana, como Casa o
// Competición); "destacado" resalta una opción en negrita (p.ej. "Otras
// ligas"). z-50, por encima de la barra inferior móvil (z-40,
// BarraInferiorMovil.jsx) para que el panel no quede tapado si se abre
// cerca del final de la pantalla, y usePosicionDesplegable.js decide si
// abre hacia abajo o hacia arriba según el hueco libre en cada momento.
export default function SelectorDesplegable({
  valor,
  placeholder,
  grupos,
  onElegir,
  disabled = false,
}) {
  const [abierto, setAbierto] = useState(false);
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

  const opcionActual = grupos.flatMap((g) => g.opciones).find((o) => o.valor === valor);

  function elegir(opcion) {
    onElegir(opcion.valor);
    setAbierto(false);
  }

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setAbierto((actual) => !actual)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 border border-line rounded-lg px-3 py-2 text-sm bg-surface text-left disabled:opacity-50"
      >
        <span
          className={`truncate ${
            !opcionActual ? "text-slate" : opcionActual.destacado ? "font-bold text-ink" : "text-ink"
          }`}
        >
          {opcionActual ? opcionActual.texto : placeholder}
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
          {grupos.map((grupo, i) => (
            <div key={grupo.etiqueta ?? i}>
              {grupo.etiqueta && (
                <p className="sticky top-0 z-10 bg-felt px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                  {grupo.etiqueta}
                </p>
              )}
              {grupo.opciones.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => elegir(opcion)}
                  className={`w-full text-left px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors ${
                    opcion.valor === valor
                      ? "bg-gold/10 text-gold font-medium"
                      : opcion.destacado
                      ? "font-bold text-ink hover:bg-paperDim"
                      : "text-ink hover:bg-paperDim"
                  }`}
                >
                  {opcion.texto}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
