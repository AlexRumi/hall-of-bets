import { useState } from "react";
import { GraduationCap, Search, ChevronDown, ChevronUp } from "lucide-react";
import { CONCEPTOS } from "../utils/academia";

// Sección educativa: acordeón con los 12 conceptos, buscador de texto libre.
export default function Academia() {
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);

  const conceptosFiltrados = CONCEPTOS.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 text-center space-y-2">
        <GraduationCap size={28} className="text-gold mx-auto" />
        <p className="font-display text-lg font-semibold text-ink">Academia</p>
        <p className="text-sm text-slate">
          Conceptos básicos de apuestas, explicados sin complicarse.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar un concepto..."
          className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {conceptosFiltrados.length === 0 ? (
        <p className="text-center text-sm text-slate py-10">
          Ningún concepto coincide con "{busqueda}".
        </p>
      ) : (
        <div className="space-y-3">
          {conceptosFiltrados.map((concepto) => {
            const abierto = expandido === concepto.id;
            return (
              <div
                key={concepto.id}
                className="bg-surface border border-line rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandido(abierto ? null : concepto.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-paperDim transition-colors"
                >
                  <span className="font-display text-base font-semibold text-ink">
                    {concepto.nombre}
                  </span>
                  {abierto ? (
                    <ChevronUp size={18} className="text-slate shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate shrink-0" />
                  )}
                </button>

                {abierto && (
                  <div className="px-4 pb-4 space-y-3 border-t border-line pt-4">
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
