import { Gift } from "lucide-react";

// Aviso de bonos/freebets pendientes de registrar (ver ListadoCasas.jsx,
// donde se gestionan de verdad). Mismo patrón que AvisoPendientes.jsx. No
// se muestra nada si no hay ninguno.
export default function AvisoBonos({ bonos, onIrACasas }) {
  if (bonos.length === 0) return null;

  const total = bonos.reduce((suma, b) => suma + b.importe, 0);

  return (
    <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Gift size={20} className="text-gold shrink-0" />
        <p className="text-sm text-ink">
          Tienes{" "}
          <span className="font-semibold">
            {bonos.length} {bonos.length === 1 ? "bono pendiente" : "bonos pendientes"} de
            registrar
          </span>{" "}
          ({total.toFixed(2)}€ en total).
        </p>
      </div>

      <button
        type="button"
        onClick={onIrACasas}
        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
      >
        Ver Casas
      </button>
    </div>
  );
}
