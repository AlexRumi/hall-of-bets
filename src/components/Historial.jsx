import { useEffect, useState } from "react";
import ListaApuestas from "./ListaApuestas";
import { todasPendientes } from "../utils/apuestas";

// Junta el listado de Apuestas + Entretenimiento en un solo sitio
// (petición directa), con las mismas 3 pastillas, más una cuarta
// pastilla "Pendientes" (solo visible si hay alguna) que combina los dos
// bankrolls — mismo listado
// agrupado por mes/día de siempre, sin ningún cálculo nuevo aparte de
// todasPendientes: solo se filtra antes de pasarle el array a
// ListaApuestas.
//
// "filtroInicial" (opcional): permite abrir esta sección con una pastilla
// ya elegida (ver App.jsx/AvisoPendientes.jsx — el botón "Ver pendientes"
// del aviso de Inicio). Solo se usa como valor inicial: una vez montado,
// el usuario puede cambiar de pastilla con normalidad.
export default function Historial({
  apuestas,
  casas,
  movimientos,
  onMarcarResultado,
  onAjustarGanancia,
  onMarcarResultadoPartido,
  onActualizarCuotaSeleccion,
  onBorrar,
  onAbrirEdicion,
  filtroInicial = null,
}) {
  const [filtroCategoria, setFiltroCategoria] = useState(filtroInicial);

  const pendientes = todasPendientes(apuestas);

  const PASTILLAS = [
    { id: null, etiqueta: "Todas" },
    { id: "apuestas", etiqueta: "Apuestas" },
    { id: "entretenimiento", etiqueta: "Entretenimiento" },
    ...(pendientes.length > 0 ? [{ id: "pendientes", etiqueta: "Pendientes" }] : []),
  ];

  // Si la pastilla "Pendientes" estaba elegida y deja de haber ninguna
  // (se resolvieron todas mientras se veía este filtro), vuelve a "Todas"
  // en vez de quedarse mostrando un listado vacío sin explicación.
  useEffect(() => {
    if (filtroCategoria === "pendientes" && pendientes.length === 0) {
      setFiltroCategoria(null);
    }
  }, [filtroCategoria, pendientes.length]);

  const apuestasFiltradas =
    filtroCategoria === "pendientes"
      ? pendientes
      : filtroCategoria
      ? apuestas.filter((a) => a.categoria === filtroCategoria)
      : apuestas;

  return (
    <div className="space-y-6">
      {/* flex-wrap (bug real): con las 4 pastillas (sobre todo
          "Entretenimiento", la más larga) no cabían en una sola línea en
          móvil — al llegar aquí con "Pendientes" ya seleccionada (la
          última, fuera de la pantalla), el navegador desplazaba toda la
          página hacia la derecha para dejarla a la vista. Envolviendo en
          una segunda línea en vez de desbordar, la página ya no tiene
          motivo para moverse. */}
      <div className="flex flex-wrap justify-center gap-2">
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
        onAjustarGanancia={onAjustarGanancia}
        onMarcarResultadoPartido={onMarcarResultadoPartido}
        onActualizarCuotaSeleccion={onActualizarCuotaSeleccion}
        onBorrar={onBorrar}
        onAbrirEdicion={onAbrirEdicion}
        agrupada
        denso
      />
    </div>
  );
}
