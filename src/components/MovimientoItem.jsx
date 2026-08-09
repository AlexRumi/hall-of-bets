import { useState } from "react";
import { Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

const ESTILOS_TIPO = {
  ingreso: "bg-win/10 text-win",
  retirada: "bg-lose/10 text-lose",
};

const ETIQUETAS_TIPO = { ingreso: "Ingreso", retirada: "Retirada" };
const ETIQUETAS_CATEGORIA = { apuestas: "Apuestas", entretenimiento: "Entretenimiento" };

export default function MovimientoItem({ movimiento, casas, onBorrar }) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const logoCasa = casas.find((c) => c.nombre === movimiento.casa)?.logo;
  const Icono = movimiento.tipo === "ingreso" ? ArrowDownCircle : ArrowUpCircle;

  return (
    <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 flex items-center gap-3">
      {logoCasa && (
        <img
          src={logoCasa}
          alt=""
          className="w-10 h-10 rounded-lg object-contain shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-slate">{movimiento.fecha}</span>
          <span className="text-xs text-slate">·</span>
          <span className="text-base font-bold text-ink">{movimiento.casa}</span>
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              ESTILOS_TIPO[movimiento.tipo]
            }`}
          >
            <Icono size={12} />
            {ETIQUETAS_TIPO[movimiento.tipo]}
          </span>
          {movimiento.categoria && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
              {ETIQUETAS_CATEGORIA[movimiento.categoria]}
            </span>
          )}
        </div>
        <p
          className={`font-mono text-sm font-bold mt-1 ${
            movimiento.tipo === "ingreso" ? "text-win" : "text-lose"
          }`}
        >
          {movimiento.tipo === "ingreso" ? "+" : "-"}
          {movimiento.cantidad.toFixed(2)}€
        </p>
      </div>

      <button
        onClick={() => setConfirmandoBorrado(true)}
        aria-label="Borrar movimiento"
        className="text-slate hover:text-lose transition-colors p-1.5 shrink-0"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        abierto={confirmandoBorrado}
        titulo="Borrar movimiento"
        mensaje="Esta acción no se puede deshacer. ¿Seguro que quieres borrar este movimiento?"
        onConfirmar={() => {
          onBorrar(movimiento.id);
          setConfirmandoBorrado(false);
        }}
        onCancelar={() => setConfirmandoBorrado(false)}
      />
    </div>
  );
}
