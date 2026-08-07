import { Clock } from "lucide-react";

const ETIQUETAS_SECCION = {
  apuestas: "Apuestas",
  entretenimiento: "Entretenimiento",
};

// Aviso de apuestas cuyo partido ya pasó y siguen en "Pendiente". No se
// muestra nada si no hay ninguna (ver PantallaInicio.jsx).
export default function AvisoPendientes({ pendientes, onIrASeccion }) {
  if (pendientes.length === 0) return null;

  const porCategoria = pendientes.reduce((acc, a) => {
    acc[a.categoria] = (acc[a.categoria] ?? 0) + 1;
    return acc;
  }, {});
  const categorias = Object.keys(porCategoria);

  return (
    <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Clock size={20} className="text-gold shrink-0" />
        <p className="text-sm text-ink">
          Tienes{" "}
          <span className="font-semibold">
            {pendientes.length}{" "}
            {pendientes.length === 1 ? "apuesta pendiente" : "apuestas pendientes"}
          </span>{" "}
          de partidos que ya deberían haber terminado.
          {categorias.length > 1 && (
            <span className="text-slate">
              {" "}
              ({categorias
                .map((c) => `${porCategoria[c]} en ${ETIQUETAS_SECCION[c]}`)
                .join(" · ")})
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        {categorias.map((categoria) => (
          <button
            key={categoria}
            type="button"
            onClick={() => onIrASeccion(categoria)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
          >
            Ver {ETIQUETAS_SECCION[categoria]}
          </button>
        ))}
      </div>
    </div>
  );
}
