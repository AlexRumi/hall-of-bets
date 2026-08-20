import { Clock } from "lucide-react";

const ETIQUETAS_SECCION = {
  apuestas: "Apuestas",
  entretenimiento: "Entretenimiento",
};

// Aviso de apuestas sin resolver, de los dos bankrolls a la vez. No se
// muestra nada si no hay ninguna (ver PantallaInicio.jsx). Un solo botón
// lleva a Historial con el filtro "Pendientes" ya puesto (antes había un
// botón por bankroll, y cada uno llevaba a una sección mezclada con el
// resto de apuestas de ese bankroll — con los dos bankrolls a la vez ya no
// hace falta elegir, ni se queda ninguno sin visibilidad).
export default function AvisoPendientes({ pendientes, onVerPendientes }) {
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
          </span>
          .
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

      <button
        type="button"
        onClick={onVerPendientes}
        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
      >
        Ver pendientes
      </button>
    </div>
  );
}
