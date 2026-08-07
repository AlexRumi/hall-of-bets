import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CampoCasa from "./CampoCasa";

const hoy = () => new Date().toISOString().slice(0, 10);

// Mismo patrón que FormularioMovimiento.jsx. "Motivo" es texto libre y
// opcional (p.ej. "Seguro perdido", "Bono de bienvenida") solo para
// recordar de dónde viene, no afecta a ningún cálculo.
export default function FormularioBono({ onAgregar, casas }) {
  const [fecha, setFecha] = useState(hoy());
  const [casa, setCasa] = useState("");
  const [importe, setImporte] = useState("");
  const [motivo, setMotivo] = useState("");

  function manejarEnvio(e) {
    e.preventDefault();
    const casaFinal = casa.trim();
    if (!casaFinal || !importe) return;

    onAgregar({ fecha, casa: casaFinal, importe, motivo: motivo.trim() });

    setCasa("");
    setImporte("");
    setMotivo("");
    setFecha(hoy());
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        Nuevo bono pendiente
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <CampoCasa casas={casas} valor={casa} onCambiar={setCasa} />

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

        <div>
          <label className="block text-xs text-slate mb-1">Motivo (opcional)</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Seguro perdido, bono de bienvenida"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={16} />
        Añadir bono pendiente
      </button>
    </form>
  );
}
