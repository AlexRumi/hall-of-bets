import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CampoCasa from "./CampoCasa";
import BotonInfoConcepto from "./BotonInfoConcepto";

// Igual que el bono de depósito (FormularioMovimiento.jsx) y el seguro de
// una apuesta perdida (App.jsx), este formulario suma directamente al saldo
// de freebet de la casa (useCasas.js) — antes creaba un "bono pendiente"
// que había que resolver a mano aparte ("Ya lo registré"), y ese paso
// intermedio se quedaba sin hacer casi siempre, así que el saldo nunca
// reflejaba el bono real. Queda solo para el caso residual: bonos que no
// vienen de un depósito ni de una apuesta asegurada (ej. bono de
// cumpleaños, compensación de soporte, un bono suelto de la casa).
export default function FormularioBono({ onAjustarSaldoFreebet, casas, casaFija = null }) {
  const [casa, setCasa] = useState(casaFija ?? "");
  const [importe, setImporte] = useState("");

  function manejarEnvio(e) {
    e.preventDefault();
    const casaFinal = (casaFija ?? casa).trim();
    if (!casaFinal || !importe) return;

    onAjustarSaldoFreebet(casaFinal, Number(importe));

    setCasa(casaFija ?? "");
    setImporte("");
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-dashed border-line rounded-lg p-3 sm:p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold text-ink">Otro bono</h2>
        <BotonInfoConcepto conceptoId="bono" etiqueta="Bono / Freebet" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {casaFija === null && (
          <CampoCasa casas={casas} valor={casa} onCambiar={setCasa} />
        )}

        <div>
          <label className="block text-xs text-slate mb-1">Importe (€)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-felt text-paper px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={14} />
        Añadir
      </button>
    </form>
  );
}
