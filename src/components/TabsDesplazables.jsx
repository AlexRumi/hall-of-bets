import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fila de pestañas horizontales con scroll, reutilizada por
// SelectorMercado.jsx (categorías de mercado) y BuscadorEvento.jsx (país):
// desvanecido sutil en el borde derecho para insinuar que hay más
// contenido, y flechas ‹ › solo en dispositivos con ratón de verdad
// (`.mq-solo-raton`, ver index.css) — en táctil el deslizado con el dedo
// ya es suficiente y las flechas solo estorban.
//
// "opciones" es [{ valor, texto, icono? }]; "icono" (opcional, p.ej. una
// bandera) se pinta solo SIN ratón (`.mq-oculto-raton`) delante del texto.
// "colorActivo" cambia el color de la pestaña seleccionada: "felt" (por
// defecto, mismo tono que el resto de toggles de la app) o "gold" (mercado,
// para distinguirla del resto de acentos dorados de esa pantalla).
export default function TabsDesplazables({ opciones, valor, onElegir, colorActivo = "felt" }) {
  const scrollRef = useRef(null);

  function desplazar(direccion) {
    scrollRef.current?.scrollBy({ left: direccion * 140, behavior: "smooth" });
  }

  const claseActiva =
    colorActivo === "gold" ? "bg-gold text-feltDark border-gold" : "bg-felt text-paper border-felt";

  return (
    <div className="relative min-w-0 border-b border-line">
      <button
        type="button"
        onClick={() => desplazar(-1)}
        aria-label="Desplazar pestañas a la izquierda"
        className="mq-solo-raton absolute left-0.5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-6 h-6 rounded-full bg-surface border border-line text-slate hover:text-gold"
      >
        <ChevronLeft size={14} />
      </button>

      <div
        ref={scrollRef}
        className="mq-tabs-scroll scrollbar-oculto flex gap-1.5 overflow-x-auto py-2"
      >
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => onElegir(opcion.valor)}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
              valor === opcion.valor ? claseActiva : "border-line text-slate hover:text-ink"
            }`}
          >
            {opcion.icono && <span className="mq-oculto-raton">{opcion.icono}</span>}
            {opcion.texto}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => desplazar(1)}
        aria-label="Desplazar pestañas a la derecha"
        className="mq-solo-raton absolute right-0.5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-6 h-6 rounded-full bg-surface border border-line text-slate hover:text-gold"
      >
        <ChevronRight size={14} />
      </button>

      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-surface pointer-events-none" />
    </div>
  );
}
