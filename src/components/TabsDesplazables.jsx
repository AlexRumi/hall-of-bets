import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fila de pestañas horizontales con scroll, reutilizada por
// SelectorMercado.jsx (categorías de mercado) y BuscadorEvento.jsx (país):
// en táctil el deslizado con el dedo ya indica que se puede seguir
// deslizando; en escritorio las flechas ‹ › (solo con ratón de verdad, vía
// `.mq-solo-raton`, ver index.css) hacen ese mismo papel. Hubo un
// desvanecido en el borde derecho a modo de pista visual, pero se quitó
// (petición directa): con una pestaña activa justo en el borde, el
// degradado le tapaba el texto y quedaba feo.
//
// "opciones" es [{ valor, texto, icono? }]; "icono" (opcional, p.ej. una
// bandera) se pinta solo SIN ratón (`.mq-oculto-raton`) delante del texto.
// "colorActivo" cambia el color de la pestaña seleccionada: "felt" (por
// defecto, mismo tono que el resto de toggles de la app) o "gold" (mercado,
// para distinguirla del resto de acentos dorados de esa pantalla).
// "compacto" (petición directa, para el nivel 2 de SelectorMercado.jsx):
// pestañas más pequeñas sobre un fondo propio (paperDim) — para que se note
// de un vistazo que es un nivel anidado dentro del nivel 1, no una fila más
// al mismo nivel.
export default function TabsDesplazables({
  opciones,
  valor,
  onElegir,
  colorActivo = "felt",
  compacto = false,
}) {
  const scrollRef = useRef(null);

  function desplazar(direccion) {
    scrollRef.current?.scrollBy({ left: direccion * 140, behavior: "smooth" });
  }

  const claseActiva =
    colorActivo === "gold" ? "bg-gold text-feltDark border-gold" : "bg-felt text-paper border-felt";

  return (
    <div
      className={`relative min-w-0 border-b border-line -mx-3 ${compacto ? "bg-paperDim" : ""}`}
    >
      <button
        type="button"
        onClick={() => desplazar(-1)}
        aria-label="Desplazar pestañas a la izquierda"
        className="mq-solo-raton absolute left-0.5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-6 h-6 rounded-full bg-surface border border-line text-slate hover:text-gold"
      >
        <ChevronLeft size={14} />
      </button>

      {/* El -mx-3 de arriba (contenedor exterior) deja que todo el bloque
          —incluida la posición de las flechas y el desvanecido de abajo,
          que son hermanos de este div— llegue hasta el borde real de la
          tarjeta, igual que el resto de secciones (p.ej. el buscador de
          arriba, con su propio p-3). El px-3 de aquí recupera ese margen
          por dentro del scroll, para que la primera/última pestaña
          arranquen alineadas con el resto del contenido en reposo, aunque
          el área deslizable en sí llegue hasta el borde. Antes, sin
          ninguno de los dos, la fila arrancaba pegada al borde sin ese
          margen, y en móvil (donde no caben todas las pestañas) se veían
          cortadas a media palabra sin ningún indicio de que se podía
          deslizar. */}
      <div
        ref={scrollRef}
        className={`mq-tabs-scroll scrollbar-oculto flex overflow-x-auto px-3 ${
          compacto ? "gap-1 py-1.5" : "gap-1.5 py-2"
        }`}
      >
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => onElegir(opcion.valor)}
            className={`shrink-0 flex items-center gap-1 rounded-full font-semibold border whitespace-nowrap transition-colors ${
              compacto ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
            } ${valor === opcion.valor ? claseActiva : "border-line text-slate hover:text-ink"}`}
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
    </div>
  );
}
