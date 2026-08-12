import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePosicionDesplegable } from "../hooks/usePosicionDesplegable";

// Desplegable propio (botón + panel), no un <select> nativo — mismo motivo
// que ya llevó a construir SelectorMercado.jsx así: en móvil, un <select>
// con <optgroup> lo pinta el sistema operativo entero, sin dejar aplicar
// ningún estilo (las categorías se veían casi igual que las opciones).
// Reutilizado por CampoCasa.jsx y el desplegable de jugador de
// SelectorMercado.jsx.
//
// "grupos" es un array de { etiqueta?, opciones: [{ valor, texto, destacado? }] }.
// Un grupo sin "etiqueta" no lleva cabecera (lista plana, como Casa);
// "destacado" resalta una opción en negrita (p.ej. "Otras ligas"). z-50,
// por encima de la barra inferior móvil (z-40, BarraInferiorMovil.jsx)
// para que el panel no quede tapado si se abre cerca del final de la
// pantalla, y usePosicionDesplegable.js decide si abre hacia abajo o
// hacia arriba según el hueco libre en cada momento.
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

  // El panel va en "position: fixed" (ver usePosicionDesplegable.js) para
  // no depender de si algún contenedor por encima tiene scroll propio —
  // pero eso significa que ya no se mueve solo si SE SCROLLEA mientras
  // está abierto (antes, en "absolute", scrolleaba junto con el campo).
  // Más simple que perseguir la posición en cada scroll: cerrarlo. Con
  // "capture: true" se detecta el scroll de CUALQUIER contenedor
  // (el modal de detalle, no solo la ventana), no solo el de window.
  // Bug real: el panel, aunque "fixed" visualmente, sigue siendo hijo del
  // DOM de "contenedorRef" (fixed no lo saca del árbol) — así que hacer
  // scroll CON EL RATÓN DENTRO de la propia lista de jugadores (su propio
  // overflow-y-auto) también disparaba este mismo evento y cerraba el
  // panel de inmediato, sin dejar hacer scroll ahí dentro. Se ignora el
  // scroll cuando el objetivo del evento está dentro de "contenedorRef"
  // (el propio botón o panel) — mismo criterio que ya usa
  // "manejarClickFuera" para reconocer "esto es del propio desplegable".
  useEffect(() => {
    if (!abierto) return;
    function manejarScroll(e) {
      if (contenedorRef.current && contenedorRef.current.contains(e.target)) return;
      setAbierto(false);
    }
    window.addEventListener("scroll", manejarScroll, true);
    return () => window.removeEventListener("scroll", manejarScroll, true);
  }, [abierto]);

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
          className="fixed z-50 bg-surface border border-line rounded-lg shadow-lg overflow-y-auto"
          style={{
            left: posicion.left,
            width: posicion.width,
            maxHeight: posicion.maxAltura,
            ...(posicion.arriba ? { bottom: posicion.bottom + 4 } : { top: posicion.top + 4 }),
          }}
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
