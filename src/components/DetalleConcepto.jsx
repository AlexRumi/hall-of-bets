import { X } from "lucide-react";

// Desarrollo completo de un concepto: extraído de Academia.jsx (donde antes
// vivía inline, empujando el resto del acordeón hacia abajo al expandirse)
// para poder reutilizarlo también dentro de un panel lateral en escritorio
// — mismo criterio que DetalleCasa.jsx/ApuestaItem.jsx. "onCerrar" solo
// llega desde el panel de escritorio (Academia.jsx no lo pasa en el uso
// inline de móvil): con él se pinta una cabecera propia (nombre + X) porque
// el panel tapa la fila que se tocó; sin él (móvil) no hace falta, la fila
// de arriba ya cumple ese papel.
export default function DetalleConcepto({ concepto, onCerrar }) {
  return (
    <div>
      {onCerrar && (
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-line">
          <h2 className="font-display text-lg font-semibold text-ink truncate">{concepto.nombre}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 text-slate hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className={onCerrar ? "p-4 sm:p-5 space-y-3" : "px-4 pb-4 pt-4 space-y-3 border-t border-line"}>
        <p className="text-sm text-ink">{concepto.definicion}</p>

        <div>
          <p className="text-xs font-medium text-slate mb-1">En cristiano</p>
          <p className="text-sm text-ink">{concepto.explicacion}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate mb-1">Fórmula</p>
          <p className="font-mono text-sm text-goldDark bg-paperDim rounded-lg px-3 py-2">
            {concepto.formula}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate mb-1">Ejemplo</p>
          <p className="text-sm text-ink">{concepto.ejemplo}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate mb-1">Cómo interpretarlo</p>
          <p className="text-sm text-ink">{concepto.interpretacion}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-lose mb-1">Errores frecuentes</p>
          <p className="text-sm text-ink">{concepto.erroresFrecuentes}</p>
        </div>
      </div>
    </div>
  );
}
