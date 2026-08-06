import { useState } from "react";
import { Info, X } from "lucide-react";
import { CONCEPTOS } from "../utils/academia";

// Botón ℹ️ junto a una métrica: al pulsarlo, abre un recuadro con la
// explicación del concepto ahí mismo (sin navegar a Academia y tener que
// volver). Si no hay concepto asociado a esa métrica, no se renderiza nada.
export default function BotonInfoConcepto({ conceptoId, etiqueta }) {
  const [abierto, setAbierto] = useState(false);
  const concepto = CONCEPTOS.find((c) => c.id === conceptoId);

  if (!concepto) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Qué es ${etiqueta}`}
        className="text-slate hover:text-gold transition-colors"
      >
        <Info size={16} strokeWidth={2.5} />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setAbierto(false)}
        >
          <div
            className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full space-y-3 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-ink">
                {concepto.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="text-slate hover:text-ink transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

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
      )}
    </>
  );
}
