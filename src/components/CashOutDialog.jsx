import { useState } from "react";

// Pide el importe que ha pagado la casa al cerrar la apuesta antes de
// tiempo — a diferencia de Ganada/Perdida/Nula, este dato no se puede
// calcular solo (lo decide la casa en el momento), así que hace falta
// preguntarlo antes de guardar el resultado.
export default function CashOutDialog({ abierto, onConfirmar, onCancelar }) {
  const [importe, setImporte] = useState("");

  if (!abierto) return null;

  function manejarConfirmar(e) {
    e.preventDefault();
    if (!importe || Number(importe) < 0) return;
    onConfirmar(Number(importe));
    setImporte("");
  }

  function manejarCancelar() {
    setImporte("");
    onCancelar();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 pb-4 pt-36 md:pt-20 z-50">
      <form
        onSubmit={manejarConfirmar}
        className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full space-y-4"
      >
        <h3 className="font-display text-lg font-semibold text-ink">Cash Out</h3>
        <p className="text-sm text-slate">
          ¿Cuánto te ha pagado la casa al cerrar esta apuesta antes de tiempo?
        </p>
        <div>
          <label className="block text-xs text-slate mb-1">Importe recibido (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            autoFocus
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={manejarCancelar}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-line text-slate hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cashout text-paper hover:opacity-90 transition-opacity"
          >
            Confirmar
          </button>
        </div>
      </form>
    </div>
  );
}
