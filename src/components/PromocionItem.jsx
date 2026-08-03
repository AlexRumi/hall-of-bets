import { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

const ESTILOS_ESTADO = {
  pendiente: "bg-pending/10 text-pending",
  completada: "bg-win/10 text-win",
  perdida: "bg-lose/10 text-lose",
};

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  completada: "Completada",
  perdida: "Perdida",
};

export default function PromocionItem({ promocion, onResolver, onBorrar }) {
  // null = sin resolver todavía; "completada"/"perdida" = esperando que se confirme el beneficio neto.
  const [resolviendo, setResolviendo] = useState(null);
  const [beneficioNeto, setBeneficioNeto] = useState("");
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const esPendiente = promocion.estado === "pendiente";

  function confirmarResolucion(e) {
    e.preventDefault();
    if (beneficioNeto === "") return;
    onResolver(promocion.id, resolviendo, beneficioNeto);
    setResolviendo(null);
    setBeneficioNeto("");
  }

  return (
    <div className="bg-white border border-line rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-slate">{promocion.fecha}</span>
          <span className="text-xs text-slate">·</span>
          <span className="text-xs font-medium text-ink">{promocion.casa}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              ESTILOS_ESTADO[promocion.estado]
            }`}
          >
            {ETIQUETAS_ESTADO[promocion.estado]}
          </span>
        </div>
        <p className="text-sm text-ink mt-1 break-words">{promocion.tipo}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono text-xs text-slate">
          <span>Valor: {promocion.valor.toFixed(2)}€</span>
          {!esPendiente && (
            <span
              className={
                promocion.beneficioNeto > 0
                  ? "text-win"
                  : promocion.beneficioNeto < 0
                  ? "text-lose"
                  : "text-ink"
              }
            >
              Beneficio neto: {promocion.beneficioNeto > 0 ? "+" : ""}
              {promocion.beneficioNeto.toFixed(2)}€
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {esPendiente && resolviendo === null && (
          <>
            <button
              onClick={() => setResolviendo("completada")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-win text-win hover:bg-win/10 transition-colors"
            >
              Completada
            </button>
            <button
              onClick={() => setResolviendo("perdida")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-lose text-lose hover:bg-lose/10 transition-colors"
            >
              Perdida
            </button>
          </>
        )}

        {esPendiente && resolviendo !== null && (
          <form onSubmit={confirmarResolucion} className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={beneficioNeto}
              onChange={(e) => setBeneficioNeto(e.target.value)}
              placeholder="Beneficio neto"
              autoFocus
              required
              className="w-28 border border-line rounded-lg px-2 py-1.5 text-sm font-mono"
            />
            <button
              type="submit"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-felt text-paper"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setResolviendo(null)}
              className="text-xs text-slate hover:text-ink"
            >
              Cancelar
            </button>
          </form>
        )}

        <button
          onClick={() => setConfirmandoBorrado(true)}
          aria-label="Borrar promoción"
          className="text-slate hover:text-lose transition-colors p-1.5"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmandoBorrado}
        titulo="Borrar promoción"
        mensaje="Esta acción no se puede deshacer. ¿Seguro que quieres borrar esta promoción?"
        onConfirmar={() => {
          onBorrar(promocion.id);
          setConfirmandoBorrado(false);
        }}
        onCancelar={() => setConfirmandoBorrado(false)}
      />
    </div>
  );
}
