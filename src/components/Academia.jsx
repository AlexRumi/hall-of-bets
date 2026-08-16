import { useState } from "react";
import { GraduationCap, Search, ChevronDown, ChevronUp } from "lucide-react";
import { CONCEPTOS, CATEGORIAS_ACADEMIA } from "../utils/academia";
import DetalleConcepto from "./DetalleConcepto";
import PanelLateral from "./PanelLateral";

// Sección educativa: acordeón con los conceptos agrupados por categoría
// (de fundamentos a avanzado, ver CATEGORIAS_ACADEMIA en utils/academia.js
// — mismo patrón que las categorías de Sala de Trofeos), con buscador de
// texto libre. Con solo ~17 conceptos y este buscador ya no hacía falta un
// filtro alfabético aparte: agrupar por tema ayuda más a encontrar algo
// relacionado que ir letra por letra.
export default function Academia() {
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);

  const conceptosFiltrados = CONCEPTOS.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );
  const conceptoAbierto = CONCEPTOS.find((c) => c.id === expandido) ?? null;

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
        <div className="space-y-6">
          {CATEGORIAS_ACADEMIA.map(({ id: categoriaId, etiqueta: categoriaEtiqueta }) => {
            const conceptosCategoria = conceptosFiltrados.filter(
              (c) => c.categoria === categoriaId
            );
            if (conceptosCategoria.length === 0) return null;

            return (
              <div key={categoriaId} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gold px-1">
                  {categoriaEtiqueta}
                </h3>
                {/* Dos columnas desde "lg:" (rediseño de escritorio ancho,
                    mismo criterio que Trofeos): cada fila es solo un título,
                    así que sueltas a todo el ancho dejaban mucho hueco vacío
                    junto al chevron. En móvil, una columna como siempre. */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {conceptosCategoria.map((concepto) => {
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

                        {/* Solo móvil: en escritorio el desarrollo se abre en
                            el panel lateral de más abajo. */}
                        {abierto && (
                          <div className="md:hidden">
                            <DetalleConcepto concepto={concepto} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Panel lateral de escritorio (PanelLateral ya es "hidden md:flex" de
          fábrica, así que en móvil no aparece nada aquí): mismo
          DetalleConcepto que el bloque inline de arriba. */}
      <PanelLateral abierto={!!conceptoAbierto} onCerrar={() => setExpandido(null)}>
        {conceptoAbierto && (
          <DetalleConcepto concepto={conceptoAbierto} onCerrar={() => setExpandido(null)} />
        )}
      </PanelLateral>
    </div>
  );
}
