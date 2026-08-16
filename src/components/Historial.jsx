import { useState } from "react";
import ListaApuestas from "./ListaApuestas";

const PASTILLAS = [
  { id: null, etiqueta: "Todas" },
  { id: "apuestas", etiqueta: "Apuestas" },
  { id: "entretenimiento", etiqueta: "Entretenimiento" },
];

// Junta el listado de Apuestas + Entretenimiento en un solo sitio
// (petición directa), con las mismas 3 pastillas y el mismo criterio de
// "Todas" que ya usa el teclado del bot de Telegram
// (api/telegram-webhook.js) — mismo listado agrupado por mes/día de
// siempre, sin ningún cálculo nuevo: solo se filtra por categoría antes
// de pasarle el array a ListaApuestas.
export default function Historial({
  apuestas,
  casas,
  movimientos,
  onMarcarResultado,
  onMarcarResultadoPartido,
  onActualizarCuotaSeleccion,
  onBorrar,
  onEditar,
}) {
  const [filtroCategoria, setFiltroCategoria] = useState(null);

  const apuestasFiltradas = filtroCategoria
    ? apuestas.filter((a) => a.categoria === filtroCategoria)
    : apuestas;

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2">
        {PASTILLAS.map(({ id, etiqueta }) => (
          <button
            key={etiqueta}
            type="button"
            onClick={() => setFiltroCategoria(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroCategoria === id
                ? "bg-felt text-paper border-felt"
                : "border-line text-slate hover:text-ink"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <ListaApuestas
        apuestas={apuestasFiltradas}
        casas={casas}
        movimientos={movimientos}
        todasApuestas={apuestas}
        onMarcarResultado={onMarcarResultado}
        onMarcarResultadoPartido={onMarcarResultadoPartido}
        onActualizarCuotaSeleccion={onActualizarCuotaSeleccion}
        onBorrar={onBorrar}
        onEditar={onEditar}
        agrupada
        denso
      />
    </div>
  );
}
